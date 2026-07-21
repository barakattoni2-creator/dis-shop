// Minimal RFC 4180 CSV parse/stringify — no external dependency needed for
// the small synonym/keyword import-export files this handles.

export function parseCsv(text: string | null | undefined): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const char = src[i];
    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
  if (nonEmpty.length === 0) return [];
  const header = nonEmpty[0].map((h) => h.trim());
  return nonEmpty.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((key, idx) => {
      obj[key] = (r[idx] ?? "").trim();
    });
    return obj;
  });
}

function escapeCell(value: unknown): string {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((col) => escapeCell(row[col])).join(","));
  }
  return lines.join("\n");
}

// These CSV cells hold multi-value fields (synonym terms, tag lists) as a
// single semicolon-separated string, since commas already delimit columns.
export function splitList(value: string | null | undefined): string[] {
  return String(value || "")
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function joinList(values: string[] | null | undefined): string {
  return (values || []).join(";");
}
