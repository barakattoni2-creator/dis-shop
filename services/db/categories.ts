import { prisma } from "@/lib/db";
import { isDbConfigured } from "@/lib/db";
import { categories as staticCategories, type StaticCategory } from "@/data/products";
import type { Category } from "@/lib/generated/prisma/client";
import type { PlainCategory, CategoryTreeNode, CategoryDetail } from "@/types/domain";

type CategoryWithCount = Category & { _count?: { products: number } };

function toPlain(row: CategoryWithCount): PlainCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameAr: row.nameAr || "",
    description: row.description || "",
    seoTitle: row.seoTitle || "",
    seoDescription: row.seoDescription || "",
    icon: row.icon || "📦",
    imageUrl: row.imageUrl || "",
    order: row.order ?? 0,
    level: (row.level ?? 1) as 1 | 2 | 3,
    active: row.active ?? true,
    showOnHomepage: row.showOnHomepage ?? false,
    showInNav: row.showInNav ?? true,
    filters: (row.filters as unknown as PlainCategory["filters"]) ?? null,
    odooCategoryId: row.odooCategoryId ?? null,
    parentId: row.parentId ?? null,
    productCount: row._count?.products ?? undefined,
    // ISO strings, not Date instances — pages/category/[slug].js passes the
    // full object straight through as a getStaticProps prop, which requires
    // JSON-serializable values.
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

// Merges DB categories on top of the static list (by slug) so the admin
// dropdown is never empty before a database is connected, and so existing
// storefront category slugs keep working once one is. The two shapes
// genuinely differ (static entries only ever have slug/name/icon) — this is
// documenting a pre-existing merge, not something introduced by typing it.
export async function fetchCategories(): Promise<Array<PlainCategory | StaticCategory>> {
  if (!isDbConfigured()) return staticCategories;
  const rows = await prisma!.category.findMany({ orderBy: { name: "asc" } });
  const dbCategories = rows.map(toPlain);
  const dbSlugs = new Set(dbCategories.map((c) => c.slug));
  const staticOnly = staticCategories.filter((c) => !dbSlugs.has(c.slug));
  return [...staticOnly, ...dbCategories];
}

// Flat list of every category with product counts — used by the admin tree
// view (built into a tree client-side) and by search/dedup checks.
export async function fetchCategoriesFlat(): Promise<Array<PlainCategory | (StaticCategory & { level: number; parentId: null })>> {
  if (!isDbConfigured()) return staticCategories.map((c) => ({ ...c, level: 1, parentId: null }));
  const rows = await prisma!.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: [{ level: "asc" }, { order: "asc" }],
  });
  return rows.map(toPlain);
}

function buildTree(flat: PlainCategory[]): CategoryTreeNode[] {
  const byId: Record<string, CategoryTreeNode> = {};
  flat.forEach((c) => (byId[c.id] = { ...c, children: [] }));
  const roots: CategoryTreeNode[] = [];
  flat.forEach((c) => {
    if (c.parentId && byId[c.parentId]) {
      byId[c.parentId].children.push(byId[c.id]);
    } else if (!c.parentId) {
      roots.push(byId[c.id]);
    }
  });
  const sortRec = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

// Full 3-level tree, every category (active + inactive) — for the admin UI.
// Tree-building only ever runs against real DB rows in practice (the static
// fallback has no hierarchy to speak of), so the cast here reflects that,
// same as buildTree()'s own parameter type.
export async function fetchCategoryTree(): Promise<CategoryTreeNode[]> {
  const flat = (await fetchCategoriesFlat()) as PlainCategory[];
  return buildTree(flat);
}

// Same shape, but only active + showInNav rows — for the storefront mega
// menu / mobile accordion, which must never surface disabled categories.
export async function fetchCategoryNavTree(): Promise<CategoryTreeNode[]> {
  const flat = ((await fetchCategoriesFlat()) as PlainCategory[]).filter((c) => c.active && c.showInNav);
  return buildTree(flat);
}

export async function fetchHomepageCategories(): Promise<PlainCategory[]> {
  const flat = (await fetchCategoriesFlat()) as PlainCategory[];
  return flat.filter((c) => c.active && c.showOnHomepage).sort((a, b) => a.order - b.order);
}

// Category + its parent chain (for breadcrumbs) + its direct children —
// used by pages/category/[slug].js.
export async function fetchCategoryBySlug(slug: string): Promise<CategoryDetail | null> {
  if (!isDbConfigured()) {
    const match = staticCategories.find((c) => c.slug === slug);
    return match
      ? ({ ...match, level: 1, parentId: null, children: [], breadcrumbs: [] } as unknown as CategoryDetail)
      : null;
  }
  const row = await prisma!.category.findUnique({
    where: { slug },
    include: { _count: { select: { products: true } } },
  });
  if (!row) return null;

  const children = await prisma!.category.findMany({
    where: { parentId: row.id },
    include: { _count: { select: { products: true } } },
    orderBy: { order: "asc" },
  });

  const breadcrumbs: Array<{ slug: string; name: string }> = [];
  let current: Category = row;
  while (current.parentId) {
    const parent = await prisma!.category.findUnique({ where: { id: current.parentId } });
    if (!parent) break;
    breadcrumbs.unshift({ slug: parent.slug, name: parent.name });
    current = parent;
  }

  return {
    ...toPlain(row),
    children: children.map(toPlain),
    breadcrumbs,
  };
}

// Every descendant category id (children, grandchildren, ...) of a given
// category — used for "products in this category or any subcategory" on
// category landing pages, and for circular-parent checks.
export async function fetchDescendantIds(categoryId: string): Promise<string[]> {
  if (!isDbConfigured()) return [];
  const all = await prisma!.category.findMany({ select: { id: true, parentId: true } });
  const childrenOf: Record<string, string[]> = {};
  all.forEach((c) => {
    if (c.parentId) {
      (childrenOf[c.parentId] ||= []).push(c.id);
    }
  });
  const out: string[] = [];
  const walk = (id: string) => {
    (childrenOf[id] || []).forEach((childId) => {
      out.push(childId);
      walk(childId);
    });
  };
  walk(categoryId);
  return out;
}

// Slugs of every descendant category (children, grandchildren, ...) plus the
// category itself — used to aggregate products across a whole subtree on a
// main/subcategory landing page, since products only carry a direct
// categoryId and a main category like Household has none of its own.
export async function fetchCategoryAndDescendantSlugs(categoryId: string, ownSlug: string): Promise<string[]> {
  if (!isDbConfigured()) return [ownSlug];
  const descendantIds = await fetchDescendantIds(categoryId);
  if (descendantIds.length === 0) return [ownSlug];
  const rows = await prisma!.category.findMany({
    where: { id: { in: descendantIds } },
    select: { slug: true },
  });
  return [ownSlug, ...rows.map((r) => r.slug)];
}

// 301/308 lookup for a slug that no longer exists — checked before a
// category page 404s, so old bookmarked/indexed URLs keep working.
export async function findCategoryRedirect(slug: string): Promise<string | null> {
  if (!isDbConfigured()) return null;
  const row = await prisma!.categoryRedirect.findUnique({ where: { fromSlug: slug } });
  return row?.toSlug ?? null;
}

function normalizeSlug(input: string | null | undefined): string {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface DuplicateCheckInput {
  slug: string;
  name: string;
  parentId: string | null | undefined;
  excludeId: string | null;
}

async function assertNoDuplicate({ slug, name, parentId, excludeId }: DuplicateCheckInput): Promise<void> {
  const bySlug = await prisma!.category.findUnique({ where: { slug } });
  if (bySlug && bySlug.id !== excludeId) {
    throw new Error(`A category with slug "${slug}" already exists.`);
  }
  const siblings = await prisma!.category.findMany({
    where: { parentId: parentId || null },
  });
  const clash = siblings.find(
    (c) => c.id !== excludeId && c.name.trim().toLowerCase() === name.trim().toLowerCase()
  );
  if (clash) {
    throw new Error(`A category named "${name}" already exists under the same parent.`);
  }
}

async function assertNotCircular(categoryId: string, newParentId: string | null | undefined): Promise<void> {
  if (!newParentId) return;
  if (newParentId === categoryId) {
    throw new Error("A category cannot be its own parent.");
  }
  const descendants = await fetchDescendantIds(categoryId);
  if (descendants.includes(newParentId)) {
    throw new Error("Cannot move a category under one of its own subcategories.");
  }
}

async function levelForParent(parentId: string | null | undefined): Promise<number> {
  if (!parentId) return 1;
  const parent = await prisma!.category.findUnique({ where: { id: parentId } });
  if (!parent) throw new Error("Parent category not found.");
  if (parent.level >= 3) {
    throw new Error("Categories only support 3 levels (Main → Subcategory → Child).");
  }
  return parent.level + 1;
}

// Recomputes level for a subtree after a move, since a category's depth
// changes when it's reparented.
async function recomputeLevels(categoryId: string, newLevel: number): Promise<void> {
  await prisma!.category.update({ where: { id: categoryId }, data: { level: newLevel } });
  if (newLevel >= 3) return; // children would exceed 3 levels; caller must prevent this case
  const children = await prisma!.category.findMany({ where: { parentId: categoryId } });
  for (const child of children) {
    await recomputeLevels(child.id, newLevel + 1);
  }
}

function assertConfigured(): void {
  if (!isDbConfigured()) throw new Error("Database not configured.");
}

export interface CategoryInput {
  slug?: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  order?: number | string;
  active?: boolean;
  showOnHomepage?: boolean;
  showInNav?: boolean;
  filters?: unknown;
  odooCategoryId?: number | string | null;
  parentId?: string | null;
}

export async function createCategory(data: CategoryInput): Promise<PlainCategory> {
  assertConfigured();
  const slug = normalizeSlug(data.slug || data.name);
  if (!slug) throw new Error("A slug is required.");
  const parentId = data.parentId || null;
  const level = await levelForParent(parentId);
  await assertNoDuplicate({ slug, name: data.name, parentId, excludeId: null });

  const row = await prisma!.category.create({
    data: {
      slug,
      name: data.name,
      nameAr: data.nameAr || null,
      description: data.description || null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      icon: data.icon || "📦",
      imageUrl: data.imageUrl || null,
      order: Number.isFinite(Number(data.order)) ? Number(data.order) : 0,
      level,
      active: data.active ?? true,
      showOnHomepage: Boolean(data.showOnHomepage),
      showInNav: data.showInNav ?? true,
      filters: (data.filters as never) ?? undefined,
      odooCategoryId: data.odooCategoryId ? Number(data.odooCategoryId) : null,
      parentId,
    },
  });
  return toPlain(row);
}

export async function updateCategory(id: string, patch: Partial<CategoryInput>): Promise<PlainCategory> {
  assertConfigured();
  const existing = await prisma!.category.findUnique({ where: { id } });
  if (!existing) throw new Error("Category not found.");

  // Deliberately `any`: this builds a dynamic Prisma update payload
  // field-by-field from an arbitrary partial patch, same free-form shape
  // the original JS had.
  const data: Record<string, any> = {};
  if ("name" in patch) data.name = patch.name;
  if ("nameAr" in patch) data.nameAr = patch.nameAr || null;
  if ("description" in patch) data.description = patch.description || null;
  if ("seoTitle" in patch) data.seoTitle = patch.seoTitle || null;
  if ("seoDescription" in patch) data.seoDescription = patch.seoDescription || null;
  if ("icon" in patch) data.icon = patch.icon || "📦";
  if ("imageUrl" in patch) data.imageUrl = patch.imageUrl || null;
  if ("order" in patch) data.order = Number(patch.order) || 0;
  if ("active" in patch) data.active = Boolean(patch.active);
  if ("showOnHomepage" in patch) data.showOnHomepage = Boolean(patch.showOnHomepage);
  if ("showInNav" in patch) data.showInNav = Boolean(patch.showInNav);
  if ("filters" in patch) data.filters = patch.filters ?? null;
  if ("odooCategoryId" in patch) {
    data.odooCategoryId = patch.odooCategoryId ? Number(patch.odooCategoryId) : null;
  }

  const nextSlug = "slug" in patch ? normalizeSlug(patch.slug) : existing.slug;
  const nextParentId = "parentId" in patch ? patch.parentId || null : existing.parentId;
  const nextName = "name" in patch ? (patch.name as string) : existing.name;

  if (nextParentId !== existing.parentId) {
    await assertNotCircular(id, nextParentId);
    const newLevel = await levelForParent(nextParentId);
    // Reject the move up front if it would push any descendant past level 3.
    const descendants = await fetchDescendantIds(id);
    if (descendants.length > 0 && newLevel >= 3) {
      throw new Error(
        "Cannot move this category here — it has subcategories and this parent is already at the deepest level."
      );
    }
    data.parentId = nextParentId;
    data.level = newLevel;
  }

  if (nextSlug !== existing.slug || nextName !== existing.name) {
    await assertNoDuplicate({
      slug: nextSlug,
      name: nextName,
      parentId: nextParentId,
      excludeId: id,
    });
    data.slug = nextSlug;
  }

  const row = await prisma!.category.update({ where: { id }, data });

  if (data.level !== undefined && data.level !== existing.level) {
    const children = await prisma!.category.findMany({ where: { parentId: id } });
    for (const child of children) {
      await recomputeLevels(child.id, data.level + 1);
    }
  }

  return toPlain(row);
}

// Dedicated move — same validation as updateCategory's parentId branch, but
// callable directly by the admin tree's drag-and-drop without touching any
// other field.
export async function moveCategory(id: string, newParentId: string | null | undefined): Promise<PlainCategory> {
  return updateCategory(id, { parentId: newParentId || null });
}

export async function reorderCategories(parentId: string | null | undefined, orderedIds: string[]): Promise<true> {
  assertConfigured();
  const siblings = await prisma!.category.findMany({ where: { parentId: parentId || null } });
  const siblingIds = new Set(siblings.map((s) => s.id));
  const valid = orderedIds.filter((id) => siblingIds.has(id));
  await Promise.all(
    valid.map((id, index) => prisma!.category.update({ where: { id }, data: { order: index } }))
  );
  return true;
}

export async function deleteCategory(id: string): Promise<true> {
  assertConfigured();
  const existing = await prisma!.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!existing) throw new Error("Category not found.");
  if (existing._count.products > 0) {
    throw new Error(
      `Cannot delete "${existing.name}" — it still has ${existing._count.products} product(s). Move them to another category first.`
    );
  }
  const childCount = await prisma!.category.count({ where: { parentId: id } });
  if (childCount > 0) {
    throw new Error(
      `Cannot delete "${existing.name}" — it has ${childCount} subcategor${childCount === 1 ? "y" : "ies"}. Delete or move them first.`
    );
  }
  await prisma!.category.delete({ where: { id } });
  return true;
}
