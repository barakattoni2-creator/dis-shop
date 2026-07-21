import Link from "next/link";
import { getCategoryIcon } from "@/utils/category";
import { useExchangeRate } from "@/components/CompanyInfoProvider";
import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/utils/format";
import { MinusIcon, PlusIcon, TrashIcon, HeartIcon } from "@/components/icons";
import ProductImage from "@/components/ProductImage";
import Price from "@/components/Price";
import styles from "@/styles/Cart.module.css";

export default function CartItemList({ items, onUpdateQty, onRemove }) {
  const { rate } = useExchangeRate();
  const { toggleWishlist } = useStore();

  const handleMoveToWishlist = (item) => {
    toggleWishlist(item);
    onRemove(item.id);
  };

  return (
    <ul className={styles.itemList}>
      {items.map((item) => {
        // Snapshotted at add-to-cart time — the best available signal
        // without a live re-fetch, same assumption the product page makes.
        const stockKnown = typeof item.stock === "number";
        const inStock = !stockKnown || item.stock > 0;
        const lowStock = stockKnown && item.stock > 0 && item.stock <= 5;
        const maxQty = stockKnown ? Math.max(1, item.stock) : 99;

        return (
          <li key={item.id} className={styles.item}>
            <Link href={`/product/${item.id}`} className={styles.thumbLink}>
              <ProductImage
                src={item.imageUrl || item.images?.[0]}
                icon={getCategoryIcon(item.category)}
                background={item.color}
                alt={item.name}
                className={styles.thumb}
                sizes="110px"
              />
            </Link>
            <div className={styles.itemInfo}>
              {item.brand && <span className={styles.itemBrand}>{item.brand}</span>}
              <Link href={`/product/${item.id}`} className={styles.itemName}>
                {item.name}
              </Link>
              <div className={styles.itemMetaRow}>
                {item.sku && <span className={styles.itemSku}>SKU: {item.sku}</span>}
                <span
                  className={`${styles.itemStock} ${
                    inStock ? (lowStock ? styles.lowStock : styles.inStock) : styles.outOfStock
                  }`}
                >
                  {inStock ? (lowStock ? `Only ${item.stock} left` : "In Stock") : "Out of Stock"}
                </span>
              </div>
              <div className={styles.itemPriceRow}>
                <Price amount={item.price} className={styles.itemPrice} />
                <span className={styles.itemPriceSsp}>
                  ≈ {formatCurrency(item.price, "SSP", rate)}
                </span>
              </div>
              <div className={styles.qtyRow}>
                <div className={styles.qtyStepper}>
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.id, item.qty - 1)}
                    aria-label="Decrease quantity"
                    disabled={item.qty <= 1}
                  >
                    <MinusIcon />
                  </button>
                  <span>{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.id, Math.min(maxQty, item.qty + 1))}
                    aria-label="Increase quantity"
                    disabled={item.qty >= maxQty}
                  >
                    <PlusIcon />
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => onRemove(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  <TrashIcon />
                  Remove
                </button>
                <button
                  type="button"
                  className={styles.wishlistMoveBtn}
                  onClick={() => handleMoveToWishlist(item)}
                  aria-label={`Move ${item.name} to wishlist`}
                >
                  <HeartIcon />
                  Move to Wishlist
                </button>
              </div>
            </div>
            <div className={styles.itemSubtotal}>
              <Price amount={item.price * item.qty} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
