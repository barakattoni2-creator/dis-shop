import { useEffect, useState } from "react";
import AdminLayout from "@/features/admin/AdminLayout";
import BannerTable from "@/features/admin/BannerTable";
import BannerForm from "@/features/admin/BannerForm";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import styles from "@/styles/Admin.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_BANNERS);
  if (guard.redirect) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
}

export default function AdminBannersPage({ email, role, dbConfigured }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(dbConfigured);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const reload = () => {
    fetch("/api/admin/banners")
      .then((r) => r.json())
      .then((data) => {
        setBanners(data.banners || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (dbConfigured) reload();
  }, [dbConfigured]);

  const handleDelete = async (banner) => {
    if (!window.confirm(`Delete "${banner.title}"?`)) return;
    await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" });
    reload();
  };

  const handleSubmit = async (data) => {
    setError("");
    try {
      const res = editing
        ? await fetch(`/api/admin/banners/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          })
        : await fetch("/api/admin/banners", {
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
    <AdminLayout title="Homepage Banners" email={email} role={role}>
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
            + Add Banner
          </button>
        </div>

        {!dbConfigured && (
          <p className={styles.note}>
            No database connected yet. Set <code>DATABASE_URL</code> in{" "}
            <code>.env.local</code> to manage homepage banners. The homepage
            will keep showing its default slides until then.
          </p>
        )}
        {error && <p className={styles.uploadError}>{error}</p>}

        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : (
          <BannerTable
            banners={banners}
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
                {editing ? "Edit Banner" : "Add Banner"}
              </h2>
              <BannerForm
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
