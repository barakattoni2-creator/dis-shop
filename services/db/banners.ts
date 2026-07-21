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
    linkUrl: row.linkUrl,
    bgColor: row.bgColor,
    ctaLabel: row.ctaLabel,
    order: row.order,
    active: row.active,
  };
}

// All banners, including inactive ones — used by the admin dashboard.
export async function fetchAllBanners(): Promise<PlainBanner[]> {
  if (!isDbConfigured()) return [];
  const rows = await prisma!.banner.findMany({ orderBy: { order: "asc" } });
  return rows.map(toPlain);
}

// Active banners only, in display order — used by the storefront homepage.
export async function fetchActiveBanners(): Promise<PlainBanner[]> {
  if (!isDbConfigured()) return [];
  const rows = await prisma!.banner.findMany({
    where: { active: true },
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
  linkUrl?: string | null;
  bgColor?: string | null;
  ctaLabel?: string | null;
  order?: number | string;
  active?: boolean;
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
      linkUrl: data.linkUrl || null,
      bgColor: data.bgColor || null,
      ctaLabel: data.ctaLabel || null,
      order: Number(data.order) || 0,
      active: data.active ?? true,
    },
  });
  return toPlain(row);
}

export async function updateBanner(id: string, patch: Partial<BannerInput>): Promise<PlainBanner> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const data: Record<string, unknown> = { ...patch };
  if ("order" in data) data.order = Number(data.order) || 0;
  const row = await prisma!.banner.update({ where: { id }, data });
  return toPlain(row);
}

export async function deleteBanner(id: string): Promise<true> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  await prisma!.banner.delete({ where: { id } });
  return true;
}
