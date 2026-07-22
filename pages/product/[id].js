import { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import StarRating from "@/components/StarRating";
import RelatedProductsCarousel from "@/components/RelatedProductsCarousel";
import RecentlyViewed from "@/components/RecentlyViewed";
import ProductGallery from "@/components/ProductGallery";
import ProductTabs from "@/features/product/ProductTabs";
import FrequentlyBoughtTogether from "@/features/product/FrequentlyBoughtTogether";
import {
  HeartIcon,
  CompareIcon,
  ShareIcon,
  MinusIcon,
  PlusIcon,
  CheckIcon,
  TruckIcon,
  ShieldIcon,
  LockIcon,
  SupportIcon,
} from "@/components/icons";
import { useCompanyInfo, useExchangeRate } from "@/components/CompanyInfoProvider";
import { useStore } from "@/context/StoreContext";
import { fetchProducts, fetchProductById, fetchCategoryDetail } from "@/lib/catalog";
import { fetchReviewsForProduct } from "@/services/db/reviews";
import { calcDiscount, formatCurrency } from "@/utils/format";
import { buildProductOrderLink } from "@/utils/whatsapp";
import { recordRecentlyViewed } from "@/lib/recentlyViewed";
import { SITE_URL } from "@/data/site";
import { DELIVERY_ZONES } from "@/data/delivery";
import Price from "@/components/Price";
import styles from "@/styles/ProductDetail.module.css";

// "Munuki, Juba Town and Custom Zone" — a short prose list reads more
// compact than wrapping pill chips for a delivery-info card.
function formatZoneList(zones) {
  const names = zones.map((z) => z.split("(")[0].trim());
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export async function getStaticPaths() {
  // Every product is generated on-demand and cached (ISR) rather than
  // enumerated at build time — same pattern as pages/category/[slug].js
  // and pages/brand/[name].js. No Prisma call happens during `next build`,
  // so a DB hiccup (or a build environment that can't reach it) can no
  // longer fail the whole build, only the first request to a given product.
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const product = await fetchProductById(params.id).catch(() => null);
  if (!product) return { notFound: true };
  const [items, reviews, category] = await Promise.all([
    fetchProducts().catch(() => []),
    fetchReviewsForProduct(product.id).catch(() => []),
    fetchCategoryDetail(product.category).catch(() => null),
  ]);
  const related = items.filter(
    (p) => p.category === product.category && p.id !== product.id
  );
  return {
    props: {
      product,
      related,
      allProducts: items,
      reviews,
      categoryName: category?.name || product.category,
      categoryIcon: category?.icon || "📦",
    },
    revalidate: 60,
  };
}

export default function ProductDetailPage({
  product,
  related,
  allProducts,
  reviews: initialReviews,
  categoryName,
  categoryIcon,
}) {
  const { addToCart, toggleWishlist, isWishlisted, toggleCompare, isCompared } = useStore();
  const { whatsappNumber } = useCompanyInfo();
  const { rate } = useExchangeRate();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState(initialReviews);
  const [shareStatus, setShareStatus] = useState("");
  // Next.js keeps this component mounted across client-side navigations
  // between products, so qty/reviews must reset via the render-time
  // "adjust state when a prop changes" pattern rather than an effect.
  const [trackedId, setTrackedId] = useState(product.id);
  if (product.id !== trackedId) {
    setTrackedId(product.id);
    setQty(1);
    setReviews(initialReviews);
  }

  const wishlisted = isWishlisted(product.id);
  const compared = isCompared(product.id);
  const discount = calcDiscount(product.price, product.originalPrice);
  const saveAmount = discount > 0 ? product.originalPrice - product.price : 0;
  const galleryImages = product.images?.length
    ? product.images
    : product.imageUrl
    ? [product.imageUrl]
    : [`/images/products/${product.id}.jpg`];
  // Static/Odoo fallback catalogs don't carry a stock count — treat "unknown"
  // as available rather than incorrectly showing the whole demo catalog as
  // out of stock when no database is configured.
  const stockKnown = typeof product.stock === "number";
  const inStock = !stockKnown || product.stock > 0;
  const lowStock = stockKnown && product.stock > 0 && product.stock <= 5;
  const maxQty = stockKnown ? Math.max(1, product.stock) : 99;
  // Only shown when the admin has actually entered a warranty spec — no
  // invented duration for products that don't have one on file.
  const warranty = product.specs?.Warranty || product.specs?.warranty;

  useEffect(() => {
    recordRecentlyViewed(product.id);
  }, [product.id]);

  const handleAddToCart = () => addToCart(product, qty);
  const handleBuyNow = () => {
    addToCart(product, qty);
    router.push("/checkout");
  };

  const handleShare = async () => {
    const url = `${SITE_URL}/product/${product.id}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch {
        // user cancelled — nothing to do
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setShareStatus("Link copied!");
      setTimeout(() => setShareStatus(""), 2000);
    }
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    image: product.imageUrl || undefined,
    sku: product.sku || undefined,
    aggregateRating:
      product.reviews > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviews,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: product.price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/product/${product.id}`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryName,
        item: `${SITE_URL}/category/${product.category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${SITE_URL}/product/${product.id}`,
      },
    ],
  };

  return (
    <Layout
      title={product.name}
      description={product.description}
      image={product.imageUrl}
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </Head>
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span> / </span>
        <Link href={`/category/${product.category}`}>{categoryName}</Link>
        <span> / </span>
        <span>{product.name}</span>
      </div>

      <div className={styles.layout}>
        <div className={styles.imageCol}>
          <ProductGallery
            images={galleryImages}
            icon={categoryIcon}
            background={product.color}
            alt={product.name}
            badge={product.badge}
            videoUrl={product.videoUrl}
          />
        </div>

        <div className={styles.info}>
          {product.brand && (
            <div className={styles.brandRow}>
              {product.brandLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.brandLogo} alt={product.brand} className={styles.brandLogo} />
              )}
              <Link href={`/brand/${encodeURIComponent(product.brand)}`} className={styles.brand}>
                {product.brand}
              </Link>
            </div>
          )}
          <h1 className={styles.name}>{product.name}</h1>
          <div className={styles.ratingRow}>
            <StarRating rating={product.rating} />
            <span className={styles.reviews}>
              {product.rating.toFixed(1)} ({product.reviews} reviews)
            </span>
            <Link href={`/category/${product.category}`} className={styles.categoryTag}>
              {categoryName}
            </Link>
          </div>

          <div className={styles.stockRow}>
            {inStock ? (
              <span className={`${styles.stockBadge} ${lowStock ? styles.lowStock : styles.inStock}`}>
                {stockKnown
                  ? lowStock
                    ? `Only ${product.stock} left in stock`
                    : `In Stock — ${product.stock} available`
                  : "In Stock"}
              </span>
            ) : (
              <span className={`${styles.stockBadge} ${styles.outOfStock}`}>Out of Stock</span>
            )}
            {product.sku && <span className={styles.sku}>SKU: {product.sku}</span>}
            {warranty && <span className={styles.sku}>Warranty: {warranty}</span>}
          </div>

          <div className={styles.priceRow}>
            <Price amount={product.price} className={styles.price} />
          </div>
          <div className={styles.priceMeta}>
            <span>≈ {formatCurrency(product.price, "SSP", rate)}</span>
            <span className={styles.rateNote}>1 USD = {rate.toLocaleString("en-US")} SSP</span>
          </div>
          {discount > 0 && (
            <div className={styles.oldPriceRow}>
              <Price amount={product.originalPrice} className={styles.originalPrice} />
              <span className={styles.discount}>-{discount}%</span>
              <span className={styles.saveLine}>
                Save <Price amount={saveAmount} className={styles.saveAmount} /> (
                {formatCurrency(saveAmount, "SSP", rate)})
              </span>
            </div>
          )}

          <div className={styles.buyBox}>
            <div className={styles.qtyRow}>
              <span className={styles.qtyLabel}>Quantity</span>
              <div className={styles.qtyStepper}>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label="Decrease quantity"
                >
                  <MinusIcon />
                </button>
                <span>{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                  aria-label="Increase quantity"
                >
                  <PlusIcon />
                </button>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.addBtn}
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                {inStock ? "Add to Cart" : "Out of Stock"}
              </button>
              <button className={styles.buyNowBtn} onClick={handleBuyNow} disabled={!inStock}>
                Buy Now
              </button>
              <a
                className={styles.whatsappBtn}
                href={buildProductOrderLink(product, whatsappNumber, qty)}
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 Order via WhatsApp
              </a>
            </div>

            <div className={styles.secondaryActions}>
              <button
                type="button"
                className={`${styles.secondaryBtn} ${wishlisted ? styles.secondaryBtnActive : ""}`}
                onClick={() => toggleWishlist(product)}
              >
                <HeartIcon filled={wishlisted} /> {wishlisted ? "In Wishlist" : "Wishlist"}
              </button>
              <button
                type="button"
                className={`${styles.secondaryBtn} ${compared ? styles.secondaryBtnActive : ""}`}
                onClick={() => toggleCompare(product)}
              >
                <CompareIcon /> {compared ? "In Compare" : "Compare"}
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={handleShare}>
                <ShareIcon /> {shareStatus || "Share"}
              </button>
            </div>
          </div>

          <div className={styles.trustRow}>
            <span>
              <CheckIcon /> Genuine Product
            </span>
            <span>
              <TruckIcon /> Fast Delivery
            </span>
            <span>
              <LockIcon /> Secure Shopping
            </span>
            <span>
              <ShieldIcon /> Warranty
            </span>
            <span>
              <SupportIcon /> Customer Support
            </span>
          </div>

          <div className={styles.deliveryBlock}>
            <div className={styles.deliveryItem}>
              <span className={styles.deliveryLabel}>Estimated delivery</span>
              <span className={styles.deliveryValue}>Same-day dispatch</span>
            </div>
            <div className={styles.deliveryItem}>
              <span className={styles.deliveryLabel}>Delivery fee</span>
              <span className={styles.deliveryValue}>Confirmed by WhatsApp</span>
            </div>
            <div className={styles.deliveryItem}>
              <span className={styles.deliveryLabel}>Delivery zones</span>
              <span className={styles.deliveryValue}>{formatZoneList(DELIVERY_ZONES)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mobileActionBar}>
        <button
          className={`${styles.mobileWishlistBtn} ${wishlisted ? styles.wishlisted : ""}`}
          onClick={() => toggleWishlist(product)}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <HeartIcon filled={wishlisted} />
        </button>
        <button
          className={styles.mobileAddBtn}
          onClick={handleAddToCart}
          disabled={!inStock}
        >
          {inStock ? "Add to Cart" : "Out of Stock"}
        </button>
        <a
          className={styles.mobileWhatsappBtn}
          href={buildProductOrderLink(product, whatsappNumber, qty)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Order via WhatsApp"
        >
          💬
        </a>
      </div>

      <div className={styles.contentWidth}>
        <ProductTabs
          key={product.id}
          product={product}
          reviews={reviews}
          onReviewSubmitted={(review) => setReviews((prev) => [review, ...prev])}
        />

        <FrequentlyBoughtTogether mainProduct={product} extras={related.slice(0, 2)} />
      </div>

      <RelatedProductsCarousel products={related} heading="Related Products" />

      <RecentlyViewed products={allProducts.filter((p) => p.id !== product.id)} />
    </Layout>
  );
}
