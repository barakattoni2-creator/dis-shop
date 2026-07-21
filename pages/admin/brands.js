import { useEffect, useState } from "react";
import AdminLayout from "@/features/admin/AdminLayout";
import BrandTable from "@/features/admin/BrandTable";
import BrandForm from "@/features/admin/BrandForm";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import styles from "@/styles/Admin.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_BRANDS);
  if (guard.redirect) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
}

export default function AdminBrandsPage({ email, role, dbConfigured }) {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const reload = () => {
    fetch("/api/admin/brands")
      .then((r) => r.json())
      .then((data) => {
        setBrands(data.brands || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    reload();
  }, []);

  const handleDelete = async (brand) => {
    if (!window.confirm(`Delete "${brand.name}"?`)) return;
    await fetch(`/api/admin/brands/${brand.id}`, { method: "DELETE" });
    reload();
  };

  const handleSubmit = async (data) => {
    setError("");
    try {
      const res = editing
        ? await fetch(`/api/admin/brands/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ logoUrl: data.logoUrl }),
          })
        : await fetch("/api/admin/brands", {
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
    <AdminLayout title="Brands" email={email} role={role}>
      <div className={styles.main}>
        <div className={styles.headerRow}>
          <div />
          <button
            className={styles.addBtn}
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            disabled={!dbConfigured}
          >
            + Add Brand
          </button>
        </div>

        {!dbConfigured && (
          <p className={styles.note}>
            No database connected yet. Built-in brands are shown below, but
            adding new ones requires <code>DATABASE_URL</code>.
          </p>
        )}
        {error && <p className={styles.uploadError}>{error}</p>}

        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : (
          <BrandTable
            brands={brands}
            onEdit={(b) => {
              setEditing(b);
              setShowForm(true);
            }}
            onDelete={handleDelete}
          />
        )}

        {showForm && (
          <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalHeading}>
                {editing ? "Edit Brand" : "Add Brand"}
              </h2>
              <BrandForm
                initial={editing}
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
