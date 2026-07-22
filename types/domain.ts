import type { AdminRole, Permission } from "@/data/adminRoles";

export type { AdminRole, Permission };

// Shared, hand-written domain types for the shapes services/db/*.ts actually
// return to the rest of the app — these are deliberately NOT the raw Prisma
// row types (import those directly from "@/lib/generated/prisma/client"
// when a file needs the literal DB shape). A service's `toPlain()` mapper
// flattens relations (e.g. Product.category becomes a slug string, not a
// Category object) and drops internal-only fields, so the two shapes differ
// on purpose and shouldn't be conflated.
//
// Grown incrementally as each phase of the TS migration touches the file
// that owns a shape — see AGENTS.md's "TypeScript migration in progress".

export interface PlainProduct {
  id: string;
  name: string;
  category: string | null;
  brand: string | null;
  brandLogo: string | null;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  badge: string | null;
  isNew: boolean;
  color: string;
  imageUrl: string | null;
  images: string[];
  videoUrl: string | null;
  stock: number;
  sku: string | null;
  featured: boolean;
  description: string | null;
  specs: Record<string, string> | null;
  updatedAt: string | null;
}

export interface PlainCategory {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  icon: string;
  imageUrl: string;
  order: number;
  level: 1 | 2 | 3;
  active: boolean;
  showOnHomepage: boolean;
  showInNav: boolean;
  filters: CategoryFilterDef[] | null;
  odooCategoryId: number | null;
  parentId: string | null;
  productCount?: number;
  createdAt: string | null;
  updatedAt: string | null;
}

// Populated by fetchCategoryTree()/fetchCategoryNavTree() — not present on
// every PlainCategory, only tree-shaped results.
export interface CategoryTreeNode extends PlainCategory {
  children: CategoryTreeNode[];
}

// Populated by fetchCategoryBySlug() only.
export interface CategoryDetail extends PlainCategory {
  children: PlainCategory[];
  breadcrumbs: Array<{ slug: string; name: string }>;
}

export interface CategoryFilterDef {
  key: string;
  label: string;
  type: "select" | "range" | "checkbox";
  options?: string[];
}

export interface PlainBrand {
  id?: string;
  name: string;
  logoUrl: string | null;
  productCount?: number;
}

// lib/adminAuth.js's session cookie payload.
export interface AdminSession {
  email: string;
  role: AdminRole;
  issuedAt: number;
  lastActivity: number;
}

export interface PlainCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  orderCount: number;
  createdAt: Date;
}

export interface PlainReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
  verified: boolean;
  createdAt: Date;
}

export interface PlainBanner {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  discount: string | null;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  linkUrl: string | null;
  bgColor: string | null;
  ctaLabel: string | null;
  order: number;
  // ISO strings, not Date — this shape is passed through getStaticProps as
  // page props, which Next.js serializes to JSON (Date objects aren't
  // JSON-serializable as-is).
  startDate: string | null;
  endDate: string | null;
  active: boolean;
}

export interface PlainAdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

