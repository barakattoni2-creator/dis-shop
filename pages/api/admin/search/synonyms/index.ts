import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchSynonymGroups, createSynonymGroup } from "@/services/db/search";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_SEARCH);
  if (!session) return;

  if (!isDbConfigured()) {
    return res.status(503).json({ error: "No database connected. Set DATABASE_URL in .env.local." });
  }

  if (req.method === "GET") {
    const groups = await fetchSynonymGroups();
    return res.status(200).json({ groups });
  }

  if (req.method === "POST") {
    try {
      const group = await createSynonymGroup(req.body || {});
      return res.status(201).json({ group });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
