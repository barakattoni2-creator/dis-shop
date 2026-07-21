// Set NEXT_PUBLIC_SITE_URL once DIS Shop has a real domain — used for
// canonical URLs, Open Graph tags and the sitemap. Falls back to a
// placeholder so nothing breaks before that's configured.
export const SITE_URL: string = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://disshop.example.com"
).replace(/\/$/, "");

export const SITE_NAME = "DIS Shop";
