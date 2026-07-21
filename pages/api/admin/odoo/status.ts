import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { ODOO_CONFIG, isOdooConfigured } from "@/services/odoo/config";

function hostnameOnly(url: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return "•••";
  }
}

// Never returns ODOO_CONFIG.apiKey — only presence booleans and non-secret
// identifiers (hostname, database name, version) for display.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_ODOO);
  if (!session) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json({
    configured: isOdooConfigured(),
    syncEnabled: ODOO_CONFIG.syncEnabled,
    hasUrl: Boolean(ODOO_CONFIG.baseUrl),
    hasDatabase: Boolean(ODOO_CONFIG.db),
    hasUsername: Boolean(ODOO_CONFIG.username),
    hasApiKey: Boolean(ODOO_CONFIG.apiKey),
    hostname: hostnameOnly(ODOO_CONFIG.baseUrl),
    database: ODOO_CONFIG.db,
    version: ODOO_CONFIG.version,
  });
}
