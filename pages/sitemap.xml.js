import { fetchProducts, fetchCategories, fetchBrands } from "@/lib/catalog";
import { SITE_URL } from "@/data/site";

const STATIC_PATHS = [
  "",
  "/shop",
  "/categories",
  "/brands",
  "/about",
  "/contact",
  "/track-order",
];

export async function getServerSideProps({ res }) {
  const [products, categories, brands] = await Promise.all([
    fetchProducts(),
    fetchCategories(),
    fetchBrands(),
  ]);

  // Categories carry an `active` flag once a database is connected (the
  // pre-DB static fallback list has none, so `!== false` keeps every entry
  // in that case) — a disabled category must never end up indexed.
  const visibleCategories = categories.filter((c) => c.active !== false);

  const entries = [
    ...STATIC_PATHS.map((path) => ({ loc: `${SITE_URL}${path}`, changefreq: "daily" })),
    ...visibleCategories.map((c) => ({
      loc: `${SITE_URL}/category/${c.slug}`,
      lastmod: c.updatedAt,
      changefreq: "daily",
    })),
    ...brands.map((b) => ({ loc: `${SITE_URL}/brand/${encodeURIComponent(b.name)}`, changefreq: "weekly" })),
    ...products.map((p) => ({
      loc: `${SITE_URL}/product/${p.id}`,
      lastmod: p.updatedAt,
      changefreq: "weekly",
    })),
  ];

  const isoOrNull = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((e) => {
    const lastmod = isoOrNull(e.lastmod);
    return `  <url><loc>${e.loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}${e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : ""}</url>`;
  })
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.write(body);
  res.end();
  return { props: {} };
}

export default function Sitemap() {
  return null;
}
