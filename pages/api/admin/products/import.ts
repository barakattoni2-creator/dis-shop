import type { NextApiRequest, NextApiResponse } from "next";
import * as XLSX from "xlsx";
import { requireAdminApi, getClientIp } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { createProduct, updateProduct, findProductBySku, type ProductInput } from "@/services/db/products";
import { logAdminActivity } from "@/services/db/adminActivity";
import type { ProductStatus } from "@/types/domain";

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

const VALID_STATUS = new Set<ProductStatus>(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const truthy = (v: unknown) => ["yes", "true", "1", "y"].includes(String(v ?? "").trim().toLowerCase());

interface ImportRow {
  id?: string;
  name?: string;
  slug?: string;
  sku?: string;
  barcode?: string;
  category?: string;
  brand?: string;
  price?: number | string;
  originalPrice?: number | string;
  costPrice?: number | string;
  taxRate?: number | string;
  stock?: number | string;
  lowStockThreshold?: number | string;
  warehouse?: string;
  weightKg?: number | string;
  lengthCm?: number | string;
  widthCm?: number | string;
  heightCm?: number | string;
  status?: string;
  featured?: unknown;
  isNew?: unknown;
  bestSeller?: unknown;
  tags?: string;
  shortDescription?: string;
  description?: string;
}

function rowToInput(row: ImportRow): ProductInput {
  return {
    name: String(row.name || "").trim(),
    slug: row.slug ? String(row.slug) : undefined,
    sku: row.sku ? String(row.sku) : undefined,
    barcode: row.barcode ? String(row.barcode) : undefined,
    category: row.category ? String(row.category) : undefined,
    brand: row.brand ? String(row.brand) : undefined,
    price: row.price ?? 0,
    originalPrice: row.originalPrice || undefined,
    costPrice: row.costPrice || undefined,
    taxRate: row.taxRate || undefined,
    stock: row.stock ?? 0,
    lowStockThreshold: row.lowStockThreshold || undefined,
    warehouse: row.warehouse ? String(row.warehouse) : undefined,
    weightKg: row.weightKg || undefined,
    lengthCm: row.lengthCm || undefined,
    widthCm: row.widthCm || undefined,
    heightCm: row.heightCm || undefined,
    status: VALID_STATUS.has(String(row.status || "").toUpperCase() as ProductStatus)
      ? (String(row.status).toUpperCase() as ProductStatus)
      : undefined,
    featured: truthy(row.featured),
    isNew: truthy(row.isNew),
    bestSeller: truthy(row.bestSeller),
    tags: row.tags
      ? String(row.tags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined,
    shortDescription: row.shortDescription ? String(row.shortDescription) : undefined,
    description: row.description ? String(row.description) : undefined,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_PRODUCTS);
  if (!session) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isDbConfigured()) {
    return res.status(503).json({ error: "No database connected." });
  }

  const { file } = req.body || {};
  if (!file || typeof file !== "string") {
    return res.status(400).json({ error: "No file provided." });
  }

  let rows: ImportRow[];
  try {
    const base64 = file.includes(",") ? file.split(",")[1] : file;
    const buffer = Buffer.from(base64, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "" });
  } catch {
    return res.status(400).json({ error: "Couldn't read that file — make sure it's a valid .xlsx export." });
  }

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +1 for header row, +1 for 1-index
    if (!row.name || !String(row.name).trim()) {
      errors.push(`Row ${rowNum}: missing name — skipped.`);
      continue;
    }
    try {
      const input = rowToInput(row);
      if (row.id) {
        await updateProduct(String(row.id), input);
        updated++;
        continue;
      }
      const existing = row.sku ? await findProductBySku(String(row.sku)) : null;
      if (existing) {
        await updateProduct(existing.id, input);
        updated++;
      } else {
        await createProduct(input);
        created++;
      }
    } catch (err) {
      errors.push(`Row ${rowNum} ("${row.name}"): ${(err as Error).message}`);
    }
  }

  await logAdminActivity(
    session.email,
    "product_import",
    `Imported: ${created} created, ${updated} updated, ${errors.length} errors`,
    getClientIp(req)
  );

  return res.status(200).json({ created, updated, errors });
}
