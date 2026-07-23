import { Fragment } from "react";
import Layout from "@/components/Layout";
import HeroBanner from "@/components/HeroBanner";
import HomepageBannerSlider from "@/components/HomepageBannerSlider";
import FeatureBar from "@/components/FeatureBar";
import Categories from "@/components/Categories";
import FeaturedProducts from "@/components/FeaturedProducts";
import SpecialOffers from "@/components/SpecialOffers";
import FlashDeals from "@/components/FlashDeals";
import Brands from "@/components/Brands";
import PromoBanner from "@/components/PromoBanner";
import RecommendedForYou from "@/components/RecommendedForYou";
import RecentlyViewed from "@/components/RecentlyViewed";
import WhyChooseUs from "@/components/WhyChooseUs";
import CustomerReviews from "@/components/CustomerReviews";
import DeliveryInfo from "@/components/DeliveryInfo";
import Newsletter from "@/components/Newsletter";
import Reveal from "@/components/Reveal";
import { calcDiscount } from "@/utils/format";
import styles from "@/styles/Home.module.css";

// A "valid deal" requires real price data proving an actual discount, and
// stock to be purchasable. There's no deal-scheduling system in this
// database (no active flag, no start/end dates), so — consistent with this
// project's no-fabricated-data rule — that part of the spec isn't
// implemented with invented fields; only what's real (originalPrice vs.
// price, stock) gates a deal here.
function isValidDeal(p) {
  if (typeof p.stock === "number" && p.stock <= 0) return false;
  return Boolean(p.originalPrice) && p.originalPrice > p.price;
}

// Homepage sections are capped so a large catalog can't turn any one
// section into a very tall grid — matches the "limit each section to a
// reasonable number" requirement.
const SECTION_LIMIT = 10;

// The single source of truth for what the homepage actually renders —
// pages/index.js (production) and every pages/preview/homepage-vN.js render
// this same component with the same live data. They only ever diverge once
// a preview round makes a real, approved-pending UI change; until then,
// "duplicating" the homepage would just mean two copies of identical code.
// `previewLabel`, when set, renders a small fixed ribbon so a preview build
// is never visually mistaken for production (also flips the page to
// noindex — see Layout.js).
export default function HomepageView({
  products,
  banners,
  categories,
  brands,
  sectionState,
  reviews,
  previewLabel,
}) {
  const bestSellers = products.filter((p) => p.badge === "Best Seller").slice(0, SECTION_LIMIT);
  const flashDeals = products
    .filter((p) => p.badge === "Deal" && isValidDeal(p))
    .slice(0, SECTION_LIMIT);
  const newArrivals = products.filter((p) => p.isNew).slice(0, SECTION_LIMIT);
  // Falls back to the full catalog when nothing has been marked featured yet
  // (e.g. no database configured, or an admin hasn't flagged anything) so
  // the section is never empty. Kept unsliced for heroProducts below (hero
  // selection logic/behavior is unchanged), sliced separately for display.
  const featuredFull = products.some((p) => p.featured)
    ? products.filter((p) => p.featured)
    : products;
  const featured = featuredFull.slice(0, 12);
  const todaysDeals = [...products]
    .filter(isValidDeal)
    .sort((a, b) => calcDiscount(b.price, b.originalPrice) - calcDiscount(a.price, a.originalPrice))
    .slice(0, SECTION_LIMIT);
  // Hero only ever shows real photography: admin-uploaded banners take
  // priority, otherwise featured products that actually have a photo —
  // never the emoji/icon placeholder that used to render here.
  const hasPhoto = (p) => Boolean(p.imageUrl || p.images?.[0]);
  const heroProducts = (featuredFull.some(hasPhoto) ? featuredFull : products)
    .filter(hasPhoto)
    .slice(0, 6);
  const activeBanners = banners.filter((b) => b.imageUrl);

  // Every homepage section below Hero and above Newsletter is admin-
  // configurable (order + on/off) via the Homepage Builder — see
  // data/homepageSections.ts. `alt` mirrors the section's original,
  // fixed background-band assignment so the default layout renders
  // pixel-identical to before; it travels with the section if reordered,
  // rather than being recomputed from final position.
  const sectionRegistry = {
    featureBar: { alt: false, node: <FeatureBar /> },
    categories: {
      alt: false,
      node: (
        <Reveal>
          <Categories products={products} categories={categories} />
        </Reveal>
      ),
    },
    flashDeals: {
      alt: false,
      node: (
        <Reveal id="flash-deals">
          <FlashDeals
            products={flashDeals}
            subtitle="Limited-time offers on selected products."
            viewAllHref="/shop"
          />
        </Reveal>
      ),
    },
    todaysDeals: {
      alt: true,
      visible: todaysDeals.length > 0,
      node: (
        <Reveal id="todays-deals">
          <FeaturedProducts
            products={todaysDeals}
            heading="Today's Deals"
            subtitle="Biggest discounts right now"
            viewAllHref="/shop"
            layout="slider"
          />
        </Reveal>
      ),
    },
    featuredProducts: {
      alt: false,
      node: (
        <Reveal>
          <FeaturedProducts
            products={featured}
            heading="Featured Products"
            subtitle="Popular products selected for you."
            viewAllHref="/shop"
          />
        </Reveal>
      ),
    },
    newArrivals: {
      alt: true,
      node: (
        <Reveal id="new-arrivals">
          <FeaturedProducts
            products={newArrivals}
            heading="New Arrivals"
            subtitle="Just added to our catalog"
            viewAllHref="/shop"
            layout="slider"
          />
        </Reveal>
      ),
    },
    bestSellers: {
      alt: false,
      node: (
        <Reveal>
          <FeaturedProducts
            products={bestSellers}
            heading="Best Sellers"
            subtitle="Popular picks from DIS Shop"
            viewAllHref="/shop"
            layout="slider"
          />
        </Reveal>
      ),
    },
    specialOffers: {
      alt: true,
      node: (
        <Reveal id="special-offers">
          <SpecialOffers />
        </Reveal>
      ),
    },
    promoWhatsApp: {
      alt: false,
      node: (
        <Reveal>
          <PromoBanner
            eyebrow="Order Your Way"
            title="Prefer to Order by Chat?"
            subtitle="Message us on WhatsApp and our team will help you order, track delivery and answer questions in minutes."
            cta="Chat on WhatsApp"
            href="/contact"
            bg="linear-gradient(120deg, #0a4dff, #081a3a)"
            icon="💬"
          />
        </Reveal>
      ),
    },
    brands: {
      alt: true,
      node: (
        <Reveal id="top-brands">
          <Brands brands={brands} />
        </Reveal>
      ),
    },
    recentlyViewed: {
      alt: false,
      node: (
        <Reveal>
          <RecentlyViewed products={products} />
        </Reveal>
      ),
    },
    recommendedForYou: {
      alt: true,
      node: (
        <Reveal>
          <RecommendedForYou products={products} />
        </Reveal>
      ),
    },
    promoSolar: {
      alt: false,
      node: (
        <Reveal>
          <PromoBanner
            eyebrow="Power Independence"
            title="Never Lose Power Again"
            subtitle="Felicity & Deye solar panels, inverters and batteries — keep your home running even when the grid isn't."
            cta="Shop Solar"
            href="/category/solar"
            bg="linear-gradient(120deg, #ff6a00, #cc5500)"
            icon="☀️"
          />
        </Reveal>
      ),
    },
    whyChooseUs: {
      alt: true,
      node: (
        <Reveal>
          <WhyChooseUs heading="Why Choose DIS" />
        </Reveal>
      ),
    },
    deliveryInfo: {
      alt: false,
      node: (
        <Reveal>
          <DeliveryInfo />
        </Reveal>
      ),
    },
    customerReviews: {
      alt: true,
      node: (
        <Reveal>
          <CustomerReviews reviews={reviews} />
        </Reveal>
      ),
    },
  };

  return (
    <Layout
      title="Everything you need, delivered fast"
      description="DIS Shop: your one-stop shop in Juba, South Sudan for air conditioners, solar equipment, tools, household appliances, electrical supplies and lighting."
      noindex={Boolean(previewLabel)}
    >
      {previewLabel && (
        <div className={styles.previewBanner}>
          🔍 Preview build — {previewLabel} — not visible to customers
        </div>
      )}

      {activeBanners.length > 0 ? (
        <HomepageBannerSlider banners={activeBanners} />
      ) : (
        <HeroBanner products={heroProducts} />
      )}

      {sectionState
        .filter((s) => s.enabled)
        .map((s) => ({ id: s.id, entry: sectionRegistry[s.id] }))
        .filter(({ entry }) => entry && entry.visible !== false)
        .map(({ id, entry }) =>
          entry.alt ? (
            <div key={id} className={styles.sectionAlt}>
              {entry.node}
            </div>
          ) : (
            <Fragment key={id}>{entry.node}</Fragment>
          )
        )}

      <Newsletter />
    </Layout>
  );
}
