import { getCategoryIcon } from "@/utils/category";
import Price from "@/components/Price";
import styles from "@/styles/Wishlist.module.css";

export default function WishlistGrid({ items, onAddToCart, onRemove }) {
  return (
    <ul className={styles.grid}>
      {items.map((item) => (
        <li key={item.id} className={styles.card}>
          <div className={styles.thumb} style={{ backgroundColor: item.color }}>
            {getCategoryIcon(item.category)}
          </div>
          <span className={styles.name}>{item.name}</span>
          <Price amount={item.price} className={styles.price} />
          <div className={styles.actions}>
            <button className={styles.addBtn} onClick={() => onAddToCart(item)}>
              Add to Cart
            </button>
            <button className={styles.removeBtn} onClick={() => onRemove(item)}>
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
