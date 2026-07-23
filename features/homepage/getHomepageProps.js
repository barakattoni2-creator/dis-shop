import { fetchProducts, fetchBanners, fetchHomepageCategoryList, fetchBrands } from "@/lib/catalog";
import { fetchSettings } from "@/services/db/settings";
import { fetchTopReviews } from "@/services/db/reviews";
import { HOMEPAGE_SECTIONS_SETTING_KEY, parseHomepageSectionState } from "@/data/homepageSections";

// Shared by every page that renders the homepage (production pages/index.js
// and every pages/preview/homepage-vN.js) so they always read from the same
// live data — a preview must show real catalog/banner/review data, never a
// frozen or fabricated snapshot, and production/preview must never drift
// out of sync on what "the current data" means.
function logAndFallback(label, fallback) {
  return (err) => {
    console.error(`[getHomepageProps] ${label} failed:`, err);
    return fallback;
  };
}

export async function getHomepageProps() {
  // Neon's free tier can take a few seconds to wake from auto-suspend; a
  // transient P1001 here must not crash the homepage or fall back to a
  // stale/wrong layout. Empty arrays degrade gracefully — every section
  // below already has its own empty state — and the next revalidate retries.
  const [products, banners, categories, brands, settings, reviews] = await Promise.all([
    fetchProducts().catch(logAndFallback("fetchProducts", [])),
    fetchBanners().catch(logAndFallback("fetchBanners", [])),
    fetchHomepageCategoryList().catch(logAndFallback("fetchHomepageCategoryList", [])),
    fetchBrands().catch(logAndFallback("fetchBrands", [])),
    fetchSettings().catch(logAndFallback("fetchSettings", {})),
    fetchTopReviews().catch(logAndFallback("fetchTopReviews", [])),
  ]);
  const sectionState = parseHomepageSectionState(settings[HOMEPAGE_SECTIONS_SETTING_KEY]);
  return { products, banners, categories, brands, sectionState, reviews };
}
