import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, A11y, Keyboard } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import ProductImage from "@/components/ProductImage";
import { calcDiscount } from "@/utils/format";
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon, TruckIcon, ShieldIcon } from "@/components/icons";
import styles from "@/styles/HeroBanner.module.css";
import type { PlainBanner, PlainProduct } from "@/types/domain";

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
const MOBILE_BREAKPOINT_PX = 600;

// Cloudinary's AI background-removal add-on is enabled on this account
// (verified directly against the live asset) — this strips the product
// photo's plain background into real alpha transparency at render time
// only. Nothing is written back to the stored image URL or the database;
// non-Cloudinary sources (local fallback images, Odoo photos) pass through
// untouched.
function withTransparentBackground(url: string | null | undefined): string {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url || "";
  }
  return url.replace("/upload/", "/upload/e_background_removal,f_png/");
}

// "150Bar" -> "150 Bar", "6.0L/min" -> "6 L/min"; "1800W" is left as-is —
// matches how these units read naturally, applied to whatever real number
// the description contains rather than a fixed string.
function formatSpecValue(raw: string): string {
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
function deriveSpecBadges(description: string | null | undefined): string[] {
  if (!description) return [];
  const lines = description
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const clean = (line: string) => {
    const value = line.includes(":") ? line.split(":").pop()!.trim() : line;
    return value.replace(/\s*\([^)]*\)/g, "").trim();
  };
  const isCompactSpec = (v: string) => /^\d+(\.\d+)?\s?[A-Za-z][A-Za-z/]*$/.test(v);

  const badges: string[] = [];
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
function deriveSubtitle(description: string | null | undefined): string {
  const lines = (description || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length !== 1) return "Now available at DIS Shop";
  const line = lines[0];
  return line.length > 100 ? `${line.slice(0, 100)}…` : line;
}

// Tracks the viewport against MOBILE_BREAKPOINT_PX so a banner slide can
// pick its mobileImageUrl instead of imageUrl — deliberately NOT done via
// CSS (e.g. rendering both images and hiding one with display:none), which
// would still make the browser fetch both over the network. Built on
// useSyncExternalStore rather than useState+useEffect: getServerSnapshot
// always returns `false` (desktop) so SSR output and the first client paint
// match exactly — no hydration-mismatch warning — and React itself (not a
// manual effect) re-renders once the real viewport is known post-hydration.
function useIsMobileViewport(breakpoint = MOBILE_BREAKPOINT_PX): boolean {
  const subscribe = (onChange: () => void) => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
  const getSnapshot = () => window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  const getServerSnapshot = () => false;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

interface BannerSlide {
  key: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  href: string;
  ctaLabel: string;
  image: string;
  mobileImage: string;
}

interface ProductSlide {
  key: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  specBadges: string[];
  discount: string;
  href: string;
  bg: string;
  image: string;
}

interface HeroBannerProps {
  banners: PlainBanner[];
  products?: PlainProduct[];
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
export default function HeroBanner({ banners, products = [] }: HeroBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobileViewport();

  const realBanners = (banners || []).filter((b) => b.imageUrl);
  const isBannerMode = realBanners.length > 0;

  const bannerSlides: BannerSlide[] = isBannerMode
    ? realBanners.map((b) => ({
        key: b.id,
        eyebrow: b.eyebrow || "",
        title: b.title,
        subtitle: b.subtitle || "",
        href: b.linkUrl || "/shop",
        ctaLabel: b.ctaLabel || "Shop Now",
        image: b.imageUrl!,
        mobileImage: b.mobileImageUrl || b.imageUrl!,
      }))
    : [];

  const productSlides: ProductSlide[] = !isBannerMode
    ? products
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
        })
    : [];

  const slideCount = isBannerMode ? bannerSlides.length : productSlides.length;

  // Wires our own styled arrow/dot elements into Swiper's Navigation and
  // Pagination modules instead of using Swiper's default markup — keeps the
  // existing premium look (.arrow/.dots classes below) pixel-identical to
  // before this migration, just driven by Swiper instead of hand-rolled
  // autoplay/touch/transition logic.
  // onBeforeInit fires before Swiper processes its modules for the first
  // time, so just setting the params here (no manual destroy/init/update)
  // is enough — Swiper's own init sequence, which runs immediately after
  // this callback returns, picks them up. This is the documented swiper/react
  // pattern for custom nav/pagination elements.
  const wireCustomControls = (swiper: SwiperInstance) => {
    if (swiper.params.navigation && typeof swiper.params.navigation !== "boolean") {
      swiper.params.navigation.prevEl = prevRef.current;
      swiper.params.navigation.nextEl = nextRef.current;
    }
    if (swiper.params.pagination && typeof swiper.params.pagination !== "boolean") {
      swiper.params.pagination.el = paginationRef.current;
    }
  };

  if (slideCount === 0) {
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

  const swiperCommonProps = {
    modules: [Navigation, Pagination, Autoplay, A11y, Keyboard],
    loop: slideCount > 1,
    autoplay:
      slideCount > 1
        ? { delay: AUTOPLAY_MS, disableOnInteraction: false, pauseOnMouseEnter: true }
        : false,
    // prevEl/nextEl/el are deliberately NOT set here — reading ref.current
    // during render is unsafe (refs aren't guaranteed populated yet, and
    // React's rules-of-hooks lint now flags it). Enabling the modules with
    // just `true`/`{clickable}` and wiring the real DOM elements in
    // onBeforeInit below (a Swiper-invoked callback, not a render) is the
    // documented swiper/react pattern for custom nav/pagination elements.
    navigation: slideCount > 1,
    pagination: slideCount > 1 ? { clickable: true, bulletClass: styles.dot, bulletActiveClass: styles.dotActive } : false,
    keyboard: { enabled: true },
    a11y: { prevSlideMessage: "Previous slide", nextSlideMessage: "Next slide" },
    onBeforeInit: (swiper: SwiperInstance) => {
      swiperRef.current = swiper;
      wireCustomControls(swiper);
    },
    onSlideChange: (swiper: SwiperInstance) => setActiveIndex(swiper.realIndex),
  };

  if (isBannerMode) {
    return (
      <section className={styles.bannerHero}>
        <Swiper {...swiperCommonProps} className={styles.swiperRoot}>
          {bannerSlides.map((slide, i) => (
            <SwiperSlide key={slide.key} className={styles.bannerSlide}>
              <div className={styles.bannerSlideImage}>
                <Image
                  src={isMobile ? slide.mobileImage : slide.image}
                  alt={slide.title}
                  fill
                  sizes="100vw"
                  priority={i === 0}
                  className={styles.bannerImage}
                />
              </div>
              <div className={styles.bannerOverlay} />
              <div className={styles.bannerContentWrap}>
                <div className={styles.bannerContent}>
                  {slide.eyebrow && <span className={styles.eyebrow}>{slide.eyebrow}</span>}
                  {i === activeIndex ? (
                    <h1 className={styles.bannerTitle}>{slide.title}</h1>
                  ) : (
                    <p className={styles.bannerTitle}>{slide.title}</p>
                  )}
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
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {slideCount > 1 && (
          <>
            <button ref={prevRef} className={`${styles.arrow} ${styles.arrowPrev}`} aria-label="Previous slide">
              <ChevronLeftIcon />
            </button>
            <button ref={nextRef} className={`${styles.arrow} ${styles.arrowNext}`} aria-label="Next slide">
              <ChevronRightIcon />
            </button>
            <div ref={paginationRef} className={styles.dots} />
          </>
        )}
      </section>
    );
  }

  return (
    <section className={styles.hero}>
      <Swiper {...swiperCommonProps} className={styles.swiperRoot}>
        {productSlides.map((slide, i) => (
          <SwiperSlide key={slide.key} className={styles.productSlide} style={{ background: slide.bg }}>
            <div className={styles.glassOverlay} />
            <div className={styles.layout}>
              <div className={styles.content}>
                {slide.eyebrow && <span className={styles.eyebrow}>{slide.eyebrow}</span>}
                {i === activeIndex ? (
                  <h1 className={styles.title}>{slide.title}</h1>
                ) : (
                  <p className={styles.title}>{slide.title}</p>
                )}

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
                {slide.discount && <span className={styles.discountBadge}>🔥 {slide.discount}</span>}
                <div className={styles.ctaRow}>
                  <Link href={slide.href} className={styles.ctaPrimary}>
                    Shop Now
                  </Link>
                  <Link href="/shop" className={styles.ctaSecondary}>
                    View Products
                  </Link>
                </div>
              </div>

              <div className={styles.stageWrap}>
                <div className={styles.stageGlow} />
                <div className={styles.stageShadow} />
                <div className={styles.stageCard}>
                  <ProductImage
                    src={slide.image}
                    alt={slide.title}
                    background={undefined}
                    className={styles.stageImage}
                    sizes="(max-width: 900px) 90vw, 45vw"
                    priority={i === 0}
                  />
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {slideCount > 1 && (
        <>
          <button ref={prevRef} className={`${styles.arrow} ${styles.arrowPrev}`} aria-label="Previous slide">
            <ChevronLeftIcon />
          </button>
          <button ref={nextRef} className={`${styles.arrow} ${styles.arrowNext}`} aria-label="Next slide">
            <ChevronRightIcon />
          </button>
          <div ref={paginationRef} className={styles.dots} />
        </>
      )}
    </section>
  );
}
