import { v2 as cloudinary } from "cloudinary";

export function isUploadConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

let configured = false;
function ensureConfigured(): void {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  configured = true;
}

// dataUrl: a "data:image/...;base64,...." string read client-side via FileReader.
export async function uploadProductImage(dataUrl: string): Promise<string> {
  if (!isUploadConfigured()) {
    throw new Error(
      "Image upload isn't configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local."
    );
  }
  ensureConfigured();
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: "dis-shop/products",
    resource_type: "image",
  });
  return result.secure_url;
}

export interface UploadedMedia {
  url: string;
  publicId: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  format: string | null;
}

// Separate folder ("dis-shop/media") and, unlike uploadProductImage, keeps
// the full Cloudinary response — the Media Library needs public_id (to
// support real deletion via deleteMediaAsset below) plus width/height/bytes
// to show in the gallery, none of which uploadProductImage's callers ever
// needed.
export async function uploadMediaAsset(dataUrl: string): Promise<UploadedMedia> {
  if (!isUploadConfigured()) {
    throw new Error(
      "Image upload isn't configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local."
    );
  }
  ensureConfigured();
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: "dis-shop/media",
    resource_type: "image",
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width ?? null,
    height: result.height ?? null,
    bytes: result.bytes ?? null,
    format: result.format ?? null,
  };
}

// Product videos/PDF catalogs — separate from uploadProductImage /
// uploadMediaAsset since Cloudinary needs a different resource_type for
// non-image files ("video" for video, "raw" for PDFs), and these are
// larger uploads that don't belong in the Media Library's image grid.
export async function uploadProductFile(
  dataUrl: string,
  resourceType: "video" | "raw"
): Promise<string> {
  if (!isUploadConfigured()) {
    throw new Error(
      "Upload isn't configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local."
    );
  }
  ensureConfigured();
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: resourceType === "video" ? "dis-shop/videos" : "dis-shop/catalogs",
    resource_type: resourceType,
  });
  return result.secure_url;
}

// Removes the asset from Cloudinary itself, not just this app's DB row —
// called by the media-delete API route before deleting the MediaAsset row,
// so the library never accumulates orphaned files on Cloudinary's side.
// Swallows "not found" (already deleted directly in Cloudinary's own
// dashboard) rather than blocking the DB row from being cleaned up too.
export async function deleteMediaAsset(publicId: string): Promise<void> {
  if (!isUploadConfigured()) return;
  ensureConfigured();
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (err) {
    const message = (err as Error).message || "";
    if (!/not found/i.test(message)) throw err;
  }
}
