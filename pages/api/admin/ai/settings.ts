import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { fetchAiSettings, updateAiSetting } from "@/services/db/aiSettings";
import { logAdminActivity } from "@/services/db/adminActivity";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_AI);
  if (!session) return;

  if (req.method === "GET") {
    const settings = await fetchAiSettings();
    return res.status(200).json({ settings });
  }

  if (req.method === "PUT") {
    try {
      const { key, value } = req.body || {};
      await updateAiSetting(key, value);
      await logAdminActivity(session.email, "ai_setting_updated", `${key} = ${value}`, getClientIp(req));
      const settings = await fetchAiSettings();
      return res.status(200).json({ settings });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
}
