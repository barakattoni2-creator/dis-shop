import { prisma, isDbConfigured } from "@/lib/db";
import { categories as staticCategories } from "@/data/products";
import type { Product, Category, Brand } from "@/lib/generated/prisma/client";
import type { PlainProduct } from "@/types/domain";

const include = { category: true, brand: true };

type ProductWithRelations = Product & { category?: Category | null; brand?: Brand | null };

function assertConfigured(): void {
  if (!isDbConfigured()) throw new Error("Database not configured.");
}

function toPlain(row: ProductWithRelations): PlainProduct {
  return {
    id: row.id,
    name: row.name,
    category: row.category?.slug ?? null,
    brand: row.brand?.name ?? null,
    brandLogo: row.brand?.logoUrl ?? null,
    price: row.price,
    originalPrice: row.originalPrice ?? row.price,
    rating: row.rating,
    reviews: row.reviews,
    badge: row.badge,
    isNew: row.isNew,
    color: row.color,
    imageUrl: row.imageUrl,
    images: (row.images as string[] | null) ?? [],
    videoUrl: row.videoUrl ?? null,
    stock: row.stock ?? 0,
    sku: row.sku,
    featured: row.featured,
    description: row.description,
    specs: (row.specs as Record<string, string> | null) ?? null,
    // ISO string, not a Date instance — getStaticProps requires
    // JSON-serializable props, and every page passing products through
    // (brand/category/product pages, sitemap.xml) does exactly that.
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

export async function fetchProducts(): Promise<PlainProduct[]> {
  if (!isDbConfigured()) return [];
  const rows = await prisma!.product.findMany({ include, orderBy: { createdAt: "desc" } });
  return rows.map(toPlain);
}

export async function fetchProductById(id: string): Promise<PlainProduct | null> {
  if (!isDbConfigured()) return null;
  const row = await prisma!.product.findUnique({ where: { id }, include });
  return row ? toPlain(row) : null;
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

// Loosely typed on purpose: this is a raw admin-form/API-request payload
// (see pages/api/admin/products), not yet validated against ProductInput —
// each field is defensively coerced below rather than trusted as-is.
export interface ProductInput {
  name: string;
  description?: string | null;
  price: number | string;
  originalPrice?: number | string | null;
  rating?: number;
  reviews?: number;
  badge?: string | null;
  isNew?: boolean;
  color?: string;
  imageUrl?: string | null;
  images?: unknown;
  videoUrl?: string | null;
  stock?: number | string;
  sku?: string | null;
  featured?: boolean;
  specs?: unknown;
  category?: string | null;
  brand?: string | null;
}

export async function createProduct(data: ProductInput): Promise<PlainProduct> {
  assertConfigured();
  const categoryId = await resolveCategoryId(data.category);
  const brandId = await resolveBrandId(data.brand);
  const row = await prisma!.product.create({
    data: {
      name: data.name,
      description: data.description || null,
      price: Number(data.price),
      originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
      rating: data.rating ?? 4.5,
      reviews: data.reviews ?? 0,
      badge: data.badge || null,
      isNew: Boolean(data.isNew),
      color: data.color || "#E5ECF3",
      imageUrl: data.imageUrl || null,
      images: (data.images as never) ?? undefined,
      videoUrl: data.videoUrl?.trim() || null,
      stock: Number.isFinite(Number(data.stock)) ? Number(data.stock) : 0,
      sku: data.sku?.trim() || null,
      featured: Boolean(data.featured),
      specs: (data.specs as never) ?? undefined,
      categoryId: categoryId as string,
      brandId,
    },
    include,
  });
  return toPlain(row);
}

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
  if ("featured" in patch) data.featured = Boolean(patch.featured);
  const row = await prisma!.product.update({ where: { id }, data, include });
  return toPlain(row);
}

export async function deleteProduct(id: string): Promise<true> {
  assertConfigured();
  await prisma!.product.delete({ where: { id } });
  return true;
}
