import { prisma, isDbConfigured } from "@/lib/db";
import type { Banner } from "@/lib/generated/prisma/client";
import type { PlainBanner } from "@/types/domain";

function toPlain(row: Banner): PlainBanner {
  return {
    id: row.id,
    eyebrow: row.eyebrow,
    title: row.title,
    subtitle: row.subtitle,
    discount: row.discount,
    imageUrl: row.imageUrl,
    mobileImageUrl: row.mobileImageUrl,
    linkUrl: row.linkUrl,
    bgColor: row.bgColor,
    ctaLabel: row.ctaLabel,
    order: row.order,
    startDate: row.startDate ? row.startDate.toISOString() : null,
    endDate: row.endDate ? row.endDate.toISOString() : null,
    active: row.active,
    status: row.status === "DRAFT" ? "DRAFT" : "ACTIVE",
    overlayOpacity: row.overlayOpacity,
    textAlign: row.textAlign === "center" || row.textAlign === "right" ? row.textAlign : "left",
    openInNewTab: row.openInNewTab,
  };
}

// All banners, including inactive/out-of-window ones — used by the admin
// dashboard, which needs to show and let admins edit scheduled/expired
// banners too, not just what's currently live.
export async function fetchAllBanners(): Promise<PlainBanner[]> {
  if (!isDbConfigured()) return [];
  const rows = await prisma!.banner.findMany({ orderBy: { order: "asc" } });
  return rows.map(toPlain);
}

// Active AND within its scheduling window (if any) — used by the storefront
// homepage. A null startDate/endDate means "no lower/upper bound", so a
// banner with neither set behaves exactly as before this feature existed.
// DRAFT banners are excluded unconditionally, regardless of `active`/dates —
// existing rows default to status "ACTIVE" so nothing already live changes.
export async function fetchActiveBanners(): Promise<PlainBanner[]> {
  if (!isDbConfigured()) return [];
  const now = new Date();
  const rows = await prisma!.banner.findMany({
    where: {
      active: true,
      status: "ACTIVE",
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    orderBy: { order: "asc" },
  });
  return rows.map(toPlain);
}

export interface BannerInput {
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  discount?: string | null;
  imageUrl?: string | null;
  mobileImageUrl?: string | null;
  linkUrl?: string | null;
  bgColor?: string | null;
  ctaLabel?: string | null;
  order?: number | string;
  startDate?: string | null;
  endDate?: string | null;
  active?: boolean;
  status?: "DRAFT" | "ACTIVE";
  overlayOpacity?: number | string;
  textAlign?: "left" | "center" | "right";
  openInNewTab?: boolean;
}

function toDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createBanner(data: BannerInput): Promise<PlainBanner> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const row = await prisma!.banner.create({
    data: {
      eyebrow: data.eyebrow || null,
      title: data.title,
      subtitle: data.subtitle || null,
      discount: data.discount || null,
      imageUrl: data.imageUrl || null,
      mobileImageUrl: data.mobileImageUrl || null,
      linkUrl: data.linkUrl || null,
      bgColor: data.bgColor || null,
      ctaLabel: data.ctaLabel || null,
      order: Number(data.order) || 0,
      startDate: toDateOrNull(data.startDate),
      endDate: toDateOrNull(data.endDate),
      active: data.active ?? true,
      status: data.status || "ACTIVE",
      overlayOpacity: data.overlayOpacity !== undefined ? Number(data.overlayOpacity) || 0 : 100,
      textAlign: data.textAlign || "left",
      openInNewTab: data.openInNewTab ?? false,
    },
  });
  return toPlain(row);
}

export async function updateBanner(id: string, patch: Partial<BannerInput>): Promise<PlainBanner> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const data: Record<string, unknown> = { ...patch };
  if ("order" in data) data.order = Number(data.order) || 0;
  if ("startDate" in data) data.startDate = toDateOrNull(patch.startDate);
  if ("endDate" in data) data.endDate = toDateOrNull(patch.endDate);
  if ("overlayOpacity" in data) data.overlayOpacity = Number(data.overlayOpacity) || 0;
  const row = await prisma!.banner.update({ where: { id }, data });
  return toPlain(row);
}

export async function deleteBanner(id: string): Promise<true> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  await prisma!.banner.delete({ where: { id } });
  return true;
}

// Bulk display-order update for the full banner list — mirrors
// reorderPopularSearchTerms (services/db/search.ts): banners are a flat
// list (no parent scoping needed, unlike categories), so every id in
// orderedIds gets its `order` set to its index in one transaction.
export async function reorderBanners(orderedIds: string[]): Promise<true> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  await prisma!.$transaction(
    orderedIds.map((id, index) => prisma!.banner.update({ where: { id }, data: { order: index } }))
  );
  return true;
}
