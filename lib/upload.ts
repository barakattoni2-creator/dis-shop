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
