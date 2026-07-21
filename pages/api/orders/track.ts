import type { NextApiRequest, NextApiResponse } from "next";
import { isDbConfigured } from "@/lib/db";
import { findOrderByNumberAndPhone } from "@/services/db/orders";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orderNumber, phone } = req.body || {};
  if (!orderNumber?.trim() || !phone?.trim()) {
    return res.status(400).json({ error: "Order number and phone number are required." });
  }

  if (!isDbConfigured()) {
    return res.status(503).json({ error: "Order tracking is temporarily unavailable." });
  }

  try {
    const order = await findOrderByNumberAndPhone(orderNumber, phone);
    if (!order) {
      // Same response for "no such order" and "wrong phone" — never confirm
      // whether an order number is real.
      return res.status(404).json({ error: "not_found" });
    }
    return res.status(200).json({ order });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
