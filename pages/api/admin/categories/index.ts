import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchCategories, fetchCategoriesFlat, fetchCategoryTree, createCategory } from "@/services/db/categories";
import { logAdminActivity } from "@/services/db/adminActivity";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_CATEGORIES);
  if (!session) return;

  if (req.method === "GET") {
    const format = req.query.format;
    if (format === "tree") {
      const tree = await fetchCategoryTree();
      return res.status(200).json({ tree });
    }
    if (format === "flat") {
      const categories = await fetchCategoriesFlat();
      return res.status(200).json({ categories });
    }
    const categories = await fetchCategories();
    return res.status(200).json({ categories });
  }

  if (req.method === "POST") {
    if (!isDbConfigured()) {
      return res.status(503).json({
        error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
      });
    }
    try {
      const category = await createCategory(req.body || {});
      await logAdminActivity(
        session.email,
        "category_created",
        `Created category "${category.name}" (${category.slug})`,
        getClientIp(req)
      );
      return res.status(201).json({ category });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
