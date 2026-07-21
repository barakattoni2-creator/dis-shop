import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchOrdersForAdmin, createOrder } from "@/services/db/orders";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_ORDERS);
  if (!session) return;

  if (req.method === "GET") {
    if (!isDbConfigured()) return res.status(200).json({ rows: [], total: 0, page: 1, pageSize: 20 });
    const { q = "", status = "", payment = "", paymentStatus = "", dateFrom = "", dateTo = "", archived = "", page = "1", pageSize = "20" } =
      req.query;
    const data = await fetchOrdersForAdmin({
      q: String(q),
      status: String(status),
      payment: String(payment),
      paymentStatus: String(paymentStatus),
      dateFrom: String(dateFrom),
      dateTo: String(dateTo),
      includeArchived: archived === "true",
      page: Math.max(1, Number(page) || 1),
      pageSize: Math.min(200, Math.max(1, Number(pageSize) || 20)),
    });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    if (!isDbConfigured()) {
      return res.status(503).json({
        error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
      });
    }
    const { customerName, items } = req.body || {};
    if (!customerName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "customerName and at least one item are required." });
    }
    const order = await createOrder({ ...req.body, actor: session.email });
    return res.status(201).json({ order });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
