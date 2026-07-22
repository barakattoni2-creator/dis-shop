import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import AdminLayout from "@/features/admin/AdminLayout";
import BannerTable from "@/features/admin/BannerTable";
import BannerForm, { type BannerFormValues } from "@/features/admin/BannerForm";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import type { AdminRole } from "@/types/domain";
import type { PlainBanner } from "@/types/domain";
import styles from "@/styles/Admin.module.css";

interface AdminBannersPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminBannersPageProps> = async ({ req, res }) => {
  // requireAdminPage's `res` param predates getServerSideProps usage and is
  // typed for the API-route response shape (status/json helpers) that a
  // plain SSR `res` doesn't have — it only ever calls res.setHeader here,
  // so the cast is safe.
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_BANNERS);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

export default function AdminBannersPage({ email, role, dbConfigured }: AdminBannersPageProps) {
  const [banners, setBanners] = useState<PlainBanner[]>([]);
  const [loading, setLoading] = useState(dbConfigured);
  const [editing, setEditing] = useState<PlainBanner | null>(null);
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

  const handleDelete = async (banner: PlainBanner) => {
    if (!window.confirm(`Delete "${banner.title}"?`)) return;
    await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" });
    reload();
  };

  const handleToggleActive = async (banner: PlainBanner) => {
    setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, active: !b.active } : b)));
    await fetch(`/api/admin/banners/${banner.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !banner.active }),
    });
    reload();
  };

  const handleReorder = async (orderedIds: string[]) => {
    setError("");
    // Optimistic — apply the new order locally so rows don't snap back
    // while the request is in flight.
    setBanners((prev) => {
      const byId = new Map(prev.map((b) => [b.id, b]));
      return orderedIds.map((id, index) => ({ ...byId.get(id)!, order: index }));
    });
    const res = await fetch("/api/admin/banners/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Reorder failed.");
    }
    reload();
  };

  const handleSubmit = async (data: BannerFormValues) => {
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
      setError((err as Error).message);
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
            onToggleActive={handleToggleActive}
            onReorder={handleReorder}
          />
        )}

        {showForm && (
          <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalHeading}>{editing ? "Edit Banner" : "Add Banner"}</h2>
              <BannerForm initial={editing} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
