import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchSettings, updateSetting } from "@/services/db/settings";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_SETTINGS);
  if (!session) return;

  if (req.method === "GET") {
    const settings = await fetchSettings();
    return res.status(200).json({ settings });
  }

  if (req.method === "PUT") {
    if (!isDbConfigured()) {
      return res.status(503).json({
        error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
      });
    }
    const { key, value } = req.body || {};
    if (!key) return res.status(400).json({ error: "key is required." });
    await updateSetting(key, value ?? "");
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
}
