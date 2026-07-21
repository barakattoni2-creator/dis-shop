import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchProducts, createProduct } from "@/services/db/products";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_PRODUCTS);
  if (!session) return;

  if (!isDbConfigured()) {
    return res.status(503).json({
      error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
    });
  }

  if (req.method === "GET") {
    const products = await fetchProducts();
    return res.status(200).json({ products });
  }

  if (req.method === "POST") {
    try {
      const product = await createProduct(req.body || {});
      return res.status(201).json({ product });
    } catch (err) {
      if ((err as { code?: string }).code === "P2002") {
        return res.status(409).json({ error: "That SKU is already in use by another product." });
      }
      throw err;
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
