// Server-only — this module is only ever imported from services/odoo/client.js
// and API routes/getServerSideProps that import it transitively, never from
// client components, so none of this needs (or should have) a NEXT_PUBLIC_
// prefix. It previously read NEXT_PUBLIC_ODOO_URL/DB/UID, which both leaked
// the URL/DB/UID into the browser bundle AND didn't match any variable name
// actually set in .env.local (ODOO_URL/ODOO_DATABASE/ODOO_USERNAME) — so
// isOdooConfigured() was silently always false. Both are fixed here.
export const ODOO_CONFIG = {
  baseUrl: process.env.ODOO_URL || "",
  db: process.env.ODOO_DATABASE || "",
  // Holds a login (email/username), not a numeric id — the real numeric
  // uid Odoo's execute_kw needs only ever comes back from a fresh
  // authenticate() call (see services/odoo/client.js), never from config.
  username: process.env.ODOO_USERNAME || "",
  apiKey: process.env.ODOO_API_KEY || "",
  version: process.env.ODOO_VERSION || "",
  syncEnabled: process.env.ODOO_SYNC_ENABLED === "true",
};

// ODOO_SYNC_ENABLED is an explicit kill switch, independent of whether
// URL/DB look filled in — lets an admin stage real-looking credentials
// without the site trying to actually call them until sync is turned on.
export function isOdooConfigured(): boolean {
  return Boolean(ODOO_CONFIG.baseUrl && ODOO_CONFIG.db && ODOO_CONFIG.syncEnabled);
}
