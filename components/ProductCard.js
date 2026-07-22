import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { useExchangeRate } from "@/components/CompanyInfoProvider";
import { calcDiscount, formatCurrency } from "@/utils/format";
import StarRating from "@/components/StarRating";
import Price from "@/components/Price";
import ProductImage from "@/components/ProductImage";
import QuickViewModal from "@/components/QuickViewModal";
import { HeartIcon, CartIcon, ZoomIcon, CompareIcon } from "@/components/icons";
import styles from "@/styles/ProductCard.module.css";

export default function ProductCard({ product, onView, onAddToCart }) {
  const { addToCart, toggleWishlist, isWishlisted, toggleCompare, isCompared } = useStore();
  const { rate } = useExchangeRate();
  const [quickView, setQuickView] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const intervalRef = useRef(null);
  const wishlisted = isWishlisted(product.id);
  const compared = isCompared(product.id);
  const discount = calcDiscount(product.price, product.originalPrice);
  // Primary photo (product.imageUrl) always comes first; any additional
  // gallery photos follow, deduped — matches "use the primary image, fall
  // back to the first gallery image" rather than letting the gallery order
  // silently override the product's chosen primary photo.
  const images = product.imageUrl
    ? [product.imageUrl, ...(product.images || []).filter((img) => img !== product.imageUrl)]
    : product.images || [];
  // Static/Odoo fallback catalogs don't carry a stock count — treat
  // "unknown" as available rather than showing the whole demo catalog as
  // out of stock when no database is configured.
  const stockKnown = typeof product.stock === "number";
  const inStock = !stockKnown || product.stock > 0;
  const lowStock = stockKnown && product.stock > 0 && product.stock <= 5;

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const startCarousel = () => {
    if (images.length < 2) return;
    intervalRef.current = setInterval(() => {
      setActiveImage((i) => (i + 1) % images.length);
    }, 1100);
  };

  const stopCarousel = () => {
    clearInterval(intervalRef.current);
    setActiveImage(0);
  };

  const handleAddToCart = () => {
    addToCart(product);
    onAddToCart?.(product);
  };

  return (
    <div className={styles.card}>
      <div className={styles.iconStack}>
        <button
          type="button"
          className={`${styles.iconBtn} ${wishlisted ? styles.iconBtnActive : ""}`}
          onClick={() => toggleWishlist(product)}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
        >
          <HeartIcon filled={wishlisted} />
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => setQuickView(true)}
          aria-label="Quick view"
        >
          <ZoomIcon />
        </button>
        <button
          type="button"
          className={`${styles.iconBtn} ${compared ? styles.iconBtnActive : ""}`}
          onClick={() => toggleCompare(product)}
          aria-label={compared ? "Remove from compare" : "Add to compare"}
          aria-pressed={compared}
        >
          <CompareIcon />
        </button>
      </div>

      <Link
        href={`/product/${product.id}`}
        className={styles.imageWrap}
        onMouseEnter={startCarousel}
        onMouseLeave={stopCarousel}
        onClick={() => onView?.(product)}
      >
        {product.badge && <span className={styles.badge}>{product.badge}</span>}
        {discount > 0 && <span className={styles.discountTag}>-{discount}%</span>}
        <ProductImage
          src={images[activeImage]}
          background={product.color}
          alt={product.name}
          className={styles.imageStage}
          sizes="(max-width: 640px) 50vw, 240px"
        />
        {images.length > 1 && (
          <div className={styles.imageDots}>
            {images.map((_, i) => (
              <span
                key={i}
                className={`${styles.imageDot} ${i === activeImage ? styles.imageDotActive : ""}`}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          className={styles.quickViewBar}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setQuickView(true);
          }}
        >
          <ZoomIcon width="14" height="14" /> Quick View
        </button>
      </Link>

      <div className={styles.info}>
        {product.brand && <span className={styles.brand}>{product.brand}</span>}
        <h3 className={styles.name}>
          <Link href={`/product/${product.id}`} onClick={() => onView?.(product)}>
            {product.name}
          </Link>
        </h3>
        <div className={styles.ratingRow}>
          <StarRating rating={product.rating} />
          <span className={styles.reviews}>({product.reviews})</span>
        </div>
        <div className={styles.priceRow}>
          <Price amount={product.price} className={styles.price} />
          {discount > 0 && (
            <Price amount={product.originalPrice} className={styles.originalPrice} />
          )}
        </div>
        <span className={styles.sspPrice}>≈ {formatCurrency(product.price, "SSP", rate)}</span>
        <span
          className={`${styles.stockStatus} ${
            inStock ? (lowStock ? styles.lowStock : styles.inStock) : styles.outOfStock
          }`}
        >
          {inStock ? (lowStock ? `Only ${product.stock} left` : "In Stock") : "Out of Stock"}
        </span>
        <button
          type="button"
          className={styles.addBtn}
          onClick={handleAddToCart}
          disabled={!inStock}
          aria-label={inStock ? `Add ${product.name} to cart` : `${product.name} is out of stock`}
        >
          <CartIcon width="16" height="16" /> {inStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>

      {quickView && (
        <QuickViewModal product={product} onClose={() => setQuickView(false)} />
      )}
    </div>
  );
}
