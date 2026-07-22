// Client-safe (no Prisma import) — shared between lib/adminAuth.js (server,
// enforces it), AdminLayout.js (client, hides nav the current role can't
// use) and admin pages (server, gates each route).

export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "SALES", "WAREHOUSE", "DELIVERY"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  SALES: "Sales",
  WAREHOUSE: "Warehouse",
  DELIVERY: "Delivery",
};

export const PERMISSIONS = {
  VIEW_DASHBOARD: "view_dashboard",
  MANAGE_PRODUCTS: "manage_products",
  MANAGE_CATEGORIES: "manage_categories",
  MANAGE_BRANDS: "manage_brands",
  MANAGE_ORDERS: "manage_orders",
  MANAGE_DELIVERIES: "manage_deliveries",
  MANAGE_BANNERS: "manage_banners",
  MANAGE_CUSTOMERS: "manage_customers",
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_SEARCH: "manage_search",
  MANAGE_ODOO: "manage_odoo",
  MANAGE_USERS: "manage_users",
  VIEW_FINANCIALS: "view_financials",
  MANAGE_AI: "manage_ai",
  MANAGE_MEDIA: "manage_media",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];

// "Restrict financial and Odoo actions by permission" — VIEW_FINANCIALS and
// MANAGE_ODOO are deliberately withheld from plain ADMIN, not just the
// lower operational roles, since those two are singled out in the spec as
// needing tighter control than general admin access.
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  ADMIN: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_BRANDS,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.MANAGE_DELIVERIES,
    PERMISSIONS.MANAGE_BANNERS,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.MANAGE_SEARCH,
    PERMISSIONS.MANAGE_MEDIA,
  ],
  SALES: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.VIEW_FINANCIALS,
  ],
  WAREHOUSE: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_BRANDS,
    PERMISSIONS.MANAGE_DELIVERIES,
    PERMISSIONS.MANAGE_MEDIA,
  ],
  DELIVERY: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.MANAGE_DELIVERIES],
};

export function hasPermission(role: AdminRole | string | null | undefined, permission?: Permission | null): boolean {
  if (!permission) return true;
  return (ROLE_PERMISSIONS[role as AdminRole] || []).includes(permission);
}

export function permissionsForRole(role: AdminRole | string | null | undefined): Permission[] {
  return ROLE_PERMISSIONS[role as AdminRole] || [];
}

// Maps each admin route to the permission required to view it — used both
// by each page's getServerSideProps guard (server) and by AdminLayout to
// hide nav links the signed-in role can't use (client).
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/admin/dashboard": PERMISSIONS.VIEW_DASHBOARD,
  "/admin/products": PERMISSIONS.MANAGE_PRODUCTS,
  "/admin/inventory": PERMISSIONS.MANAGE_PRODUCTS,
  "/admin/categories": PERMISSIONS.MANAGE_CATEGORIES,
  "/admin/brands": PERMISSIONS.MANAGE_BRANDS,
  "/admin/orders": PERMISSIONS.MANAGE_ORDERS,
  "/admin/deliveries": PERMISSIONS.MANAGE_DELIVERIES,
  "/admin/banners": PERMISSIONS.MANAGE_BANNERS,
  "/admin/media": PERMISSIONS.MANAGE_MEDIA,
  "/admin/reports": PERMISSIONS.VIEW_FINANCIALS,
  "/admin/customers": PERMISSIONS.MANAGE_CUSTOMERS,
  "/admin/settings": PERMISSIONS.MANAGE_SETTINGS,
  "/admin/settings/search": PERMISSIONS.MANAGE_SEARCH,
  "/admin/odoo": PERMISSIONS.MANAGE_ODOO,
  "/admin/users": PERMISSIONS.MANAGE_USERS,
  // AI system — Super Admin only by default (same tier as MANAGE_ODOO /
  // MANAGE_USERS / VIEW_FINANCIALS), since it spans every domain and has
  // real external API cost. See services/ai/suggestions.js for the extra,
  // per-suggestion-type permission checks required to actually approve/
  // apply anything beyond just viewing this section.
  "/admin/ai": PERMISSIONS.MANAGE_AI,
  "/admin/ai/product-assistant": PERMISSIONS.MANAGE_AI,
  "/admin/ai/content-assistant": PERMISSIONS.MANAGE_AI,
  "/admin/ai/inventory-assistant": PERMISSIONS.MANAGE_AI,
  "/admin/ai/sales-assistant": PERMISSIONS.MANAGE_AI,
  "/admin/ai/quotation-assistant": PERMISSIONS.MANAGE_AI,
  "/admin/ai/customer-support-assistant": PERMISSIONS.MANAGE_AI,
  "/admin/ai/marketing-assistant": PERMISSIONS.MANAGE_AI,
  "/admin/ai/approvals": PERMISSIONS.MANAGE_AI,
  "/admin/ai/activity": PERMISSIONS.MANAGE_AI,
  "/admin/ai/settings": PERMISSIONS.MANAGE_AI,
};
