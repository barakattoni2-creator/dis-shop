import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { updateSetting } from "@/services/db/settings";

// Dedicated endpoint (rather than the generic key/value PUT) so the rate and
// its "last updated" timestamp are always written together, atomically, with
// the timestamp set server-side rather than trusting the admin's clock.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_SETTINGS);
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

  const { rate } = req.body || {};
  const parsed = Number(rate);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return res.status(400).json({ error: "Exchange rate must be a positive number." });
  }

  const updatedAt = new Date().toISOString();
  await updateSetting("exchangeRate", String(parsed));
  await updateSetting("exchangeRateUpdatedAt", updatedAt);

  return res.status(200).json({ rate: parsed, updatedAt });
}
