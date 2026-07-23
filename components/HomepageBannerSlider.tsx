import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectFade, A11y, Keyboard } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { buildBannerOverlayGradient } from "@/lib/bannerOverlay";
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon, TruckIcon, ShieldIcon } from "@/components/icons";
import styles from "@/styles/HeroBanner.module.css";
import type { PlainBanner } from "@/types/domain";

const AUTOPLAY_MS = 5000;
const MOBILE_BREAKPOINT_PX = 600;

// Tracks the viewport against MOBILE_BREAKPOINT_PX so a slide can pick its
// mobileImageUrl instead of imageUrl — deliberately NOT done via CSS (e.g.
// rendering both images and hiding one with display:none), which would
// still make the browser fetch both over the network. Built on
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
  overlayOpacity: number;
  textAlign: "left" | "center" | "right";
  openInNewTab: boolean;
}

interface HomepageBannerSliderProps {
  banners: PlainBanner[];
}

// Renders active, admin-managed homepage banners as a full-bleed slider —
// single banner just displays (no arrows/dots/autoplay for a lone slide),
// multiple banners get the full Swiper treatment. Callers are expected to
// have already filtered to banners with a real imageUrl and to only render
// this when at least one exists; see pages/index.js for the "no active
// banners -> fall back to HeroBanner" branch this pairs with.
export default function HomepageBannerSlider({ banners }: HomepageBannerSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobileViewport();

  const realBanners = (banners || []).filter((b) => b.imageUrl);
  if (realBanners.length === 0) return null;

  const bannerSlides: BannerSlide[] = realBanners.map((b) => ({
    key: b.id,
    eyebrow: b.eyebrow || "",
    title: b.title,
    subtitle: b.subtitle || "",
    href: b.linkUrl || "/shop",
    ctaLabel: b.ctaLabel || "Shop Now",
    image: b.imageUrl!,
    mobileImage: b.mobileImageUrl || b.imageUrl!,
    overlayOpacity: b.overlayOpacity,
    textAlign: b.textAlign,
    openInNewTab: b.openInNewTab,
  }));

  const slideCount = bannerSlides.length;

  // Wires our own styled arrow/dot elements into Swiper's Navigation and
  // Pagination modules instead of using Swiper's default markup. onBeforeInit
  // fires before Swiper processes its modules for the first time, so just
  // setting the params here (no manual destroy/init/update) is enough —
  // Swiper's own init sequence, which runs immediately after this callback
  // returns, picks them up. This is the documented swiper/react pattern for
  // custom nav/pagination elements.
  const wireCustomControls = (swiper: SwiperInstance) => {
    if (swiper.params.navigation && typeof swiper.params.navigation !== "boolean") {
      swiper.params.navigation.prevEl = prevRef.current;
      swiper.params.navigation.nextEl = nextRef.current;
    }
    if (swiper.params.pagination && typeof swiper.params.pagination !== "boolean") {
      swiper.params.pagination.el = paginationRef.current;
    }
  };

  const swiperCommonProps = {
    modules: [Navigation, Pagination, Autoplay, EffectFade, A11y, Keyboard],
    loop: slideCount > 1,
    // Crossfade instead of the default slide-left/right — reads as more
    // luxury/editorial (Apple-style) than a hard slide transition.
    effect: "fade" as const,
    fadeEffect: { crossFade: true },
    speed: 800,
    autoplay:
      slideCount > 1
        ? { delay: AUTOPLAY_MS, disableOnInteraction: false, pauseOnMouseEnter: true }
        : false,
    // prevEl/nextEl/el are deliberately NOT set here — reading ref.current
    // during render is unsafe (refs aren't guaranteed populated yet). Enabling
    // the modules with just `true`/`{clickable}` and wiring the real DOM
    // elements in onBeforeInit below (a Swiper-invoked callback, not a
    // render) is the documented swiper/react pattern for custom controls.
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
            <div className={styles.bannerOverlay} style={{ background: buildBannerOverlayGradient(slide.overlayOpacity) }} />
            <div className={styles.bannerContentWrap} data-align={slide.textAlign}>
              <div className={styles.bannerContent}>
                {slide.eyebrow && <span className={styles.eyebrow}>{slide.eyebrow}</span>}
                {i === activeIndex ? (
                  <h1 className={styles.bannerTitle}>{slide.title}</h1>
                ) : (
                  <p className={styles.bannerTitle}>{slide.title}</p>
                )}
                {slide.subtitle && <p className={styles.bannerSubtitle}>{slide.subtitle}</p>}
                <div className={styles.ctaRow}>
                  <Link
                    href={slide.href}
                    className={styles.ctaPrimary}
                    target={slide.openInNewTab ? "_blank" : undefined}
                    rel={slide.openInNewTab ? "noopener noreferrer" : undefined}
                  >
                    {slide.ctaLabel}
                  </Link>
                  <Link href="/shop" className={styles.ctaSecondary}>
                    Explore Category
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
