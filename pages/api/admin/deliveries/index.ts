import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchOrdersForAdmin } from "@/services/db/orders";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_DELIVERIES);
  if (!session) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isDbConfigured()) return res.status(200).json({ rows: [], total: 0, page: 1, pageSize: 20 });

  const { status = "", page = "1", pageSize = "20" } = req.query;
  const data = await fetchOrdersForAdmin({
    status: String(status),
    page: Math.max(1, Number(page) || 1),
    pageSize: Math.min(100, Math.max(1, Number(pageSize) || 20)),
  });
  return res.status(200).json(data);
}
