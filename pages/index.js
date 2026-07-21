import Layout from "@/components/Layout";
import HeroBanner from "@/components/HeroBanner";
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
import { fetchProducts, fetchBanners, fetchHomepageCategoryList, fetchBrands } from "@/lib/catalog";
import { calcDiscount } from "@/utils/format";
import styles from "@/styles/Home.module.css";

export async function getStaticProps() {
  // Neon's free tier can take a few seconds to wake from auto-suspend; a
  // transient P1001 here must not crash the homepage or fall back to a
  // stale/wrong layout. Empty arrays degrade gracefully — every section
  // below already has its own empty state — and the next revalidate retries.
  const [products, banners, categories, brands] = await Promise.all([
    fetchProducts().catch(() => []),
    fetchBanners().catch(() => []),
    fetchHomepageCategoryList().catch(() => []),
    fetchBrands().catch(() => []),
  ]);
  return { props: { products, banners, categories, brands }, revalidate: 60 };
}

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

export default function Home({ products, banners, categories, brands }) {
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

  return (
    <Layout
      title="Everything you need, delivered fast"
      description="DIS Shop: your one-stop shop in Juba, South Sudan for air conditioners, solar equipment, tools, household appliances, electrical supplies and lighting."
    >
      <HeroBanner banners={banners} products={heroProducts} />

      <Reveal>
        <Categories products={products} categories={categories} />
      </Reveal>

      <Reveal id="flash-deals">
        <FlashDeals
          products={flashDeals}
          subtitle="Limited-time offers on selected products."
          viewAllHref="/shop"
        />
      </Reveal>

      {todaysDeals.length > 0 && (
        <div className={styles.sectionAlt}>
          <Reveal id="todays-deals">
            <FeaturedProducts
              products={todaysDeals}
              heading="Today's Deals"
              subtitle="Biggest discounts right now"
              viewAllHref="/shop"
              layout="slider"
            />
          </Reveal>
        </div>
      )}

      <Reveal>
        <FeaturedProducts
          products={featured}
          heading="Featured Products"
          subtitle="Popular products selected for you."
          viewAllHref="/shop"
        />
      </Reveal>

      <div className={styles.sectionAlt}>
        <Reveal id="new-arrivals">
          <FeaturedProducts
            products={newArrivals}
            heading="New Arrivals"
            subtitle="Just added to our catalog"
            viewAllHref="/shop"
            layout="slider"
          />
        </Reveal>
      </div>

      <Reveal>
        <FeaturedProducts
          products={bestSellers}
          heading="Best Sellers"
          subtitle="Popular picks from DIS Shop"
          viewAllHref="/shop"
          layout="slider"
        />
      </Reveal>

      <div className={styles.sectionAlt}>
        <Reveal id="special-offers">
          <SpecialOffers />
        </Reveal>
      </div>

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

      <div className={styles.sectionAlt}>
        <Reveal id="top-brands">
          <Brands brands={brands} />
        </Reveal>
      </div>

      <Reveal>
        <RecentlyViewed products={products} />
      </Reveal>

      <div className={styles.sectionAlt}>
        <Reveal>
          <RecommendedForYou products={products} />
        </Reveal>
      </div>

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

      <div className={styles.sectionAlt}>
        <Reveal>
          <WhyChooseUs heading="Why Choose DIS" />
        </Reveal>
      </div>

      <Reveal>
        <DeliveryInfo />
      </Reveal>

      <div className={styles.sectionAlt}>
        <Reveal>
          <CustomerReviews />
        </Reveal>
      </div>

      <Newsletter />
    </Layout>
  );
}
