import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured, prisma } from "@/lib/db";
import { moveCategory } from "@/services/db/categories";
import { logAdminActivity } from "@/services/db/adminActivity";

// Reparent a category — dropping it onto a different category in the admin
// tree. Rejects circular relationships and depths beyond 3 levels (see
// services/db/categories.js).
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

  const { id, newParentId } = req.body || {};
  if (!id) return res.status(400).json({ error: "id is required." });

  try {
    const before = await prisma!.category.findUnique({ where: { id } });
    const newParent = newParentId
      ? await prisma!.category.findUnique({ where: { id: newParentId } })
      : null;
    const category = await moveCategory(id, newParentId || null);
    await logAdminActivity(
      session.email,
      "category_moved",
      `Moved "${before?.name || id}" under "${newParent?.name || "Top Level"}"`,
      getClientIp(req)
    );
    return res.status(200).json({ category });
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
}
