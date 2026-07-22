import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { fetchReportsData } from "@/services/db/reports";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.VIEW_FINANCIALS);
  if (!session) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
  const data = await fetchReportsData(days);
  return res.status(200).json(data);
}
