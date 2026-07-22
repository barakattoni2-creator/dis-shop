// Client-safe (no Prisma import) — shared between pages/admin/homepage-builder.tsx
// (edits the order/visibility) and pages/index.js (reads it at build/ISR time
// to decide what to render). Persisted as JSON under a single row in the
// generic Setting key-value table, key HOMEPAGE_SECTIONS_SETTING_KEY — no
// schema change needed.

export interface HomepageSectionDef {
  id: string;
  label: string;
  description: string;
}

// Hero and Newsletter are deliberately NOT in this list — they're fixed
// anchors (first/last) so the homepage can never end up with an empty top
// or bottom from a bad save. Order here is the default/fallback order.
export const HOMEPAGE_SECTIONS: HomepageSectionDef[] = [
  { id: "featureBar", label: "Feature Bar", description: "Fast Delivery / Warranty / Secure Payment / 24-7 Support strip" },
  { id: "categories", label: "Shop by Category", description: "Category grid" },
  { id: "flashDeals", label: "Flash Deals", description: "Limited-time offers on selected products" },
  { id: "todaysDeals", label: "Today's Deals", description: "Biggest discounts right now (hidden automatically if none)" },
  { id: "featuredProducts", label: "Featured Products", description: "Popular products selected for you" },
  { id: "newArrivals", label: "New Arrivals", description: "Just added to the catalog" },
  { id: "bestSellers", label: "Best Sellers", description: "Popular picks from DIS Shop" },
  { id: "specialOffers", label: "Special Offers", description: "Promo tiles" },
  { id: "promoWhatsApp", label: "Promo Banner — Order by Chat", description: "WhatsApp ordering call-to-action" },
  { id: "brands", label: "Top Brands", description: "Brand logo grid" },
  { id: "recentlyViewed", label: "Recently Viewed", description: "Personalized, browser-local history" },
  { id: "recommendedForYou", label: "Recommended For You", description: "Personalized picks" },
  { id: "promoSolar", label: "Promo Banner — Solar", description: "Power independence call-to-action" },
  { id: "whyChooseUs", label: "Why Choose DIS", description: "Trust badges" },
  { id: "deliveryInfo", label: "Delivery Info", description: "Shipping/delivery details" },
  { id: "customerReviews", label: "Customer Reviews", description: "Testimonials" },
];

export const HOMEPAGE_SECTIONS_SETTING_KEY = "homepageSections";

export interface HomepageSectionState {
  id: string;
  enabled: boolean;
}

export function defaultHomepageSectionState(): HomepageSectionState[] {
  return HOMEPAGE_SECTIONS.map((s) => ({ id: s.id, enabled: true }));
}

// Tolerates missing/invalid/partial data: unknown ids are dropped, and any
// section id that's missing from a saved (older) list is appended as
// enabled — so the homepage never silently loses a newly-added section and
// never breaks from a malformed setting value.
export function parseHomepageSectionState(raw: string | null | undefined): HomepageSectionState[] {
  const known = new Set(HOMEPAGE_SECTIONS.map((s) => s.id));
  let parsed: HomepageSectionState[] = [];
  if (raw) {
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        parsed = data.filter(
          (item): item is HomepageSectionState =>
            Boolean(item) && typeof item.id === "string" && known.has(item.id) && typeof item.enabled === "boolean"
        );
      }
    } catch {
      parsed = [];
    }
  }
  const seen = new Set(parsed.map((s) => s.id));
  const missing = HOMEPAGE_SECTIONS.filter((s) => !seen.has(s.id)).map((s) => ({ id: s.id, enabled: true }));
  return [...parsed, ...missing];
}
