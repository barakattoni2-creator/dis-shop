import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { ODOO_CONFIG } from "@/services/odoo/config";
import { odooVersion, odooAuthenticate, executeKw } from "@/services/odoo/client";
import { logAdminActivity } from "@/services/db/adminActivity";

// Odoo 18 External RPC only — /xmlrpc/2/common then /xmlrpc/2/object, run
// as three explicit, read-only steps so a failure clearly names which
// stage broke instead of a single opaque error. Works even while
// ODOO_SYNC_ENABLED=false, so credentials can be verified before turning
// sync on. Never echoes ODOO_DATABASE/ODOO_API_KEY back to the client.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_ODOO);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!ODOO_CONFIG.baseUrl || !ODOO_CONFIG.db) {
    return res.status(200).json({ ok: false, step: "config", error: "Odoo URL and database are not set." });
  }

  const steps: { version?: string; productCount?: unknown } = {};

  try {
    // 1. version() on /xmlrpc/2/common — confirms this is really an Odoo
    // XML-RPC endpoint before sending any credentials.
    const version = await odooVersion();
    steps.version = version.serverVersion;
  } catch (err) {
    await logAdminActivity(session.email, "odoo_test_connection", `Failed at version: ${(err as Error).message}`, getClientIp(req));
    return res.status(200).json({ ok: false, step: "version", error: (err as Error).message });
  }

  try {
    // 2. authenticate(db, username, apiKey, {}) — success is a numeric uid.
    await odooAuthenticate();
  } catch (err) {
    await logAdminActivity(session.email, "odoo_test_connection", `Failed at authenticate: ${(err as Error).message}`, getClientIp(req));
    return res.status(200).json({ ok: false, step: "authenticate", error: (err as Error).message });
  }

  try {
    // 3. A read-only search_count on product.product — never creates or
    // modifies any Odoo record.
    const count = await executeKw("product.product", "search_count", [[]]);
    steps.productCount = count;
  } catch (err) {
    await logAdminActivity(session.email, "odoo_test_connection", `Failed at search_count: ${(err as Error).message}`, getClientIp(req));
    return res.status(200).json({ ok: false, step: "search_count", error: (err as Error).message });
  }

  await logAdminActivity(
    session.email,
    "odoo_test_connection",
    `Success — Odoo ${steps.version}, ${steps.productCount} product(s).`,
    getClientIp(req)
  );
  return res.status(200).json({ ok: true, ...steps });
}
