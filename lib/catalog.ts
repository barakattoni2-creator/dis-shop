// Server-only. Import this ONLY from getStaticProps/getStaticPaths/API
// routes — it pulls in the Prisma client via services/db/products, which
// must never end up in the browser bundle.
import { isDbConfigured } from "@/lib/db";
import * as dbProducts from "@/services/db/products";
import * as mockProducts from "@/services/odoo/products";
import {
  fetchCategories as fetchCategoriesMerged,
  fetchCategoryNavTree,
  fetchHomepageCategories,
  fetchCategoryBySlug,
  fetchDescendantIds,
  fetchCategoryAndDescendantSlugs,
  findCategoryRedirect,
} from "@/services/db/categories";
import { fetchBrands as fetchBrandsMerged } from "@/services/db/brands";
import { fetchActiveBanners } from "@/services/db/banners";
import type { PlainProduct } from "@/types/domain";

export async function fetchProducts(): Promise<PlainProduct[]> {
  return isDbConfigured()
    ? dbProducts.fetchProducts()
    : (mockProducts.fetchProducts() as unknown as Promise<PlainProduct[]>);
}

export async function fetchProductById(id: string): Promise<PlainProduct | null> {
  return isDbConfigured()
    ? dbProducts.fetchProductById(id)
    : (mockProducts.fetchProductById(id) as unknown as Promise<PlainProduct | null>);
}

// Merges DB categories with the static list even when no DB is configured
// (falls back to the static list entirely in that case).
export const fetchCategories = fetchCategoriesMerged;

// Same merge behavior as fetchCategories, for brands.
export const fetchBrands = fetchBrandsMerged;

// Empty when no DB is configured or no banners have been added yet — callers
// fall back to the built-in static hero slides in that case.
export const fetchBanners = fetchActiveBanners;

// Active + showInNav categories, nested 3 levels deep — powers the desktop
// mega menu and mobile accordion.
export const fetchCategoryTree = fetchCategoryNavTree;

// Active categories flagged showOnHomepage=true, in display order — powers
// the homepage "Shop by Category" grid.
export const fetchHomepageCategoryList = fetchHomepageCategories;

// A single category plus its parent chain (breadcrumbs) and direct
// children — powers pages/category/[slug].js.
export const fetchCategoryDetail = fetchCategoryBySlug;

export { fetchDescendantIds, fetchCategoryAndDescendantSlugs, findCategoryRedirect };
