import { ODOO_CONFIG } from "./config";

// Odoo 18's External API is XML-RPC (/xmlrpc/2/common, /xmlrpc/2/object) —
// there is no Odoo 18 /jsonrpc external endpoint that behaves this way, and
// the newer /json/2 API is Odoo 19+ only. This project previously called
// /jsonrpc, which some Odoo 18 setups answer with an HTML page (a login
// screen or 404) instead of JSON — hence "Unexpected token '<'" when that
// HTML was fed straight into response.json(). Everything below talks real
// XML-RPC instead, and never assumes the response body is what it expects
// without checking first.

const REQUEST_TIMEOUT_MS = 10000;

// Recursive XML-RPC value shape — what encodeValue accepts and parseValue
// produces.
export type XmlRpcValue =
  | null
  | undefined
  | boolean
  | number
  | string
  | XmlRpcValue[]
  | { [key: string]: XmlRpcValue };

function escapeXml(str: unknown): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

// ---- Request encoding (JS value -> XML-RPC <value>) ----

function encodeValue(value: XmlRpcValue): string {
  if (value === null || value === undefined) return "<value><nil/></value>";
  if (typeof value === "boolean") return `<value><boolean>${value ? 1 : 0}</boolean></value>`;
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? `<value><int>${value}</int></value>`
      : `<value><double>${value}</double></value>`;
  }
  if (typeof value === "string") return `<value><string>${escapeXml(value)}</string></value>`;
  if (Array.isArray(value)) {
    return `<value><array><data>${value.map(encodeValue).join("")}</data></array></value>`;
  }
  if (typeof value === "object") {
    const members = Object.entries(value)
      .map(([key, v]) => `<member><name>${escapeXml(key)}</name>${encodeValue(v)}</member>`)
      .join("");
    return `<value><struct>${members}</struct></value>`;
  }
  throw new Error(`Unsupported XML-RPC value type: ${typeof value}`);
}

function buildRequestXml(methodName: string, params: XmlRpcValue[]): string {
  return (
    '<?xml version="1.0"?>' +
    `<methodCall><methodName>${methodName}</methodName>` +
    `<params>${params.map((p) => `<param>${encodeValue(p)}</param>`).join("")}</params>` +
    "</methodCall>"
  );
}

// ---- Response decoding (XML-RPC <value> -> JS value) ----
//
// A small hand-rolled tokenizer + recursive-descent parser rather than a
// handful of flat regexes — search_read (used by services/odoo/products.js
// and services/odoo/auth.js) returns arrays of structs with nested
// array/struct fields (e.g. many2one fields as [id, "Name"]), which flat
// regex extraction can't decode correctly. No XML parser ships with
// Node/Next by default, and pulling in a dependency for this narrow a need
// isn't worth it.

type Token = { type: "open" | "close"; name: string } | { type: "text"; text: string };

function tokenizeXml(xml: string): Token[] {
  const tokens: Token[] = [];
  const re = /<(\/?)([\w.]+)\s*(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    if (m[4] !== undefined) {
      const text = m[4].trim();
      if (text) tokens.push({ type: "text", text: decodeXmlEntities(text) });
    } else {
      const name = m[2];
      if (m[3] === "/") {
        tokens.push({ type: "open", name });
        tokens.push({ type: "close", name });
      } else {
        tokens.push({ type: m[1] === "/" ? "close" : "open", name });
      }
    }
  }
  return tokens;
}

function expectOpen(tokens: Token[], i: number, name: string): number {
  const t = tokens[i];
  if (!t || t.type !== "open" || t.name !== name) {
    throw new Error(`Malformed XML-RPC response: expected <${name}>.`);
  }
  return i + 1;
}

function expectClose(tokens: Token[], i: number, name: string): number {
  const t = tokens[i];
  if (!t || t.type !== "close" || t.name !== name) {
    throw new Error(`Malformed XML-RPC response: expected </${name}>.`);
  }
  return i + 1;
}

// Parses one <value>...</value> starting at tokens[i] (an "open value"
// token). Returns [jsValue, nextIndex].
function parseValue(tokens: Token[], i: number): [XmlRpcValue, number] {
  i = expectOpen(tokens, i, "value");

  if (tokens[i] && tokens[i].type === "close" && (tokens[i] as { name: string }).name === "value") {
    return ["", i + 1]; // <value></value> — empty string
  }
  if (tokens[i] && tokens[i].type === "text") {
    // Implicit string: <value>text</value>, no type tag.
    const text = (tokens[i] as { text: string }).text;
    i = expectClose(tokens, i + 1, "value");
    return [text, i];
  }

  const typeTag = (tokens[i] as { name: string }).name;
  i = expectOpen(tokens, i, typeTag);

  if (typeTag === "nil") {
    i = expectClose(tokens, i, "nil");
    i = expectClose(tokens, i, "value");
    return [null, i];
  }

  if (typeTag === "array") {
    i = expectOpen(tokens, i, "data");
    const arr: XmlRpcValue[] = [];
    while (!(tokens[i] && tokens[i].type === "close" && (tokens[i] as { name: string }).name === "data")) {
      const [val, ni] = parseValue(tokens, i);
      arr.push(val);
      i = ni;
    }
    i = expectClose(tokens, i, "data");
    i = expectClose(tokens, i, "array");
    i = expectClose(tokens, i, "value");
    return [arr, i];
  }

  if (typeTag === "struct") {
    const obj: { [key: string]: XmlRpcValue } = {};
    while (!(tokens[i] && tokens[i].type === "close" && (tokens[i] as { name: string }).name === "struct")) {
      i = expectOpen(tokens, i, "member");
      i = expectOpen(tokens, i, "name");
      const key = tokens[i] && tokens[i].type === "text" ? (tokens[i] as { text: string }).text : "";
      i = expectClose(tokens, key ? i + 1 : i, "name");
      const [val, ni] = parseValue(tokens, i);
      obj[key] = val;
      i = expectClose(tokens, ni, "member");
    }
    i = expectClose(tokens, i, "struct");
    i = expectClose(tokens, i, "value");
    return [obj, i];
  }

  // Scalar leaf: int, i4, boolean, double, string, dateTime.iso8601, base64.
  let text = "";
  if (tokens[i] && tokens[i].type === "text") {
    text = (tokens[i] as { text: string }).text;
    i++;
  }
  i = expectClose(tokens, i, typeTag);
  i = expectClose(tokens, i, "value");

  if (typeTag === "int" || typeTag === "i4") return [Number(text), i];
  if (typeTag === "double") return [Number(text), i];
  if (typeTag === "boolean") return [text === "1", i];
  return [text, i];
}

function parseFirstValue(xml: string, fromIndex: number): XmlRpcValue {
  const valueStart = xml.indexOf("<value", fromIndex);
  if (valueStart === -1) return null;
  const tokens = tokenizeXml(xml.slice(valueStart));
  const [value] = parseValue(tokens, 0);
  return value;
}

// ---- Transport ----

async function xmlRpcCall(endpoint: string, methodName: string, params: XmlRpcValue[]): Promise<XmlRpcValue> {
  if (!ODOO_CONFIG.baseUrl) {
    throw new Error("ODOO_URL is not set.");
  }

  const url = `${ODOO_CONFIG.baseUrl.replace(/\/+$/, "")}${endpoint}`;
  const body = buildRequestXml(methodName, params);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Odoo request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`);
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Could not reach the Odoo server: ${message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  // The actual bug this file exists to fix: a response (any status code)
  // whose body is an HTML page — wrong URL, wrong path, a login/error
  // screen — must never be handed to an XML or JSON parser. Check this
  // before anything else touches the body.
  const looksLikeHtml =
    contentType.includes("text/html") || /^\s*<!DOCTYPE/i.test(text) || /^\s*<html/i.test(text);
  if (looksLikeHtml) {
    throw new Error(
      "Odoo returned an HTML page. Check the server URL, database name and RPC endpoint."
    );
  }

  if (!response.ok) {
    throw new Error(`Odoo server returned HTTP ${response.status}.`);
  }

  const faultIdx = text.indexOf("<fault>");
  if (faultIdx !== -1) {
    const faultObj = parseFirstValue(text, faultIdx) as { faultString?: string } | null;
    throw new Error(
      (faultObj && faultObj.faultString) || "Odoo returned a fault with no message."
    );
  }

  const paramsIdx = text.indexOf("<params>");
  if (paramsIdx === -1) {
    throw new Error("Odoo returned an unexpected response with no result value.");
  }
  return parseFirstValue(text, paramsIdx);
}

// ---- Public API — Odoo 18 External RPC only (/xmlrpc/2/common, /xmlrpc/2/object) ----

// Step 1 of a connection test: confirms the endpoint is really an Odoo
// XML-RPC service before attempting to authenticate.
export async function odooVersion(): Promise<{ serverVersion: string }> {
  const result = (await xmlRpcCall("/xmlrpc/2/common", "version", [])) as { server_version?: string } | null;
  return { serverVersion: (result && result.server_version) || "unknown" };
}

// Step 2: authenticate(db, username, apiKey, {}) — the API key is used as
// the password, exactly as Odoo 18 expects. Success is a numeric uid;
// anything else (false, a fault) is a failure. Never logs db/apiKey.
export async function odooAuthenticate(): Promise<number> {
  if (!ODOO_CONFIG.db || !ODOO_CONFIG.username || !ODOO_CONFIG.apiKey) {
    throw new Error("ODOO_DATABASE, ODOO_USERNAME and ODOO_API_KEY must all be set.");
  }
  const uid = await xmlRpcCall("/xmlrpc/2/common", "authenticate", [
    ODOO_CONFIG.db,
    ODOO_CONFIG.username,
    ODOO_CONFIG.apiKey,
    {},
  ]);
  if (typeof uid !== "number") {
    throw new Error("Odoo authentication failed — check the username and API key.");
  }
  return uid;
}

// Step 3: object.execute_kw, authenticating fresh each call — this
// integration's call volume is low (checkout fallback, admin CRUD
// fallback, connection tests), so the extra round trip isn't worth the
// complexity of caching a uid across requests.
export async function executeKw(
  model: string,
  method: string,
  args: XmlRpcValue[] = [],
  kwargs: { [key: string]: XmlRpcValue } = {}
): Promise<XmlRpcValue> {
  const uid = await odooAuthenticate();
  return xmlRpcCall("/xmlrpc/2/object", "execute_kw", [
    ODOO_CONFIG.db,
    uid,
    ODOO_CONFIG.apiKey,
    model,
    method,
    args,
    kwargs,
  ]);
}
