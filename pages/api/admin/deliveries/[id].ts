import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { updateOrder } from "@/services/db/orders";

// "Restrict financial ... actions by permission": this route's field
// whitelist is deliberately just `status` — even though updateOrder()
// itself accepts paymentStatus/discount/deliveryFee/etc., the Delivery
// role only has MANAGE_DELIVERIES (not MANAGE_ORDERS), so it's enforced
// here at the field level, not just hidden in the UI.
const ALLOWED_FIELDS = ["status"] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_DELIVERIES);
  if (!session) return;

  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isDbConfigured()) {
    return res.status(503).json({
      error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
    });
  }

  const id = req.query.id as string;
  const patch: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in (req.body || {})) patch[field] = req.body[field];
  }
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: "Nothing to update." });
  }

  const order = await updateOrder(id, patch, session.email);
  return res.status(200).json({ order });
}
