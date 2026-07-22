// Pure URL string transforms — no Cloudinary SDK/credentials, so this is
// safe to import from client components (unlike lib/upload.ts, which pulls
// in the server-only `cloudinary` package). Cloudinary parses transform
// params inserted right after "/upload/" in the URL path; f_auto lets
// Cloudinary negotiate WebP/AVIF per-browser instead of hardcoding one
// format, serving smaller files to more browsers than a fixed f_webp
// would. Non-Cloudinary URLs pass through untouched.
function insertTransform(url: string, transform: string): string {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

export function getThumbnailUrl(url: string, size = 200): string {
  return insertTransform(url, `w_${size},h_${size},c_fill,f_auto,q_auto`);
}

export function getOptimizedUrl(url: string): string {
  return insertTransform(url, "f_auto,q_auto");
}
