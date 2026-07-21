import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ProductImage from "@/components/ProductImage";
import { calcDiscount } from "@/utils/format";
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon, TruckIcon, ShieldIcon } from "@/components/icons";
import styles from "@/styles/HeroBanner.module.css";

// Two-stop navy → blue diagonal with a single soft accent glow — fewer
// gradient stops than before reads as smoother/more premium, and DIS Shop's
// blue identity stays dominant.
const FALLBACK_BG =
  "radial-gradient(ellipse 70% 60% at 85% 10%, rgba(255, 106, 0, 0.12) 0%, transparent 60%), linear-gradient(135deg, #050f24 0%, #0a4dff 100%)";
const SLIDE_BACKGROUNDS = [
  FALLBACK_BG,
  "radial-gradient(ellipse 70% 60% at 15% 10%, rgba(255, 255, 255, 0.12) 0%, transparent 55%), linear-gradient(135deg, #cc5500 0%, #081a3a 100%)",
  "radial-gradient(ellipse 70% 60% at 85% 15%, rgba(10, 77, 255, 0.2) 0%, transparent 55%), linear-gradient(135deg, #081a3a 0%, #0a4dff 100%)",
];

const AUTOPLAY_MS = 5000;
const MAX_SPEC_BADGES = 3;
const SWIPE_THRESHOLD_PX = 50;

// Cloudinary's AI background-removal add-on is enabled on this account
// (verified directly against the live asset) — this strips the product
// photo's plain background into real alpha transparency at render time
// only. Nothing is written back to the stored image URL or the database;
// non-Cloudinary sources (local fallback images, Odoo photos) pass through
// untouched.
function withTransparentBackground(url) {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  return url.replace("/upload/", "/upload/e_background_removal,f_png/");
}

// "150Bar" -> "150 Bar", "6.0L/min" -> "6 L/min"; "1800W" is left as-is —
// matches how these units read naturally, applied to whatever real number
// the description contains rather than a fixed string.
function formatSpecValue(raw) {
  if (/^\d+W$/i.test(raw)) return raw.toUpperCase();
  const bar = raw.match(/^(\d+(\.\d+)?)\s*Bar$/i);
  if (bar) return `${Number(bar[1])} Bar`;
  const flow = raw.match(/^(\d+(\.\d+)?)\s*L\/min$/i);
  if (flow) return `${Number(flow[1])} L/min`;
  return raw;
}

// Pulls up to three short, real numeric spec highlights ("1800W", "150
// Bar", "6 L/min") out of a product's own multi-line description instead
// of inventing copy. A single-paragraph description isn't a spec sheet, so
// it yields no badges rather than a guessed one.
function deriveSpecBadges(description) {
  if (!description) return [];
  const lines = description
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const clean = (line) => {
    const value = line.includes(":") ? line.split(":").pop().trim() : line;
    return value.replace(/\s*\([^)]*\)/g, "").trim();
  };
  const isCompactSpec = (v) => /^\d+(\.\d+)?\s?[A-Za-z][A-Za-z/]*$/.test(v);

  const badges = [];
  for (const line of lines) {
    const value = clean(line);
    if (value && value.length <= 20 && isCompactSpec(value)) {
      badges.push(formatSpecValue(value));
      if (badges.length === MAX_SPEC_BADGES) break;
    }
  }
  return badges;
}

// Multi-line spec-sheet descriptions read as clutter in a hero subtitle —
// their content already surfaces as badges above — so only single-paragraph
// prose descriptions are used, shortened for scannability.
function deriveSubtitle(description) {
  const lines = (description || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length !== 1) return "Now available at DIS Shop";
  const line = lines[0];
  return line.length > 100 ? `${line.slice(0, 100)}…` : line;
}

// The hero only ever shows real photography — admin-uploaded banners first,
// then featured products that actually have a photo. If neither exists yet
// (e.g. a brand-new store with no images uploaded), it shows a plain
// branded welcome panel instead of an empty image box or an icon
// placeholder standing in for a missing photo.
//
// An admin-uploaded banner is a full lifestyle/collage photo meant to run
// full-bleed behind the text (see .bannerHero below); a product photo is a
// small isolated cutout meant to float in its own glow (see .stageCard).
// These need genuinely different markup, so banner mode branches out to its
// own return before the product-fallback layout further down.
export default function HeroBanner({ banners, products = [] }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);

  const realBanners = (banners || []).filter((b) => b.imageUrl);
  const isBannerMode = realBanners.length > 0;

  const slides = isBannerMode
    ? realBanners.map((b) => ({
        key: b.id,
        eyebrow: b.eyebrow || "",
        title: b.title,
        subtitle: b.subtitle || "",
        href: b.linkUrl || "/shop",
        ctaLabel: b.ctaLabel || "Shop Now",
        image: b.imageUrl,
      }))
    : products
          .filter((p) => p.imageUrl || p.images?.[0])
          .map((p, i) => {
            const discount = calcDiscount(p.price, p.originalPrice);
            return {
              key: p.id,
              eyebrow: p.brand || "Featured",
              title: p.name,
              subtitle: deriveSubtitle(p.description),
              specBadges: deriveSpecBadges(p.description),
              discount: discount > 0 ? `${discount}% OFF` : "",
              href: `/product/${p.id}`,
              bg: SLIDE_BACKGROUNDS[i % SLIDE_BACKGROUNDS.length],
              image: withTransparentBackground(p.imageUrl || p.images?.[0]),
            };
          });

  // Depending on `index` (not just slides.length) means every advance —
  // whether from this timer or from a manual arrow/dot/swipe click — clears
  // and restarts a fresh AUTOPLAY_MS window, so manual navigation resets the
  // countdown instead of the next auto-advance landing early.
  useEffect(() => {
    if (slides.length < 2 || isPaused) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [slides.length, isPaused, index]);

  // Client-only (no window/Image access during render, so no hydration
  // mismatch) — warms the browser cache for every slide image so autoplay
  // and manual navigation swap instantly instead of showing a blank/loading
  // frame, and surfaces broken banner URLs in the console instead of
  // silently rendering an empty background.
  useEffect(() => {
    const urls = (banners || [])
      .map((b) => b.imageUrl)
      .concat((products || []).map((p) => p.imageUrl || p.images?.[0]))
      .filter(Boolean);
    urls.forEach((url) => {
      const img = new window.Image();
      img.onerror = () => {
        if (process.env.NODE_ENV !== "production") {
          console.error(`[HeroBanner] Failed to load slide image: ${url}`);
        }
      };
      img.src = url;
    });
  }, [banners, products]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    setIndex((i) => (deltaX > 0 ? (i - 1 + slides.length) % slides.length : (i + 1) % slides.length));
  };

  if (slides.length === 0) {
    return (
      <section className={styles.hero} style={{ background: FALLBACK_BG }}>
        <div className={styles.glassOverlay} />
        <div className={styles.layoutSingle}>
          <div className={styles.content}>
            <span className={styles.eyebrow}>Welcome to DIS Shop</span>
            <h1 className={styles.title}>Everything You Need, Delivered Fast</h1>
            <p className={styles.subtitle}>
              Air conditioners, solar equipment, tools and household essentials —
              shipped across Juba, South Sudan.
            </p>
            <div className={styles.ctaRow}>
              <Link href="/shop" className={styles.ctaPrimary}>
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const slide = slides[Math.min(index, slides.length - 1)];
  const goTo = (i) => setIndex((i + slides.length) % slides.length);

  if (isBannerMode) {
    return (
      <section
        className={styles.bannerHero}
        style={{ backgroundImage: `url(${slide.image})` }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Horizontal anchor stays "right" as requested — the uploaded
            banner's products sit center-right of frame, so this keeps them
            in view at any viewport width. The vertical anchor is nudged
            above dead-center (rather than a literal 50%) because at typical
            wide desktop ratios, a true center crop clips into the tops of
            the tallest products (measured directly against this image) —
            38% keeps the full product cluster in frame instead. */}
        <div className={styles.bannerOverlay} />

        {slides.length > 1 && (
          <button
            className={`${styles.arrow} ${styles.arrowPrev}`}
            aria-label="Previous slide"
            onClick={() => goTo(index - 1)}
          >
            <ChevronLeftIcon />
          </button>
        )}

        <div className={styles.bannerContentWrap}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`banner-content-${slide.key}`}
              className={styles.bannerContent}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {slide.eyebrow && <span className={styles.eyebrow}>{slide.eyebrow}</span>}
              <h1 className={styles.bannerTitle}>{slide.title}</h1>
              {slide.subtitle && <p className={styles.bannerSubtitle}>{slide.subtitle}</p>}
              <div className={styles.ctaRow}>
                <Link href={slide.href} className={styles.ctaPrimary}>
                  {slide.ctaLabel}
                </Link>
                <Link href="/shop" className={styles.ctaSecondary}>
                  View Products
                </Link>
              </div>
              <div className={styles.trustRow}>
                <span>
                  <CheckIcon width="14" height="14" /> Genuine Products
                </span>
                <span>
                  <TruckIcon width="14" height="14" /> Delivery in Juba
                </span>
                <span>
                  <ShieldIcon width="14" height="14" /> Trusted Quality
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {slides.length > 1 && (
          <button
            className={`${styles.arrow} ${styles.arrowNext}`}
            aria-label="Next slide"
            onClick={() => goTo(index + 1)}
          >
            <ChevronRightIcon />
          </button>
        )}

        {slides.length > 1 && (
          <div className={styles.dots}>
            {slides.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      className={styles.hero}
      style={{ background: slide.bg }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.glassOverlay} />

      {slides.length > 1 && (
        <button
          className={`${styles.arrow} ${styles.arrowPrev}`}
          aria-label="Previous slide"
          onClick={() => goTo(index - 1)}
        >
          <ChevronLeftIcon />
        </button>
      )}

      <div className={styles.layout}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${slide.key}`}
            className={styles.content}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {slide.eyebrow && <span className={styles.eyebrow}>{slide.eyebrow}</span>}
            <h1 className={styles.title}>{slide.title}</h1>

            {slide.specBadges.length > 0 && (
              <div className={styles.specBadges}>
                {slide.specBadges.map((badge) => (
                  <span key={badge} className={styles.specBadge}>
                    {badge}
                  </span>
                ))}
              </div>
            )}

            <p className={styles.subtitle}>{slide.subtitle}</p>
            {slide.discount && (
              <span className={styles.discountBadge}>🔥 {slide.discount}</span>
            )}
            <div className={styles.ctaRow}>
              <Link href={slide.href} className={styles.ctaPrimary}>
                Shop Now
              </Link>
              <Link href="/shop" className={styles.ctaSecondary}>
                View Products
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className={styles.stageWrap}>
          <div className={styles.stageGlow} />
          <div className={styles.stageShadow} />
          <AnimatePresence mode="wait">
            <motion.div
              key={`stage-${slide.key}`}
              className={styles.stageCard}
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <ProductImage
                src={slide.image}
                alt={slide.title}
                className={styles.stageImage}
                sizes="(max-width: 900px) 90vw, 45vw"
                priority={index === 0}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {slides.length > 1 && (
        <button
          className={`${styles.arrow} ${styles.arrowNext}`}
          aria-label="Next slide"
          onClick={() => goTo(index + 1)}
        >
          <ChevronRightIcon />
        </button>
      )}

      {slides.length > 1 && (
        <div className={styles.dots}>
          {slides.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
