import Link from "next/link";
import Layout from "@/components/Layout";
import { useStore } from "@/context/StoreContext";
import Price from "@/components/Price";
import StarRating from "@/components/StarRating";
import ProductImage from "@/components/ProductImage";
import { getCategoryIcon, getCategoryName } from "@/utils/category";
import styles from "@/styles/Compare.module.css";

export default function ComparePage() {
  const { compareList, toggleCompare, clearCompare, addToCart } = useStore();

  if (compareList.length === 0) {
    return (
      <Layout title="Compare Products">
        <div className={styles.empty}>
          <p>No products selected for comparison yet.</p>
          <Link href="/shop" className={styles.continueLink}>
            Browse products
          </Link>
        </div>
      </Layout>
    );
  }

  const specKeys = Array.from(
    new Set(compareList.flatMap((p) => Object.keys(p.specs || {})))
  );

  return (
    <Layout title="Compare Products" description="Compare DIS Shop products side by side.">
      <div className={styles.main}>
        <div className={styles.headerRow}>
          <h1 className={styles.heading}>Compare Products</h1>
          <button className={styles.clearBtn} onClick={clearCompare}>
            Clear All
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.rowLabel}></th>
                {compareList.map((p) => (
                  <th key={p.id} className={styles.productCol}>
                    <button
                      className={styles.removeBtn}
                      onClick={() => toggleCompare(p)}
                      aria-label={`Remove ${p.name} from comparison`}
                    >
                      ×
                    </button>
                    <ProductImage
                      src={p.imageUrl || p.images?.[0]}
                      icon={getCategoryIcon(p.category)}
                      background={p.color}
                      alt={p.name}
                      className={styles.thumb}
                      sizes="120px"
                    />
                    <Link href={`/product/${p.id}`} className={styles.productName}>
                      {p.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.rowLabel}>Price</td>
                {compareList.map((p) => (
                  <td key={p.id}>
                    <Price amount={p.price} className={styles.price} />
                  </td>
                ))}
              </tr>
              <tr>
                <td className={styles.rowLabel}>Brand</td>
                {compareList.map((p) => (
                  <td key={p.id}>{p.brand || "—"}</td>
                ))}
              </tr>
              <tr>
                <td className={styles.rowLabel}>Category</td>
                {compareList.map((p) => (
                  <td key={p.id}>{getCategoryName(p.category)}</td>
                ))}
              </tr>
              <tr>
                <td className={styles.rowLabel}>Rating</td>
                {compareList.map((p) => (
                  <td key={p.id}>
                    <StarRating rating={p.rating} /> ({p.reviews})
                  </td>
                ))}
              </tr>
              <tr>
                <td className={styles.rowLabel}>Stock</td>
                {compareList.map((p) => (
                  <td key={p.id}>
                    {typeof p.stock === "number" ? (p.stock > 0 ? `${p.stock} available` : "Out of stock") : "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className={styles.rowLabel}>SKU</td>
                {compareList.map((p) => (
                  <td key={p.id}>{p.sku || "—"}</td>
                ))}
              </tr>
              {specKeys.map((key) => (
                <tr key={key}>
                  <td className={styles.rowLabel}>{key}</td>
                  {compareList.map((p) => (
                    <td key={p.id}>{p.specs?.[key] ?? "—"}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className={styles.rowLabel}></td>
                {compareList.map((p) => (
                  <td key={p.id}>
                    <button className={styles.addBtn} onClick={() => addToCart(p)}>
                      Add to Cart
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
