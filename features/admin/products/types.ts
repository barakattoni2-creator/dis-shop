import type { PlainProduct, ProductStatus } from "@/types/domain";

export interface ProductFormValues {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  imageUrl: string;
  mobileImageUrl: string;
  images: string[];
  videoUrl: string;
  catalogPdfUrl: string;
  price: string;
  originalPrice: string;
  costPrice: string;
  taxRate: string;
  stock: string;
  lowStockThreshold: string;
  warehouse: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  tags: string[];
  status: ProductStatus;
  featured: boolean;
  isNew: boolean;
  bestSeller: boolean;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImage: string;
  relatedProductIds: string[];
  crossSellProductIds: string[];
  upSellProductIds: string[];
}

export function emptyProductForm(): ProductFormValues {
  return {
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    imageUrl: "",
    mobileImageUrl: "",
    images: [],
    videoUrl: "",
    catalogPdfUrl: "",
    price: "",
    originalPrice: "",
    costPrice: "",
    taxRate: "",
    stock: "0",
    lowStockThreshold: "",
    warehouse: "",
    weightKg: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    sku: "",
    barcode: "",
    category: "",
    brand: "",
    tags: [],
    status: "DRAFT",
    featured: false,
    isNew: false,
    bestSeller: false,
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogImage: "",
    relatedProductIds: [],
    crossSellProductIds: [],
    upSellProductIds: [],
  };
}

export function productToForm(p: PlainProduct): ProductFormValues {
  return {
    name: p.name,
    slug: p.slug || "",
    description: p.description || "",
    shortDescription: p.shortDescription || "",
    imageUrl: p.imageUrl || "",
    mobileImageUrl: p.mobileImageUrl || "",
    images: p.images || [],
    videoUrl: p.videoUrl || "",
    catalogPdfUrl: p.catalogPdfUrl || "",
    price: String(p.price ?? ""),
    originalPrice: p.originalPrice ? String(p.originalPrice) : "",
    costPrice: p.costPrice !== null ? String(p.costPrice) : "",
    taxRate: p.taxRate !== null ? String(p.taxRate) : "",
    stock: String(p.stock ?? 0),
    lowStockThreshold: p.lowStockThreshold !== null ? String(p.lowStockThreshold) : "",
    warehouse: p.warehouse || "",
    weightKg: p.weightKg !== null ? String(p.weightKg) : "",
    lengthCm: p.lengthCm !== null ? String(p.lengthCm) : "",
    widthCm: p.widthCm !== null ? String(p.widthCm) : "",
    heightCm: p.heightCm !== null ? String(p.heightCm) : "",
    sku: p.sku || "",
    barcode: p.barcode || "",
    category: p.category || "",
    brand: p.brand || "",
    tags: p.tags || [],
    status: p.status,
    featured: p.featured,
    isNew: p.isNew,
    bestSeller: p.bestSeller,
    metaTitle: p.metaTitle || "",
    metaDescription: p.metaDescription || "",
    metaKeywords: p.metaKeywords || "",
    ogImage: p.ogImage || "",
    relatedProductIds: p.relatedProductIds || [],
    crossSellProductIds: p.crossSellProductIds || [],
    upSellProductIds: p.upSellProductIds || [],
  };
}

export function formToPayload(form: ProductFormValues): Record<string, unknown> {
  return {
    ...form,
    price: Number(form.price) || 0,
    originalPrice: form.originalPrice || null,
    costPrice: form.costPrice || null,
    taxRate: form.taxRate || null,
    stock: Number(form.stock) || 0,
    lowStockThreshold: form.lowStockThreshold || null,
    weightKg: form.weightKg || null,
    lengthCm: form.lengthCm || null,
    widthCm: form.widthCm || null,
    heightCm: form.heightCm || null,
  };
}
