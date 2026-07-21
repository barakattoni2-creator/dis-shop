import { useEffect, useState } from "react";
import AdminLayout from "@/features/admin/AdminLayout";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import styles from "@/styles/Admin.module.css";

const LOW_STOCK_THRESHOLD = 5;

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_PRODUCTS);
  if (guard.redirect) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
}

export default function AdminInventoryPage({ email, role, dbConfigured }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(dbConfigured);
  const [savingId, setSavingId] = useState(null);

  const reload = () => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (dbConfigured) reload();
  }, [dbConfigured]);

  const handleStockChange = async (product, value) => {
    const stock = Math.max(0, Number(value) || 0);
    if (stock === product.stock) return;
    setSavingId(product.id);
    await fetch(`/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock }),
    });
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock } : p))
    );
    setSavingId(null);
  };

  const lowStockCount = products.filter((p) => (p.stock ?? 0) <= LOW_STOCK_THRESHOLD).length;

  return (
    <AdminLayout title="Inventory" email={email} role={role}>
      <div className={styles.main}>
        {!dbConfigured && (
          <p className={styles.note}>
            No database connected yet. Set <code>DATABASE_URL</code> in{" "}
            <code>.env.local</code> to manage stock levels.
          </p>
        )}

        {dbConfigured && !loading && (
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{products.length}</span>
              <span className={styles.statLabel}>Products</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{lowStockCount}</span>
              <span className={styles.statLabel}>Low Stock (≤ {LOW_STOCK_THRESHOLD})</span>
            </div>
          </div>
        )}

        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : products.length === 0 ? (
          <p className={styles.empty}>No products yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Product">{p.name}</td>
                    <td data-label="Category">{p.category}</td>
                    <td data-label="Price">${p.price}</td>
                    <td data-label="Stock">
                      <input
                        type="number"
                        min="0"
                        className={styles.input}
                        style={{
                          width: "90px",
                          borderColor:
                            (p.stock ?? 0) <= LOW_STOCK_THRESHOLD
                              ? "var(--dis-orange-dark)"
                              : undefined,
                        }}
                        defaultValue={p.stock ?? 0}
                        disabled={savingId === p.id}
                        onBlur={(e) => handleStockChange(p, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
