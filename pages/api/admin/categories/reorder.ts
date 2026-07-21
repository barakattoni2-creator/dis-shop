import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { reorderCategories } from "@/services/db/categories";
import { logAdminActivity } from "@/services/db/adminActivity";

// Bulk display-order update for one set of siblings — used by the admin
// tree's drag-and-drop reorder (dropping a category above/below another
// under the same parent).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_CATEGORIES);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isDbConfigured()) {
    return res.status(503).json({ error: "No database connected." });
  }

  const { parentId, orderedIds } = req.body || {};
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return res.status(400).json({ error: "orderedIds must be a non-empty array." });
  }

  try {
    await reorderCategories(parentId || null, orderedIds);
    await logAdminActivity(
      session.email,
      "category_reordered",
      `Reordered ${orderedIds.length} categor${orderedIds.length === 1 ? "y" : "ies"}`,
      getClientIp(req)
    );
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
}
