import { formatPrice } from "@/utils/format";
import styles from "@/styles/Admin.module.css";

export default function ProductTable({ products, onEdit, onDelete }) {
  if (products.length === 0) {
    return <p className={styles.empty}>No products yet.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Brand</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Badge</th>
            <th>Featured</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td data-label="Image">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className={styles.rowThumb} />
                ) : (
                  <span className={styles.rowThumbEmpty}>📦</span>
                )}
              </td>
              <td data-label="Name">{p.name}</td>
              <td data-label="SKU">{p.sku || "—"}</td>
              <td data-label="Category">{p.category}</td>
              <td data-label="Brand">{p.brand}</td>
              <td data-label="Price">{formatPrice(p.price)}</td>
              <td data-label="Stock">{p.stock ?? 0}</td>
              <td data-label="Badge">{p.badge || "—"}</td>
              <td data-label="Featured">{p.featured ? "★" : "—"}</td>
              <td className={styles.actionsCell}>
                <button className={styles.editBtn} onClick={() => onEdit(p)}>
                  Edit
                </button>
                <button className={styles.deleteBtn} onClick={() => onDelete(p)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
