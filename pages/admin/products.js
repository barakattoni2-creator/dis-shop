import { useEffect, useState } from "react";
import AdminLayout from "@/features/admin/AdminLayout";
import ProductTable from "@/features/admin/ProductTable";
import ProductForm from "@/features/admin/ProductForm";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import styles from "@/styles/Admin.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_PRODUCTS);
  if (guard.redirect) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
}

export default function AdminProductsPage({ email, role, dbConfigured }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(dbConfigured);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const reload = () => {
    Promise.all([
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/admin/brands").then((r) => r.json()),
    ]).then(([p, c, b]) => {
      setProducts(p.products || []);
      setCategories(c.categories || []);
      setBrands(b.brands || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (dbConfigured) reload();
  }, [dbConfigured]);

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setEditing(product);
    setShowForm(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    reload();
  };

  const handleSubmit = async (data) => {
    setError("");
    try {
      const res = editing
        ? await fetch(`/api/admin/products/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
        : await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Save failed.");
      setShowForm(false);
      setEditing(null);
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AdminLayout title="Products" email={email} role={role}>
      <div className={styles.main}>
        <div className={styles.headerRow}>
          <div />
          <button
            className={styles.addBtn}
            onClick={handleAdd}
            disabled={!dbConfigured}
          >
            + Add Product
          </button>
        </div>

        {!dbConfigured && (
          <p className={styles.note}>
            No database connected yet. Set <code>DATABASE_URL</code> in{" "}
            <code>.env.local</code> to manage products.
          </p>
        )}
        {error && <p className={styles.uploadError}>{error}</p>}

        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : (
          <ProductTable products={products} onEdit={handleEdit} onDelete={handleDelete} />
        )}

        {showForm && (
          <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalHeading}>
                {editing ? "Edit Product" : "Add Product"}
              </h2>
              <ProductForm
                initial={editing}
                categories={categories}
                brands={brands}
                onSubmit={handleSubmit}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
