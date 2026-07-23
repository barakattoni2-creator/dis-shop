import { prisma, isDbConfigured } from "@/lib/db";
import { categories as staticCategories } from "@/data/products";
import type { Product, Category, Brand, Prisma } from "@/lib/generated/prisma/client";
import type { PlainProduct, ProductStatus } from "@/types/domain";
import type { PaginatedResult } from "@/services/db/adminActivity";

const include = { category: true, brand: true };

type ProductWithRelations = Product & { category?: Category | null; brand?: Brand | null };

function assertConfigured(): void {
  if (!isDbConfigured()) throw new Error("Database not configured.");
}

function toPlain(row: ProductWithRelations): PlainProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category?.slug ?? null,
    brand: row.brand?.name ?? null,
    brandLogo: row.brand?.logoUrl ?? null,
    price: row.price,
    originalPrice: row.originalPrice ?? row.price,
    costPrice: row.costPrice,
    taxRate: row.taxRate,
    rating: row.rating,
    reviews: row.reviews,
    badge: row.badge,
    isNew: row.isNew,
    bestSeller: row.bestSeller,
    color: row.color,
    imageUrl: row.imageUrl,
    mobileImageUrl: row.mobileImageUrl,
    images: (row.images as string[] | null) ?? [],
    videoUrl: row.videoUrl ?? null,
    catalogPdfUrl: row.catalogPdfUrl,
    stock: row.stock ?? 0,
    lowStockThreshold: row.lowStockThreshold,
    warehouse: row.warehouse,
    weightKg: row.weightKg,
    lengthCm: row.lengthCm,
    widthCm: row.widthCm,
    heightCm: row.heightCm,
    sku: row.sku,
    barcode: row.barcode,
    featured: row.featured,
    status: row.status as ProductStatus,
    tags: row.tags ?? [],
    description: row.description,
    shortDescription: row.shortDescription,
    specs: (row.specs as Record<string, string> | null) ?? null,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    metaKeywords: row.metaKeywords,
    ogImage: row.ogImage,
    relatedProductIds: row.relatedProductIds ?? [],
    crossSellProductIds: row.crossSellProductIds ?? [],
    upSellProductIds: row.upSellProductIds ?? [],
    // ISO string, not a Date instance — getStaticProps requires
    // JSON-serializable props, and every page passing products through
    // (brand/category/product pages, sitemap.xml) does exactly that.
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

export interface ProductSuggestion {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
}

function toSuggestion(row: {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
}): ProductSuggestion {
  return { id: row.id, name: row.name, imageUrl: row.imageUrl, price: row.price };
}

// Lightweight, select-only queries for the header search-suggest endpoint —
// deliberately not routed through the full `include`/`toPlain` pipeline
// above (category/brand relations, specs, SEO fields, etc.) since an
// autocomplete dropdown only ever needs id/name/image/price and this runs
// on every keystroke.
export async function searchProductSuggestions(query: string, limit = 6): Promise<ProductSuggestion[]> {
  const term = query.trim();
  if (!isDbConfigured() || !term) return [];
  const rows = await prisma!.product.findMany({
    where: { status: "PUBLISHED", name: { contains: term, mode: "insensitive" } },
    select: { id: true, name: true, imageUrl: true, price: true },
    orderBy: { bestSeller: "desc" },
    take: limit,
  });
  return rows.map(toSuggestion);
}

// "Trending" is real bestSeller-flagged inventory (admin-managed, same flag
// pages/index.js's own Best Sellers section reads) rather than any
// fabricated popularity score.
export async function fetchTrendingProducts(limit = 6): Promise<ProductSuggestion[]> {
  if (!isDbConfigured()) return [];
  const rows = await prisma!.product.findMany({
    where: { status: "PUBLISHED", bestSeller: true },
    select: { id: true, name: true, imageUrl: true, price: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return rows.map(toSuggestion);
}

// Looks up the lightweight suggestion shape for a set of ids in one round
// trip, then re-sorts to match the caller's order — used to resolve
// localStorage-tracked "recently viewed" ids (lib/recentlyViewed.ts) back
// into displayable product cards for the header dropdown.
export async function fetchProductSuggestionsByIds(ids: string[]): Promise<ProductSuggestion[]> {
  if (!isDbConfigured() || ids.length === 0) return [];
  const rows = await prisma!.product.findMany({
    where: { status: "PUBLISHED", id: { in: ids } },
    select: { id: true, name: true, imageUrl: true, price: true },
  });
  const byId = new Map(rows.map((row) => [row.id, toSuggestion(row)]));
  return ids.map((id) => byId.get(id)).filter((v): v is ProductSuggestion => Boolean(v));
}

// Storefront-facing — PUBLISHED only. DRAFT/ARCHIVED products exist in the
// admin but are never shown to customers.
export async function fetchProducts(): Promise<PlainProduct[]> {
  if (!isDbConfigured()) return [];
  const rows = await prisma!.product.findMany({
    where: { status: "PUBLISHED" },
    include,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toPlain);
}

// Storefront-facing single product — same PUBLISHED-only rule, so a
// draft/archived product's detail page 404s for customers exactly like a
// deleted one would.
export async function fetchProductById(id: string): Promise<PlainProduct | null> {
  if (!isDbConfigured()) return null;
  const row = await prisma!.product.findFirst({ where: { id, status: "PUBLISHED" }, include });
  return row ? toPlain(row) : null;
}

// Admin-facing single product — every status, used by the product edit
// form and duplicate/preview actions.
export async function fetchProductByIdForAdmin(id: string): Promise<PlainProduct | null> {
  if (!isDbConfigured()) return null;
  const row = await prisma!.product.findUnique({ where: { id }, include });
  return row ? toPlain(row) : null;
}

// Used by the Excel import route to match a spreadsheet row against an
// existing product when no id is given (a re-exported sheet always has
// id; a hand-built one usually only has sku).
export async function findProductBySku(sku: string): Promise<PlainProduct | null> {
  if (!isDbConfigured() || !sku) return null;
  const row = await prisma!.product.findUnique({ where: { sku }, include });
  return row ? toPlain(row) : null;
}

export interface ProductAdminFilters {
  q?: string;
  status?: ProductStatus | "ALL";
  category?: string;
  brand?: string;
  page?: number;
  pageSize?: number;
}

// Paginated, searchable, filterable — the Product Manager's list view.
// Search matches name/sku/barcode; unlike the storefront-facing
// fetchProducts, every status is included unless a specific one is asked
// for, since admins need to see (and act on) drafts and archived products.
export async function fetchProductsForAdmin({
  q = "",
  status = "ALL",
  category,
  brand,
  page = 1,
  pageSize = 25,
}: ProductAdminFilters = {}): Promise<PaginatedResult<PlainProduct>> {
  if (!isDbConfigured()) return { rows: [], total: 0, page, pageSize };

  const where: Prisma.ProductWhereInput = {};
  if (status !== "ALL") where.status = status;
  if (category) where.category = { slug: category };
  if (brand) where.brand = { name: brand };
  if (q.trim()) {
    const term = q.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { sku: { contains: term, mode: "insensitive" } },
      { barcode: { contains: term, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma!.product.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma!.product.count({ where }),
  ]);
  return { rows: rows.map(toPlain), total, page, pageSize };
}

async function resolveCategoryId(categorySlug: string | null | undefined): Promise<string | null> {
  if (!categorySlug) return null;
  const existing = await prisma!.category.findUnique({ where: { slug: categorySlug } });
  if (existing) return existing.id;
  const staticMatch = staticCategories.find((c) => c.slug === categorySlug);
  const created = await prisma!.category.create({
    data: {
      slug: categorySlug,
      name: staticMatch?.name ?? categorySlug,
      icon: staticMatch?.icon ?? "📦",
    },
  });
  return created.id;
}

async function resolveBrandId(brandName: string | null | undefined): Promise<string | null> {
  if (!brandName) return null;
  const existing = await prisma!.brand.findUnique({ where: { name: brandName } });
  if (existing) return existing.id;
  const created = await prisma!.brand.create({ data: { name: brandName } });
  return created.id;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Loosely typed on purpose: this is a raw admin-form/API-request payload
// (see pages/api/admin/products), not yet validated against ProductInput —
// each field is defensively coerced below rather than trusted as-is.
export interface ProductInput {
  name: string;
  slug?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  price: number | string;
  originalPrice?: number | string | null;
  costPrice?: number | string | null;
  taxRate?: number | string | null;
  rating?: number;
  reviews?: number;
  badge?: string | null;
  isNew?: boolean;
  bestSeller?: boolean;
  color?: string;
  imageUrl?: string | null;
  mobileImageUrl?: string | null;
  images?: unknown;
  videoUrl?: string | null;
  catalogPdfUrl?: string | null;
  stock?: number | string;
  lowStockThreshold?: number | string | null;
  warehouse?: string | null;
  weightKg?: number | string | null;
  lengthCm?: number | string | null;
  widthCm?: number | string | null;
  heightCm?: number | string | null;
  sku?: string | null;
  barcode?: string | null;
  featured?: boolean;
  status?: ProductStatus;
  tags?: string[];
  specs?: unknown;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogImage?: string | null;
  relatedProductIds?: string[];
  crossSellProductIds?: string[];
  upSellProductIds?: string[];
  category?: string | null;
  brand?: string | null;
}

function toNullableNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function createProduct(data: ProductInput): Promise<PlainProduct> {
  assertConfigured();
  const categoryId = await resolveCategoryId(data.category);
  const brandId = await resolveBrandId(data.brand);
  const row = await prisma!.product.create({
    data: {
      name: data.name,
      slug: data.slug?.trim() ? slugify(data.slug) : slugify(data.name),
      description: data.description || null,
      shortDescription: data.shortDescription || null,
      price: Number(data.price),
      originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
      costPrice: toNullableNumber(data.costPrice),
      taxRate: toNullableNumber(data.taxRate),
      rating: data.rating ?? 4.5,
      reviews: data.reviews ?? 0,
      badge: data.badge || null,
      isNew: Boolean(data.isNew),
      bestSeller: Boolean(data.bestSeller),
      color: data.color || "#E5ECF3",
      imageUrl: data.imageUrl || null,
      mobileImageUrl: data.mobileImageUrl || null,
      images: (data.images as never) ?? undefined,
      videoUrl: data.videoUrl?.trim() || null,
      catalogPdfUrl: data.catalogPdfUrl?.trim() || null,
      stock: Number.isFinite(Number(data.stock)) ? Number(data.stock) : 0,
      lowStockThreshold: toNullableNumber(data.lowStockThreshold),
      warehouse: data.warehouse || null,
      weightKg: toNullableNumber(data.weightKg),
      lengthCm: toNullableNumber(data.lengthCm),
      widthCm: toNullableNumber(data.widthCm),
      heightCm: toNullableNumber(data.heightCm),
      sku: data.sku?.trim() || null,
      barcode: data.barcode?.trim() || null,
      featured: Boolean(data.featured),
      status: data.status || "PUBLISHED",
      tags: data.tags ?? [],
      specs: (data.specs as never) ?? undefined,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      metaKeywords: data.metaKeywords || null,
      ogImage: data.ogImage || null,
      relatedProductIds: data.relatedProductIds ?? [],
      crossSellProductIds: data.crossSellProductIds ?? [],
      upSellProductIds: data.upSellProductIds ?? [],
      categoryId: categoryId as string,
      brandId,
    },
    include,
  });
  return toPlain(row);
}

const NUMERIC_FIELDS = [
  "costPrice",
  "taxRate",
  "lowStockThreshold",
  "weightKg",
  "lengthCm",
  "widthCm",
  "heightCm",
] as const;

export async function updateProduct(id: string, patch: Partial<ProductInput>): Promise<PlainProduct> {
  assertConfigured();
  // Deliberately `any` here: this builds a dynamic Prisma update payload
  // field-by-field from an arbitrary partial patch (category/brand get
  // resolved to IDs and swapped out below) — the same free-form shape the
  // original JS had, not a regression in type safety.
  const data: Record<string, any> = { ...patch };
  if ("category" in patch) {
    data.categoryId = await resolveCategoryId(patch.category);
    delete data.category;
  }
  if ("brand" in patch) {
    data.brandId = await resolveBrandId(patch.brand);
    delete data.brand;
  }
  if ("price" in patch) data.price = Number(patch.price);
  if ("originalPrice" in patch) {
    data.originalPrice = patch.originalPrice ? Number(patch.originalPrice) : null;
  }
  if ("stock" in patch) data.stock = Number(patch.stock) || 0;
  if ("sku" in patch) data.sku = patch.sku?.trim() || null;
  if ("barcode" in patch) data.barcode = patch.barcode?.trim() || null;
  if ("slug" in patch) data.slug = patch.slug?.trim() ? slugify(patch.slug as string) : null;
  if ("featured" in patch) data.featured = Boolean(patch.featured);
  if ("isNew" in patch) data.isNew = Boolean(patch.isNew);
  if ("bestSeller" in patch) data.bestSeller = Boolean(patch.bestSeller);
  for (const field of NUMERIC_FIELDS) {
    if (field in patch) data[field] = toNullableNumber(patch[field]);
  }
  const row = await prisma!.product.update({ where: { id }, data, include });
  return toPlain(row);
}

export async function deleteProduct(id: string): Promise<true> {
  assertConfigured();
  await prisma!.product.delete({ where: { id } });
  return true;
}

// Full copy of every field except identity/uniqueness-constrained ones
// (id, slug, sku, barcode, createdAt/updatedAt) — those get cleared/suffixed
// so the duplicate can be saved without colliding, and lands as a DRAFT so
// it's never accidentally live before an admin reviews it.
export async function duplicateProduct(id: string): Promise<PlainProduct> {
  assertConfigured();
  const source = await prisma!.product.findUnique({ where: { id } });
  if (!source) throw new Error("Product not found.");
  const { id: _id, slug, sku, barcode, createdAt, updatedAt, ...rest } = source;
  const row = await prisma!.product.create({
    data: {
      ...rest,
      name: `${source.name} (Copy)`,
      slug: slug ? `${slug}-copy-${Date.now().toString(36)}` : null,
      sku: null,
      barcode: null,
      status: "DRAFT",
    },
    include,
  });
  return toPlain(row);
}

export async function archiveProduct(id: string): Promise<PlainProduct> {
  assertConfigured();
  const row = await prisma!.product.update({ where: { id }, data: { status: "ARCHIVED" }, include });
  return toPlain(row);
}

export async function bulkUpdateProductStatus(ids: string[], status: ProductStatus): Promise<true> {
  assertConfigured();
  await prisma!.product.updateMany({ where: { id: { in: ids } }, data: { status } });
  return true;
}

export async function bulkDeleteProducts(ids: string[]): Promise<true> {
  assertConfigured();
  await prisma!.product.deleteMany({ where: { id: { in: ids } } });
  return true;
}
