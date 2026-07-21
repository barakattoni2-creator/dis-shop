import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { getCategoryIcon } from "@/utils/category";
import { calcDiscount } from "@/utils/format";
import StarRating from "@/components/StarRating";
import Price from "@/components/Price";
import ProductImage from "@/components/ProductImage";
import styles from "@/styles/QuickViewModal.module.css";

export default function QuickViewModal({ product, onClose }) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const wishlisted = isWishlisted(product.id);
  const discount = calcDiscount(product.price, product.originalPrice);
  const categoryIcon = getCategoryIcon(product.category);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className={styles.imageCol}>
          {product.badge && <span className={styles.badge}>{product.badge}</span>}
          <ProductImage
            src={product.imageUrl || `/images/products/${product.id}.jpg`}
            icon={categoryIcon}
            background={product.color}
            alt={product.name}
            className={styles.image}
          />
        </div>

        <div className={styles.infoCol}>
          {product.brand && <span className={styles.brand}>{product.brand}</span>}
          <h2 className={styles.name}>{product.name}</h2>
          <div className={styles.ratingRow}>
            <StarRating rating={product.rating} />
            <span className={styles.reviews}>
              {product.rating} ({product.reviews} reviews)
            </span>
          </div>
          <div className={styles.priceRow}>
            <Price amount={product.price} className={styles.price} />
            <Price amount={product.originalPrice} className={styles.originalPrice} />
            {discount > 0 && <span className={styles.discount}>-{discount}%</span>}
          </div>
          {product.description && (
            <p className={styles.description}>{product.description}</p>
          )}

          <div className={styles.actions}>
            <button className={styles.addBtn} onClick={() => addToCart(product)}>
              🛒 Add to Cart
            </button>
            <button
              className={`${styles.wishlistBtn} ${wishlisted ? styles.wishlisted : ""}`}
              onClick={() => toggleWishlist(product)}
            >
              {wishlisted ? "♥ In Wishlist" : "♡ Wishlist"}
            </button>
          </div>
          <Link href={`/product/${product.id}`} className={styles.viewFull}>
            View Full Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
