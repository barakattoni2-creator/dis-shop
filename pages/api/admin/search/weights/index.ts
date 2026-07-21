import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchPriorityWeights, updatePriorityWeights } from "@/services/db/search";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_SEARCH);
  if (!session) return;

  if (req.method === "GET") {
    const weights = await fetchPriorityWeights();
    return res.status(200).json({ weights });
  }

  if (req.method === "PUT") {
    if (!isDbConfigured()) {
      return res.status(503).json({ error: "No database connected. Set DATABASE_URL in .env.local." });
    }
    const weights = await updatePriorityWeights(req.body?.weights || {});
    return res.status(200).json({ weights });
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
}
