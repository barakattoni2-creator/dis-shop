import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { logOrderActivity } from "@/services/db/orders";

const ALLOWED_TYPES = [
  "invoice_generated",
  "whatsapp_sent",
  "delivery_completed",
  "note",
];

// Logs one-off activity entries the admin UI can't infer from a field
// update alone (invoice/print actions, WhatsApp sends, manual notes).
// Status and payment-status changes are logged automatically by
// updateOrder() in services/db/orders.js.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_ORDERS);
  if (!session) return;

  if (!isDbConfigured()) {
    return res.status(503).json({
      error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const id = req.query.id as string;
  const { type, message } = req.body || {};
  if (!ALLOWED_TYPES.includes(type) || !message?.trim()) {
    return res.status(400).json({ error: "A valid type and message are required." });
  }

  const activity = await logOrderActivity(id, type, message.trim(), session.email);
  return res.status(201).json({ activity });
}
