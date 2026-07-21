import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { fetchNoResultSearches } from "@/services/db/search";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_SEARCH);
  if (!session) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { page = "1", pageSize = "20" } = req.query;
  const data = await fetchNoResultSearches({
    page: Math.max(1, Number(page) || 1),
    pageSize: Math.min(100, Math.max(1, Number(pageSize) || 20)),
  });
  return res.status(200).json(data);
}
