import { prisma, isDbConfigured } from "@/lib/db";
import { hasPermission, PERMISSIONS } from "@/data/adminRoles";
import { getAiMode } from "@/services/db/aiSettings";
import { logAiActivity } from "@/services/db/aiActivity";
import { logAdminActivity } from "@/services/db/adminActivity";
import { ODOO_CONFIG } from "@/services/odoo/config";
import type { AiSuggestion } from "@/lib/generated/prisma/client";
import type { AdminRole, Permission } from "@/types/domain";
import type { PaginatedResult } from "@/services/db/adminActivity";

// Every suggestion type the AI is allowed to produce, and every permission
// (from the SAME RBAC used by the rest of Admin — no parallel system) an
// approver must hold to approve+apply it. Types not listed here can never be
// approved, which also means: deleting/disabling a record is not a valid
// suggestion type at all — not just permission-gated, structurally absent.
export const SUGGESTION_TYPES = {
  PRODUCT_FIELD: "PRODUCT_FIELD",
  PRODUCT_DESCRIPTION: "PRODUCT_DESCRIPTION",
  SEO: "SEO",
  KEYWORDS: "KEYWORDS",
  RELATED_PRODUCTS: "RELATED_PRODUCTS",
  DUPLICATE_FLAG: "DUPLICATE_FLAG",
  LOW_STOCK_WARNING: "LOW_STOCK_WARNING",
  REORDER_SUGGESTION: "REORDER_SUGGESTION",
  CUSTOMER_REPLY_DRAFT: "CUSTOMER_REPLY_DRAFT",
  QUOTATION_DRAFT: "QUOTATION_DRAFT",
  CONTENT_DRAFT: "CONTENT_DRAFT",
  REPORT: "REPORT",
} as const;

export type SuggestionType = keyof typeof SUGGESTION_TYPES;

const TYPE_PERMISSIONS: Record<string, Permission[]> = {
  PRODUCT_FIELD: [PERMISSIONS.MANAGE_PRODUCTS],
  PRODUCT_DESCRIPTION: [PERMISSIONS.MANAGE_PRODUCTS],
  SEO: [PERMISSIONS.MANAGE_PRODUCTS],
  KEYWORDS: [PERMISSIONS.MANAGE_SEARCH],
  RELATED_PRODUCTS: [PERMISSIONS.MANAGE_PRODUCTS],
  DUPLICATE_FLAG: [PERMISSIONS.MANAGE_PRODUCTS],
  LOW_STOCK_WARNING: [PERMISSIONS.MANAGE_PRODUCTS],
  REORDER_SUGGESTION: [PERMISSIONS.MANAGE_PRODUCTS],
  CUSTOMER_REPLY_DRAFT: [PERMISSIONS.MANAGE_CUSTOMERS],
  QUOTATION_DRAFT: [PERMISSIONS.MANAGE_ORDERS, PERMISSIONS.VIEW_FINANCIALS],
  CONTENT_DRAFT: [PERMISSIONS.MANAGE_BANNERS],
  REPORT: [PERMISSIONS.VIEW_DASHBOARD],
};

// Suggestion types whose approval touches pricing specifically need
// VIEW_FINANCIALS on top of the base permission — checked by the caller
// passing `touchesPricing: true` when creating/approving such a suggestion.
const PRICING_EXTRA_PERMISSION = PERMISSIONS.VIEW_FINANCIALS;

export type Applier = (suggestion: AiSuggestion, ctx: { approverEmail: string; ip: string | null }) => Promise<void>;

// Phase 2+ registers real appliers here (e.g. APPLIERS.PRODUCT_FIELD = fn
// that calls services/db/products.ts's updateProduct with the suggested
// patch). Phase 1 has none — approving a suggestion is fully functional and
// audited, it just has nothing to apply yet.
const APPLIERS: Record<string, Applier> = {};

export function registerApplier(type: string, fn: Applier): void {
  APPLIERS[type] = fn;
}

function assertDbConfigured(): void {
  if (!isDbConfigured()) throw new Error("Database not configured.");
}

export interface FetchSuggestionsFilters {
  status?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchSuggestions({
  status,
  type,
  page = 1,
  pageSize = 20,
}: FetchSuggestionsFilters = {}): Promise<PaginatedResult<AiSuggestion>> {
  if (!isDbConfigured()) return { rows: [], total: 0, page, pageSize };
  const where: Record<string, string> = {};
  if (status) where.status = status;
  if (type) where.type = type;
  const [rows, total] = await Promise.all([
    prisma!.aiSuggestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma!.aiSuggestion.count({ where }),
  ]);
  return { rows, total, page, pageSize };
}

export type SuggestionCounts = Record<"PENDING" | "APPROVED" | "REJECTED" | "APPLIED" | "EXPIRED", number>;

export async function fetchSuggestionCounts(): Promise<SuggestionCounts> {
  if (!isDbConfigured()) return { PENDING: 0, APPROVED: 0, REJECTED: 0, APPLIED: 0, EXPIRED: 0 };
  const rows = await prisma!.aiSuggestion.groupBy({ by: ["status"], _count: { _all: true } });
  const counts: SuggestionCounts = { PENDING: 0, APPROVED: 0, REJECTED: 0, APPLIED: 0, EXPIRED: 0 };
  rows.forEach((r) => {
    counts[r.status as keyof SuggestionCounts] = r._count._all;
  });
  return counts;
}

function requiredPermissionsFor(type: string, touchesPricing: boolean): Permission[] | null {
  const perms = TYPE_PERMISSIONS[type];
  if (!perms) return null; // unknown type — never approvable
  return touchesPricing ? [...new Set([...perms, PRICING_EXTRA_PERMISSION])] : perms;
}

function assertApproverAllowed(role: AdminRole, type: string, touchesPricing: boolean): void {
  const perms = requiredPermissionsFor(type, touchesPricing);
  if (!perms) {
    throw new Error(`"${type}" is not a recognized, approvable suggestion type.`);
  }
  const missing = perms.filter((p) => !hasPermission(role, p));
  if (missing.length > 0) {
    throw new Error(`You don't have permission to approve this suggestion (missing: ${missing.join(", ")}).`);
  }
}

export interface ApproveSuggestionInput {
  id: string;
  approverEmail: string;
  approverRole: AdminRole;
  ip: string | null;
}

export interface ApplyResult {
  status: "APPROVED" | "APPLIED";
  applied: boolean;
}

export async function approveSuggestion({
  id,
  approverEmail,
  approverRole,
  ip,
}: ApproveSuggestionInput): Promise<ApplyResult> {
  assertDbConfigured();
  if (getAiMode() === "disabled") {
    throw new Error("AI system is disabled (AI_MODE=disabled).");
  }

  const suggestion = await prisma!.aiSuggestion.findUnique({ where: { id } });
  if (!suggestion) throw new Error("Suggestion not found.");
  if (suggestion.status !== "PENDING") {
    throw new Error(`This suggestion is already ${suggestion.status.toLowerCase()}.`);
  }

  const payload = suggestion.payload as Record<string, unknown> | null;
  const touchesPricing = Boolean(payload?.touchesPricing);
  assertApproverAllowed(approverRole, suggestion.type, touchesPricing);

  // Odoo writes stay hard-blocked while sync is disabled — approval is
  // recorded (so the intent is visible), but apply is refused regardless of
  // who approved it or what role they hold.
  const targetsOdoo = Boolean(payload?.targetsOdoo);
  if (targetsOdoo && !ODOO_CONFIG.syncEnabled) {
    await logAiActivity({
      suggestionId: id,
      action: "blocked",
      actorEmail: approverEmail,
      targetType: suggestion.targetType,
      targetId: suggestion.targetId,
      status: "blocked",
      details: "Odoo sync is disabled — this suggestion cannot be applied.",
      ip,
    });
    throw new Error("This suggestion would update Odoo, but Odoo sync is currently disabled.");
  }

  const now = new Date();
  await prisma!.aiSuggestion.update({
    where: { id },
    data: { status: "APPROVED", reviewedBy: approverEmail, reviewedAt: now },
  });
  await logAiActivity({
    suggestionId: id,
    action: "approved",
    actorEmail: approverEmail,
    targetType: suggestion.targetType,
    targetId: suggestion.targetId,
    status: "success",
    details: suggestion.title,
    ip,
  });
  await logAdminActivity(approverEmail, "ai_suggestion_approved", suggestion.title, ip);

  const applier = APPLIERS[suggestion.type];
  if (!applier) {
    // Nothing registered yet to actually perform this write (Phase 1) —
    // stays APPROVED, visibly waiting, rather than silently pretending to
    // have done something.
    return { status: "APPROVED", applied: false };
  }

  try {
    await applier(suggestion, { approverEmail, ip });
    await prisma!.aiSuggestion.update({ where: { id }, data: { status: "APPLIED", appliedAt: new Date() } });
    await logAiActivity({
      suggestionId: id,
      action: "applied",
      actorEmail: approverEmail,
      targetType: suggestion.targetType,
      targetId: suggestion.targetId,
      status: "success",
      details: suggestion.title,
      ip,
    });
    return { status: "APPLIED", applied: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAiActivity({
      suggestionId: id,
      action: "applied",
      actorEmail: approverEmail,
      targetType: suggestion.targetType,
      targetId: suggestion.targetId,
      status: "failed",
      details: message,
      ip,
    });
    throw new Error(`Approved, but applying it failed: ${message}`);
  }
}

export interface RejectSuggestionInput {
  id: string;
  approverEmail: string;
  ip: string | null;
}

export async function rejectSuggestion({ id, approverEmail, ip }: RejectSuggestionInput): Promise<{ status: "REJECTED" }> {
  assertDbConfigured();
  const suggestion = await prisma!.aiSuggestion.findUnique({ where: { id } });
  if (!suggestion) throw new Error("Suggestion not found.");
  if (suggestion.status !== "PENDING") {
    throw new Error(`This suggestion is already ${suggestion.status.toLowerCase()}.`);
  }
  await prisma!.aiSuggestion.update({
    where: { id },
    data: { status: "REJECTED", reviewedBy: approverEmail, reviewedAt: new Date() },
  });
  await logAiActivity({
    suggestionId: id,
    action: "rejected",
    actorEmail: approverEmail,
    targetType: suggestion.targetType,
    targetId: suggestion.targetId,
    status: "success",
    details: suggestion.title,
    ip,
  });
  await logAdminActivity(approverEmail, "ai_suggestion_rejected", suggestion.title, ip);
  return { status: "REJECTED" };
}
