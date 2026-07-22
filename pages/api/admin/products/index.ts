import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchProductsForAdmin, createProduct } from "@/services/db/products";
import { logAdminActivity } from "@/services/db/adminActivity";
import type { ProductStatus } from "@/types/domain";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_PRODUCTS);
  if (!session) return;

  if (!isDbConfigured()) {
    return res.status(503).json({
      error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
    });
  }

  if (req.method === "GET") {
    const { q = "", status = "ALL", category, brand, page = "1", pageSize = "25" } = req.query;
    const data = await fetchProductsForAdmin({
      q: String(q),
      status: status as ProductStatus | "ALL",
      category: category ? String(category) : undefined,
      brand: brand ? String(brand) : undefined,
      page: Math.max(1, Number(page) || 1),
      pageSize: Math.min(200, Math.max(1, Number(pageSize) || 25)),
    });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    try {
      const product = await createProduct(req.body || {});
      await logAdminActivity(session.email, "product_created", `Created "${product.name}"`, getClientIp(req));
      return res.status(201).json({ product });
    } catch (err) {
      const code = (err as { code?: string; meta?: { target?: string[] } }).code;
      if (code === "P2002") {
        const target = (err as { meta?: { target?: string[] } }).meta?.target?.join(", ") || "field";
        return res.status(409).json({ error: `That ${target} is already in use by another product.` });
      }
      throw err;
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
