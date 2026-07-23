import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import styles from "@/styles/FlashDeals.module.css";

// A countdown only renders when a deal actually carries a real expiry —
// there's no expiry field on Product today, so every deal is expiry-less
// and the timer simply never shows rather than displaying a fake "ends at
// midnight" clock that isn't backed by real data.
export default function FlashDeals({ products, subtitle, viewAllHref }) {
  const trackRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const scrollByAmount = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: track.clientWidth * 0.8 * dir, behavior: "smooth" });
  };

  // Arrows only make sense once the track's content is actually wider than
  // its visible box — with few enough deals to already fit, there's
  // nowhere left to scroll to.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const check = () => setHasOverflow(el.scrollWidth > el.clientWidth + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    window.addEventListener("resize", check);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [products]);

  // No valid deals — hide the whole section rather than an empty colored
  // box with a "check back soon" message.
  if (products.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.headingRow}>
        <div>
          <h2 className={styles.heading}>Top Deals</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.headingRight}>
          {products.find((p) => p.dealExpiresAt) && (
            <span className={styles.timer}>Limited time</span>
          )}
          {viewAllHref && (
            <Link href={viewAllHref} className={styles.viewAll}>
              View All Deals
              <ChevronRightIcon width="14" height="14" />
            </Link>
          )}
          {hasOverflow && (
            <div className={styles.arrows}>
              <button
                type="button"
                className={styles.arrowBtn}
                onClick={() => scrollByAmount(-1)}
                aria-label="Scroll left"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                className={styles.arrowBtn}
                onClick={() => scrollByAmount(1)}
                aria-label="Scroll right"
              >
                <ChevronRightIcon />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.track} ref={trackRef}>
        {products.map((product) => (
          <div key={product.id} className={styles.slide}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
