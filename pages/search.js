import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import FeaturedProducts from "@/components/FeaturedProducts";
import { fetchProducts } from "@/lib/catalog";
import styles from "@/styles/Search.module.css";

export async function getStaticProps() {
  const products = await fetchProducts().catch(() => []);
  return { props: { products }, revalidate: 60 };
}

const EMPTY_CONFIG = { synonymGroups: [], popularSearches: [], priorityWeights: {}, keywords: {} };

// A term in the query triggers its whole synonym group (exact match, case
// insensitive) — this only ever *adds* extra terms to search for, it never
// narrows what the plain substring search below already finds.
function expandQuery(query, synonymGroups) {
  const q = query.toLowerCase();
  const terms = new Set([q]);
  for (const group of synonymGroups) {
    if (group.some((t) => t.toLowerCase() === q)) {
      group.forEach((t) => terms.add(t.toLowerCase()));
    }
  }
  return [...terms];
}

// "Model" and "Tags" have no dedicated Product columns — they score against
// admin-entered ProductSearchKeyword.technicalKeywords/.searchTags instead
// (see services/db/search.js for the same mapping on the admin side).
function buildHaystack(product, keyword, weights) {
  const entries = [];
  const push = (text, weight) => {
    if (text) entries.push({ text: String(text).toLowerCase(), weight: weight || 0 });
  };
  push(product.sku, weights.sku);
  push(product.name, weights.name);
  push(product.brand, weights.brand);
  push(product.category, weights.category);
  push(product.description, weights.description);
  if (product.specs) push(Object.values(product.specs).join(" "), weights.specifications);
  if (keyword) {
    push(keyword.arabicName, weights.name);
    push(keyword.englishName, weights.name);
    push(keyword.alternativeNames?.join(" "), weights.name);
    push(keyword.misspellings?.join(" "), weights.name);
    push(keyword.searchTags?.join(" "), weights.tags);
    push(keyword.technicalKeywords?.join(" "), weights.model);
  }
  return entries;
}

export default function SearchPage({ products }) {
  const router = useRouter();
  const { q } = router.query;
  const query = String(q || "").trim().toLowerCase();
  const [config, setConfig] = useState(EMPTY_CONFIG);
  const loggedRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/search-config")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    if (!query) return [];
    const expanded = expandQuery(query, config.synonymGroups);
    const scored = products
      .map((p) => {
        const keyword = config.keywords[p.id];
        const haystack = buildHaystack(p, keyword, config.priorityWeights);
        let score = 0;
        for (const entry of haystack) {
          if (expanded.some((t) => entry.text.includes(t))) score += entry.weight;
        }
        return { product: p, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.map((r) => r.product);
  }, [products, query, config]);

  // Fire once per distinct query, after results are computed — never
  // blocks rendering, never retried on re-render of the same query.
  useEffect(() => {
    if (!query || loggedRef.current === query) return;
    loggedRef.current = query;
    fetch("/api/search-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term: q, resultCount: results.length }),
    }).catch(() => {});
  }, [query, q, results.length]);

  const trackEvent = (product, type) => {
    fetch("/api/search-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term: q || "", productId: product.id, type }),
    }).catch(() => {});
  };

  return (
    <Layout
      title={query ? `Results for "${q}"` : "Search"}
      description="Search the DIS Shop catalog."
    >
      {config.popularSearches.length > 0 && (
        <div className={styles.popularWrap}>
          <span className={styles.popularLabel}>Popular Searches</span>
          <div className={styles.popularChips}>
            {config.popularSearches.map((term) => (
              <a
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className={`${styles.chip} ${term.toLowerCase() === query ? styles.chipActive : ""}`}
              >
                {term}
              </a>
            ))}
          </div>
        </div>
      )}

      <FeaturedProducts
        products={results}
        heading={query ? `Results for "${q}"` : "Search DIS Shop"}
        onProductView={(product) => trackEvent(product, "click")}
        onProductAddToCart={(product) => trackEvent(product, "cart")}
      />
    </Layout>
  );
}
