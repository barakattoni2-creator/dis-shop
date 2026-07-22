import { prisma, isDbConfigured } from "@/lib/db";
import type { MediaAsset } from "@/lib/generated/prisma/client";
import type { PlainMediaAsset } from "@/types/domain";
import type { PaginatedResult } from "@/services/db/adminActivity";

function toPlain(row: MediaAsset): PlainMediaAsset {
  return {
    id: row.id,
    url: row.url,
    publicId: row.publicId,
    filename: row.filename,
    width: row.width,
    height: row.height,
    bytes: row.bytes,
    format: row.format,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function fetchMediaForAdmin({
  q = "",
  page = 1,
  pageSize = 24,
}: { q?: string; page?: number; pageSize?: number } = {}): Promise<PaginatedResult<PlainMediaAsset>> {
  if (!isDbConfigured()) return { rows: [], total: 0, page, pageSize };
  const where = q.trim() ? { filename: { contains: q.trim(), mode: "insensitive" as const } } : {};
  const [rows, total] = await Promise.all([
    prisma!.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma!.mediaAsset.count({ where }),
  ]);
  return { rows: rows.map(toPlain), total, page, pageSize };
}

export async function fetchMediaAssetById(id: string): Promise<PlainMediaAsset | null> {
  if (!isDbConfigured()) return null;
  const row = await prisma!.mediaAsset.findUnique({ where: { id } });
  return row ? toPlain(row) : null;
}

export interface MediaAssetInput {
  url: string;
  publicId: string;
  filename: string;
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
  format?: string | null;
}

export async function createMediaAsset(data: MediaAssetInput): Promise<PlainMediaAsset> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const row = await prisma!.mediaAsset.create({
    data: {
      url: data.url,
      publicId: data.publicId,
      filename: data.filename,
      width: data.width ?? null,
      height: data.height ?? null,
      bytes: data.bytes ?? null,
      format: data.format ?? null,
    },
  });
  return toPlain(row);
}

// DB-only — deleting the Cloudinary asset itself is a separate concern
// (lib/upload.ts's deleteMediaAsset) that the API route orchestrates
// alongside this, same separation services/db/* keeps everywhere else.
export async function deleteMediaAssetRow(id: string): Promise<true> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  await prisma!.mediaAsset.delete({ where: { id } });
  return true;
}
