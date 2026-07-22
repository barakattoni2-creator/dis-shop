import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { reorderBanners } from "@/services/db/banners";
import { logAdminActivity } from "@/services/db/adminActivity";

// Bulk display-order update for the homepage banner list, used by the
// admin dashboard's drag-and-drop reorder — mirrors
// pages/api/admin/categories/reorder.ts, minus parent scoping since banners
// are a flat list.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_BANNERS);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isDbConfigured()) {
    return res.status(503).json({ error: "No database connected." });
  }

  const { orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ error: "orderedIds must be a non-empty array." });
  }

  try {
    await reorderBanners(orderedIds);
    await logAdminActivity(
      session.email,
      "banner_reordered",
      `Reordered ${orderedIds.length} banner${orderedIds.length === 1 ? "" : "s"}`,
      getClientIp(req)
    );
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
}
