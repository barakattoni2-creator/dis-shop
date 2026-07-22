// Client-safe (no Prisma import) — shared between the Media Library UI,
// its API routes, and services/db/media.ts. MediaAsset.folder is a plain
// string column (not a DB enum, see prisma/schema.prisma's comment), so
// this list is the single source of truth for what "valid" folders are.
export const MEDIA_FOLDERS = ["General", "Products", "Categories", "Brands", "Banners", "Logos"] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export function isMediaFolder(value: string): value is MediaFolder {
  return (MEDIA_FOLDERS as readonly string[]).includes(value);
}

// Cloudinary sub-folder for a given library folder, e.g. "dis-shop/media/products".
export function cloudinaryFolderFor(folder: string): string {
  const safe = isMediaFolder(folder) ? folder : "General";
  return `dis-shop/media/${safe.toLowerCase()}`;
}
