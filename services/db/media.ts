import { prisma, isDbConfigured } from "@/lib/db";
import type { MediaAsset } from "@/lib/generated/prisma/client";
import type { PlainMediaAsset } from "@/types/domain";
import type { PaginatedResult } from "@/services/db/adminActivity";
import { isMediaFolder } from "@/data/mediaFolders";

function toPlain(row: MediaAsset): PlainMediaAsset {
  return {
    id: row.id,
    url: row.url,
    publicId: row.publicId,
    filename: row.filename,
    folder: row.folder,
    width: row.width,
    height: row.height,
    bytes: row.bytes,
    format: row.format,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function fetchMediaForAdmin({
  q = "",
  folder = "",
  page = 1,
  pageSize = 24,
}: {
  q?: string;
  folder?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<PaginatedResult<PlainMediaAsset>> {
  if (!isDbConfigured()) return { rows: [], total: 0, page, pageSize };
  const where: Record<string, unknown> = {};
  if (q.trim()) where.filename = { contains: q.trim(), mode: "insensitive" as const };
  if (folder && isMediaFolder(folder)) where.folder = folder;
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

// One count per folder, used for the sidebar/tabs — a single grouped query
// instead of one count() per folder.
export async function fetchMediaFolderCounts(): Promise<Record<string, number>> {
  if (!isDbConfigured()) return {};
  const rows = await prisma!.mediaAsset.groupBy({ by: ["folder"], _count: { folder: true } });
  return Object.fromEntries(rows.map((r) => [r.folder, r._count.folder]));
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
  folder?: string;
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
      folder: data.folder && isMediaFolder(data.folder) ? data.folder : "General",
      width: data.width ?? null,
      height: data.height ?? null,
      bytes: data.bytes ?? null,
      format: data.format ?? null,
    },
  });
  return toPlain(row);
}

// Rename and/or move to a different folder — the two "metadata only"
// edits that don't touch the underlying Cloudinary file (see
// replaceMediaAssetContent below for actually swapping the image itself).
export async function updateMediaAsset(
  id: string,
  patch: { filename?: string; folder?: string }
): Promise<PlainMediaAsset> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const data: Record<string, unknown> = {};
  if (patch.filename !== undefined) {
    const trimmed = patch.filename.trim();
    if (!trimmed) throw new Error("Filename can't be empty.");
    data.filename = trimmed;
  }
  if (patch.folder !== undefined) {
    if (!isMediaFolder(patch.folder)) throw new Error(`"${patch.folder}" is not a valid folder.`);
    data.folder = patch.folder;
  }
  const row = await prisma!.mediaAsset.update({ where: { id }, data });
  return toPlain(row);
}

// Called after lib/upload.ts's replaceMediaAsset re-uploads new content to
// the same Cloudinary public_id — the url/publicId are unchanged (that's
// the point), only the file's own metadata (dimensions/size/format) needs
// updating here.
export async function replaceMediaAssetContent(
  id: string,
  data: { width: number | null; height: number | null; bytes: number | null; format: string | null }
): Promise<PlainMediaAsset> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const row = await prisma!.mediaAsset.update({ where: { id }, data });
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
