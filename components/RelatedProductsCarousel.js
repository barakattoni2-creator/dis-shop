import { useRef } from "react";
import ProductCard from "@/components/ProductCard";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import styles from "@/styles/RelatedProductsCarousel.module.css";

export default function RelatedProductsCarousel({ products, heading }) {
  const trackRef = useRef(null);

  if (products.length === 0) return null;

  const scrollByAmount = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: track.clientWidth * 0.8 * dir, behavior: "smooth" });
  };

  return (
    <section className={styles.section}>
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>{heading}</h2>
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
