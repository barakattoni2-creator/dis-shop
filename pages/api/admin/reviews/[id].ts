import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { deleteReview } from "@/services/db/reviews";

// API-level moderation (e.g. removing spam) — no dedicated admin UI page
// yet, but this is here so a review can be removed without touching the DB
// directly.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_PRODUCTS);
  if (!session) return;

  if (!isDbConfigured()) {
    return res.status(503).json({
      error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
    });
  }

  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const id = req.query.id as string;
  await deleteReview(id);
  return res.status(200).json({ ok: true });
}
