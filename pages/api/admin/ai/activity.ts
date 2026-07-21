import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { fetchAiActivity } from "@/services/db/aiActivity";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_AI);
  if (!session) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { page, pageSize } = req.query;
  const result = await fetchAiActivity({
    page: page ? Number(page) : 1,
    pageSize: pageSize ? Number(pageSize) : 30,
  });
  return res.status(200).json(result);
}
