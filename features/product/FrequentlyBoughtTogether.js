import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { getCategoryIcon } from "@/utils/category";
import ProductImage from "@/components/ProductImage";
import Price from "@/components/Price";
import { CheckIcon } from "@/components/icons";
import styles from "@/styles/FrequentlyBoughtTogether.module.css";

export default function FrequentlyBoughtTogether({ mainProduct, extras }) {
  const { addToCart } = useStore();
  const bundle = [mainProduct, ...extras];
  const [checked, setChecked] = useState(() => new Set(bundle.map((p) => p.id)));

  if (extras.length === 0) return null;

  const toggle = (id) => {
    // The main product can't be unchecked — it's what the shopper is here for.
    if (id === mainProduct.id) return;
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selected = bundle.filter((p) => checked.has(p.id));
  const total = selected.reduce((sum, p) => sum + p.price, 0);

  const addAll = () => {
    selected.forEach((p) => addToCart(p));
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Frequently Bought Together</h2>
      <div className={styles.row}>
        {bundle.map((p, i) => (
          <div key={p.id} className={styles.item}>
            <label className={styles.itemLabel}>
              <input
                type="checkbox"
                checked={checked.has(p.id)}
                onChange={() => toggle(p.id)}
                disabled={p.id === mainProduct.id}
              />
              <ProductImage
                src={p.imageUrl || p.images?.[0]}
                icon={getCategoryIcon(p.category)}
                background={p.color}
                alt={p.name}
                className={styles.thumb}
                sizes="90px"
              />
            </label>
            <Link href={`/product/${p.id}`} className={styles.itemName}>
              {p.name}
            </Link>
            <Price amount={p.price} className={styles.itemPrice} />
            {i < bundle.length - 1 && <span className={styles.plus}>+</span>}
          </div>
        ))}
      </div>
      <div className={styles.footer}>
        <p className={styles.totalLine}>
          Total for {selected.length} item{selected.length !== 1 ? "s" : ""}:{" "}
          <Price amount={total} className={styles.totalPrice} />
        </p>
        <button type="button" className={styles.addAllBtn} onClick={addAll}>
          <CheckIcon /> Add {selected.length} to Cart
        </button>
      </div>
    </section>
  );
}
