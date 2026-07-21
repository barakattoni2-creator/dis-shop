import { categories } from "@/data/products";

// Reads the small pre-DB fallback list only — callers with access to a real
// Category row (services/db/categories.js) should prefer that; this is kept
// for the handful of call sites that only have a bare category slug on hand
// (see pages/compare.js, pages/order-confirmation.js).
export function getCategoryIcon(slug: string): string {
  return categories.find((c) => c.slug === slug)?.icon ?? "📦";
}

export function getCategoryName(slug: string): string {
  return categories.find((c) => c.slug === slug)?.name ?? slug;
}
