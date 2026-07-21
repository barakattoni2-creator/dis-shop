import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured, prisma } from "@/lib/db";
import { updateCategory, deleteCategory } from "@/services/db/categories";
import { logAdminActivity } from "@/services/db/adminActivity";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_CATEGORIES);
  if (!session) return;

  if (!isDbConfigured()) {
    return res.status(503).json({
      error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
    });
  }

  const id = req.query.id as string;

  if (req.method === "GET") {
    const category = await prisma!.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) return res.status(404).json({ error: "Category not found." });
    return res.status(200).json({ category });
  }

  if (req.method === "PUT") {
    try {
      const before = await prisma!.category.findUnique({ where: { id } });
      const category = await updateCategory(id, req.body || {});
      const changedFields = Object.keys(req.body || {}).join(", ");
      await logAdminActivity(
        session.email,
        "category_updated",
        `Updated "${before?.name || id}" (${changedFields})`,
        getClientIp(req)
      );
      return res.status(200).json({ category });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const before = await prisma!.category.findUnique({ where: { id } });
      await deleteCategory(id);
      await logAdminActivity(
        session.email,
        "category_deleted",
        `Deleted category "${before?.name || id}" (${before?.slug || ""})`,
        getClientIp(req)
      );
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
