import type { NextApiRequest, NextApiResponse } from "next";
import * as XLSX from "xlsx";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchProductsForAdmin } from "@/services/db/products";
import type { ProductStatus } from "@/types/domain";
import type { PlainProduct } from "@/types/domain";

// One flat row per product — matches exactly what /api/admin/products/import
// expects back, so "Export -> edit in Excel -> re-import" round-trips
// cleanly instead of needing a separate import-only template.
function toRow(p: PlainProduct) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug || "",
    sku: p.sku || "",
    barcode: p.barcode || "",
    category: p.category || "",
    brand: p.brand || "",
    price: p.price,
    originalPrice: p.originalPrice ?? "",
    costPrice: p.costPrice ?? "",
    taxRate: p.taxRate ?? "",
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold ?? "",
    warehouse: p.warehouse || "",
    weightKg: p.weightKg ?? "",
    lengthCm: p.lengthCm ?? "",
    widthCm: p.widthCm ?? "",
    heightCm: p.heightCm ?? "",
    status: p.status,
    featured: p.featured ? "yes" : "no",
    isNew: p.isNew ? "yes" : "no",
    bestSeller: p.bestSeller ? "yes" : "no",
    tags: p.tags.join(", "),
    shortDescription: p.shortDescription || "",
    description: p.description || "",
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_PRODUCTS);
  if (!session) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isDbConfigured()) {
    return res.status(503).json({ error: "No database connected." });
  }

  const { q = "", status = "ALL", category, brand } = req.query;
  const { rows } = await fetchProductsForAdmin({
    q: String(q),
    status: status as ProductStatus | "ALL",
    category: category ? String(category) : undefined,
    brand: brand ? String(brand) : undefined,
    page: 1,
    pageSize: 100000,
  });

  const worksheet = XLSX.utils.json_to_sheet(rows.map(toRow));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="dis-shop-products-${Date.now()}.xlsx"`);
  return res.status(200).send(buffer);
}
