import { prisma, isDbConfigured } from "@/lib/db";
import { PRIORITY_FIELDS, type PriorityField } from "@/data/searchPriorityFields";
import type { SearchSynonymGroup, ProductSearchKeyword, PopularSearchTerm } from "@/lib/generated/prisma/client";
import type { PaginatedResult } from "@/services/db/adminActivity";

export { PRIORITY_FIELDS };

function assertConfigured(): void {
  if (!isDbConfigured()) throw new Error("Database not configured.");
}

// ==================================================
// Search Synonyms
// ==================================================

export async function fetchSynonymGroups(): Promise<SearchSynonymGroup[]> {
  if (!isDbConfigured()) return [];
  return prisma!.searchSynonymGroup.findMany({ orderBy: { createdAt: "desc" } });
}

function normalizeTerms(terms: unknown): string[] {
  return (Array.isArray(terms) ? terms : [])
    .map((t) => String(t || "").trim())
    .filter(Boolean);
}

function sameTermSet(a: string[], b: string[]): boolean {
  const norm = (arr: string[]) => arr.map((t) => t.toLowerCase()).sort().join("|");
  return norm(a) === norm(b);
}

export async function synonymGroupExists(terms: string[], excludeId: string | null = null): Promise<boolean> {
  const groups = await fetchSynonymGroups();
  return groups.some((g) => g.id !== excludeId && sameTermSet(g.terms, terms));
}

export async function createSynonymGroup({
  terms,
  active = true,
}: {
  terms: unknown;
  active?: boolean;
}): Promise<SearchSynonymGroup> {
  assertConfigured();
  const cleanTerms = normalizeTerms(terms);
  if (cleanTerms.length < 2) {
    throw new Error("A synonym group needs at least two terms.");
  }
  if (await synonymGroupExists(cleanTerms)) {
    throw new Error("A synonym group with these exact terms already exists.");
  }
  return prisma!.searchSynonymGroup.create({ data: { terms: cleanTerms, active: Boolean(active) } });
}

export async function updateSynonymGroup(
  id: string,
  patch: { terms?: unknown; active?: boolean }
): Promise<SearchSynonymGroup> {
  assertConfigured();
  const data: { terms?: string[]; active?: boolean } = {};
  if ("terms" in patch) {
    const cleanTerms = normalizeTerms(patch.terms);
    if (cleanTerms.length < 2) throw new Error("A synonym group needs at least two terms.");
    if (await synonymGroupExists(cleanTerms, id)) {
      throw new Error("A synonym group with these exact terms already exists.");
    }
    data.terms = cleanTerms;
  }
  if ("active" in patch) data.active = Boolean(patch.active);
  return prisma!.searchSynonymGroup.update({ where: { id }, data });
}

export async function deleteSynonymGroup(id: string): Promise<true> {
  assertConfigured();
  await prisma!.searchSynonymGroup.delete({ where: { id } });
  return true;
}

// ==================================================
// Product Search Keywords
// ==================================================

export interface PlainKeyword {
  id: string | null;
  productId: string;
  productName: string | null;
  productSku: string | null;
  arabicName: string;
  englishName: string;
  alternativeNames: string[];
  searchTags: string[];
  misspellings: string[];
  technicalKeywords: string[];
  updatedAt: Date | null;
}

type KeywordRow = ProductSearchKeyword & { product?: { name: string | null; sku?: string | null } | null };

function keywordToPlain(row: KeywordRow): PlainKeyword {
  return {
    id: row.id,
    productId: row.productId,
    productName: row.product?.name ?? null,
    productSku: row.product?.sku ?? null,
    arabicName: row.arabicName || "",
    englishName: row.englishName || "",
    alternativeNames: row.alternativeNames || [],
    searchTags: row.searchTags || [],
    misspellings: row.misspellings || [],
    technicalKeywords: row.technicalKeywords || [],
    updatedAt: row.updatedAt,
  };
}

// Every product gets a row here (real keyword data where an admin has
// entered it, blank placeholders otherwise) so the admin table always shows
// the full catalog, not just the products someone has already annotated.
export async function fetchProductKeywords({
  q = "",
  page = 1,
  pageSize = 20,
}: { q?: string; page?: number; pageSize?: number } = {}): Promise<PaginatedResult<PlainKeyword>> {
  if (!isDbConfigured()) return { rows: [], total: 0, page, pageSize };

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { sku: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    prisma!.product.findMany({
      where,
      select: { id: true, name: true, sku: true, searchKeyword: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma!.product.count({ where }),
  ]);

  const rows: PlainKeyword[] = products.map((p) =>
    p.searchKeyword
      ? keywordToPlain({ ...p.searchKeyword, product: { name: p.name, sku: p.sku } })
      : {
          id: null,
          productId: p.id,
          productName: p.name,
          productSku: p.sku,
          arabicName: "",
          englishName: "",
          alternativeNames: [],
          searchTags: [],
          misspellings: [],
          technicalKeywords: [],
          updatedAt: null,
        }
  );

  return { rows, total, page, pageSize };
}

export async function fetchAllProductKeywordsForExport(): Promise<PlainKeyword[]> {
  if (!isDbConfigured()) return [];
  const rows = await prisma!.productSearchKeyword.findMany({ include: { product: true } });
  return rows.map(keywordToPlain);
}

export interface KeywordInput {
  arabicName?: string | null;
  englishName?: string | null;
  alternativeNames?: unknown;
  searchTags?: unknown;
  misspellings?: unknown;
  technicalKeywords?: unknown;
}

export async function upsertProductKeyword(productId: string, data: KeywordInput): Promise<PlainKeyword> {
  assertConfigured();
  const payload = {
    arabicName: data.arabicName?.trim() || null,
    englishName: data.englishName?.trim() || null,
    alternativeNames: normalizeTerms(data.alternativeNames),
    searchTags: normalizeTerms(data.searchTags),
    misspellings: normalizeTerms(data.misspellings),
    technicalKeywords: normalizeTerms(data.technicalKeywords),
  };
  const row = await prisma!.productSearchKeyword.upsert({
    where: { productId },
    update: payload,
    create: { productId, ...payload },
    include: { product: true },
  });
  return keywordToPlain(row);
}

// ==================================================
// Popular Searches
// ==================================================

export async function fetchPopularSearches(): Promise<PopularSearchTerm[]> {
  if (!isDbConfigured()) return [];
  return prisma!.popularSearchTerm.findMany({ orderBy: { order: "asc" } });
}

export async function createPopularSearchTerm({
  term,
  active = true,
}: {
  term: string;
  active?: boolean;
}): Promise<PopularSearchTerm> {
  assertConfigured();
  const clean = String(term || "").trim();
  if (!clean) throw new Error("Term is required.");
  const maxOrder = await prisma!.popularSearchTerm.aggregate({ _max: { order: true } });
  return prisma!.popularSearchTerm.create({
    data: { term: clean, active: Boolean(active), order: (maxOrder._max.order ?? -1) + 1 },
  });
}

export async function updatePopularSearchTerm(
  id: string,
  patch: { term?: string; active?: boolean }
): Promise<PopularSearchTerm> {
  assertConfigured();
  const data: { term?: string; active?: boolean } = {};
  if ("term" in patch) {
    const clean = String(patch.term || "").trim();
    if (!clean) throw new Error("Term is required.");
    data.term = clean;
  }
  if ("active" in patch) data.active = Boolean(patch.active);
  return prisma!.popularSearchTerm.update({ where: { id }, data });
}

export async function deletePopularSearchTerm(id: string): Promise<true> {
  assertConfigured();
  await prisma!.popularSearchTerm.delete({ where: { id } });
  return true;
}

export async function reorderPopularSearchTerms(orderedIds: string[]): Promise<true> {
  assertConfigured();
  await prisma!.$transaction(
    orderedIds.map((id, index) =>
      prisma!.popularSearchTerm.update({ where: { id }, data: { order: index } })
    )
  );
  return true;
}

// ==================================================
// Search Priority (ranking weights)
// ==================================================

const DEFAULT_WEIGHTS: Record<PriorityField, number> = {
  sku: 10,
  name: 9,
  brand: 6,
  model: 6,
  category: 4,
  tags: 5,
  description: 2,
  specifications: 3,
};

export async function fetchPriorityWeights(): Promise<Record<string, number>> {
  if (!isDbConfigured()) return { ...DEFAULT_WEIGHTS };
  const rows = await prisma!.searchPriorityWeight.findMany();
  const map: Record<string, number> = { ...DEFAULT_WEIGHTS };
  for (const row of rows) {
    if ((PRIORITY_FIELDS as readonly string[]).includes(row.field)) map[row.field] = row.weight;
  }
  return map;
}

export async function updatePriorityWeights(weights: Record<string, number | string>): Promise<Record<string, number>> {
  assertConfigured();
  const entries = Object.entries(weights || {}).filter(([field]) =>
    (PRIORITY_FIELDS as readonly string[]).includes(field)
  );
  await prisma!.$transaction(
    entries.map(([field, weight]) =>
      prisma!.searchPriorityWeight.upsert({
        where: { field },
        update: { weight: Number(weight) || 0 },
        create: { field, weight: Number(weight) || 0 },
      })
    )
  );
  return fetchPriorityWeights();
}

// ==================================================
// Search logging & analytics
// ==================================================

function normalizeTerm(term: unknown): string {
  return String(term || "").trim().toLowerCase();
}

export async function logSearch(term: string, resultCount: number): Promise<void> {
  if (!isDbConfigured()) return;
  const clean = String(term || "").trim().slice(0, 200);
  if (!clean) return;
  await prisma!.searchLog.create({
    data: { term: clean, normalizedTerm: normalizeTerm(clean), resultCount: Number(resultCount) || 0 },
  });
}

export async function logSearchEvent(term: string, productId: string | null, type: string): Promise<void> {
  if (!isDbConfigured()) return;
  if (!["click", "cart"].includes(type)) return;
  const clean = String(term || "").trim().slice(0, 200);
  await prisma!.searchEvent.create({
    data: { term: clean, type, productId: productId || null },
  });
}

export interface MostSearchedTerm {
  term: string | null;
  count: number;
  lastSearchedAt: Date | null;
}

export async function fetchMostSearchedTerms(limit = 20): Promise<MostSearchedTerm[]> {
  if (!isDbConfigured()) return [];
  const grouped = await prisma!.searchLog.groupBy({
    by: ["normalizedTerm"],
    _count: { normalizedTerm: true },
    _max: { term: true, createdAt: true },
    orderBy: { _count: { normalizedTerm: "desc" } },
    take: limit,
  });
  return grouped.map((g) => ({
    term: g._max.term,
    count: g._count.normalizedTerm,
    lastSearchedAt: g._max.createdAt,
  }));
}

interface SearchableProduct {
  id: string;
  name: string;
  sku?: string | null;
  brand?: { name: string } | null;
  category?: { name: string } | null;
}

async function suggestProductsForTerm(
  term: string | null,
  products: SearchableProduct[],
  limit = 5
): Promise<Array<{ id: string; name: string }>> {
  const tokens = normalizeTerm(term)
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return [];
  const scored = products
    .map((p) => {
      const haystack = [p.name, p.brand?.name, p.category?.name, p.sku]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const score = tokens.reduce((sum, t) => sum + (haystack.includes(t) ? 1 : 0), 0);
      return { id: p.id, name: p.name, score };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((p) => ({ id: p.id, name: p.name }));
}

export interface NoResultSearchRow {
  term: string | null;
  count: number;
  lastSearchedAt: Date | null;
  closestProducts: Array<{ id: string; name: string }>;
}

export async function fetchNoResultSearches({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}): Promise<PaginatedResult<NoResultSearchRow>> {
  if (!isDbConfigured()) return { rows: [], total: 0, page, pageSize };

  const allGrouped = await prisma!.searchLog.groupBy({
    by: ["normalizedTerm"],
    where: { resultCount: 0 },
    _count: { normalizedTerm: true },
    _max: { term: true, createdAt: true },
    orderBy: { _count: { normalizedTerm: "desc" } },
  });

  const total = allGrouped.length;
  const pageRows = allGrouped.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  const products = await prisma!.product.findMany({
    select: { id: true, name: true, sku: true, brand: { select: { name: true } }, category: { select: { name: true } } },
  });

  const rows: NoResultSearchRow[] = await Promise.all(
    pageRows.map(async (g) => ({
      term: g._max.term,
      count: g._count.normalizedTerm,
      lastSearchedAt: g._max.createdAt,
      closestProducts: await suggestProductsForTerm(g._max.term, products),
    }))
  );

  return { rows, total, page, pageSize };
}

export interface SearchAnalytics {
  mostSearched: MostSearchedTerm[];
  noResultCount: number;
  totalSearches: number;
  topClickedProducts: Array<{ id: string; name: string; count: number }>;
  totalClicks: number;
  totalAddToCart: number;
  conversionRate: number | null;
  popularBrands: Array<{ name: string; count: number }>;
  popularCategories: Array<{ name: string; count: number }>;
}

export async function fetchSearchAnalytics(): Promise<SearchAnalytics> {
  if (!isDbConfigured()) {
    return {
      mostSearched: [],
      noResultCount: 0,
      totalSearches: 0,
      topClickedProducts: [],
      totalClicks: 0,
      totalAddToCart: 0,
      conversionRate: null,
      popularBrands: [],
      popularCategories: [],
    };
  }

  const [mostSearched, totalSearches, noResultCount, clickEvents, totalClicks, totalAddToCart] =
    await Promise.all([
      fetchMostSearchedTerms(10),
      prisma!.searchLog.count(),
      prisma!.searchLog
        .groupBy({ by: ["normalizedTerm"], where: { resultCount: 0 } })
        .then((g) => g.length),
      prisma!.searchEvent.findMany({
        where: { type: "click", productId: { not: null } },
        include: { product: { include: { brand: true, category: true } } },
        take: 2000,
        orderBy: { createdAt: "desc" },
      }),
      prisma!.searchEvent.count({ where: { type: "click" } }),
      prisma!.searchEvent.count({ where: { type: "cart" } }),
    ]);

  const productCounts = new Map<string, { name: string; count: number }>();
  const brandCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  for (const evt of clickEvents) {
    if (!evt.product) continue;
    productCounts.set(evt.product.id, {
      name: evt.product.name,
      count: (productCounts.get(evt.product.id)?.count || 0) + 1,
    });
    if (evt.product.brand?.name) {
      brandCounts.set(evt.product.brand.name, (brandCounts.get(evt.product.brand.name) || 0) + 1);
    }
    if (evt.product.category?.name) {
      categoryCounts.set(
        evt.product.category.name,
        (categoryCounts.get(evt.product.category.name) || 0) + 1
      );
    }
  }

  const topClickedProducts = [...productCounts.entries()]
    .map(([id, v]) => ({ id, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const popularBrands = [...brandCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const popularCategories = [...categoryCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    mostSearched,
    totalSearches,
    noResultCount,
    topClickedProducts,
    totalClicks,
    totalAddToCart,
    conversionRate: totalClicks > 0 ? totalAddToCart / totalClicks : null,
    popularBrands,
    popularCategories,
  };
}

// ==================================================
// Public config consumed by the storefront (pages/search.js, Header.js)
// ==================================================

export interface ActiveSearchKeyword {
  arabicName: string;
  englishName: string;
  alternativeNames: string[];
  searchTags: string[];
  misspellings: string[];
  technicalKeywords: string[];
}

export interface ActiveSearchConfig {
  synonymGroups: string[][];
  popularSearches: string[];
  priorityWeights: Record<string, number>;
  keywords: Record<string, ActiveSearchKeyword>;
}

export async function fetchActiveSearchConfig(): Promise<ActiveSearchConfig> {
  if (!isDbConfigured()) {
    return { synonymGroups: [], popularSearches: [], priorityWeights: { ...DEFAULT_WEIGHTS }, keywords: {} };
  }
  const [synonymGroups, popularSearches, priorityWeights, keywordRows] = await Promise.all([
    prisma!.searchSynonymGroup.findMany({ where: { active: true } }),
    prisma!.popularSearchTerm.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    fetchPriorityWeights(),
    prisma!.productSearchKeyword.findMany(),
  ]);

  const keywords: ActiveSearchConfig["keywords"] = {};
  for (const row of keywordRows) {
    keywords[row.productId] = {
      arabicName: row.arabicName || "",
      englishName: row.englishName || "",
      alternativeNames: row.alternativeNames || [],
      searchTags: row.searchTags || [],
      misspellings: row.misspellings || [],
      technicalKeywords: row.technicalKeywords || [],
    };
  }

  return {
    synonymGroups: synonymGroups.map((g) => g.terms),
    popularSearches: popularSearches.map((p) => p.term),
    priorityWeights,
    keywords,
  };
}
