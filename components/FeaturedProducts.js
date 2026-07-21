import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import styles from "@/styles/FeaturedProducts.module.css";

export default function FeaturedProducts({
  products,
  heading = "Featured Products",
  subtitle,
  viewAllHref,
  layout = "grid",
  onProductView,
  onProductAddToCart,
}) {
  const trackRef = useRef(null);
  const isSlider = layout === "slider";
  const [hasOverflow, setHasOverflow] = useState(false);

  const scrollByAmount = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: track.clientWidth * 0.8 * dir, behavior: "smooth" });
  };

  // Arrows only make sense once the track's content is actually wider than
  // its visible box — with few enough cards to already fit, there's
  // nowhere left to scroll to.
  useEffect(() => {
    if (!isSlider) return;
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
  }, [isSlider, products]);

  // No products at all — hide the whole section rather than showing an
  // empty heading, empty track and "No products found" text.
  if (products.length === 0) return null;

  const showArrows = isSlider && hasOverflow;

  return (
    <section className={styles.section}>
      <div className={styles.headingRow}>
        <div>
          <h2 className={styles.heading}>{heading}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {(viewAllHref || showArrows) && (
          <div className={styles.headingRight}>
            {viewAllHref && (
              <Link href={viewAllHref} className={styles.viewAll}>
                View All →
              </Link>
            )}
            {showArrows && (
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
        )}
      </div>

      {isSlider ? (
        <div className={styles.track} ref={trackRef}>
          {products.map((product) => (
            <div key={product.id} className={styles.slide}>
              <ProductCard
                product={product}
                onView={onProductView}
                onAddToCart={onProductAddToCart}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onView={onProductView}
              onAddToCart={onProductAddToCart}
            />
          ))}
        </div>
      )}
    </section>
  );
}
