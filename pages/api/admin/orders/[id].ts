import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchOrderDetail, updateOrder, deleteOrder } from "@/services/db/orders";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_ORDERS);
  if (!session) return;

  if (!isDbConfigured()) {
    return res.status(503).json({
      error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
    });
  }

  const id = req.query.id as string;

  if (req.method === "GET") {
    const order = await fetchOrderDetail(id);
    if (!order) return res.status(404).json({ error: "Order not found." });
    return res.status(200).json({ order });
  }

  if (req.method === "PUT" || req.method === "PATCH") {
    const order = await updateOrder(id, req.body || {}, session.email);
    return res.status(200).json({ order });
  }

  if (req.method === "DELETE") {
    // Not offered by the Orders Management UI (orders are cancelled or
    // archived instead — see the spec's "do not delete by default") but
    // kept available for direct API use if a real cleanup is ever needed.
    await deleteOrder(id);
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, PUT, PATCH, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
