import type { GetServerSideProps } from "next";
import AdminLayout from "@/features/admin/AdminLayout";
import MediaGrid from "@/features/admin/MediaGrid";
import { useMediaLibrary } from "@/features/admin/useMediaLibrary";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import type { AdminRole } from "@/types/domain";
import adminStyles from "@/styles/Admin.module.css";
import styles from "@/styles/MediaLibrary.module.css";

interface AdminMediaPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminMediaPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_MEDIA);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

export default function AdminMediaPage({ email, role, dbConfigured }: AdminMediaPageProps) {
  const { assets, total, page, setPage, pageSize, q, setQ, loading, error, uploading, upload, remove } =
    useMediaLibrary(dbConfigured);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      await upload(file);
    }
  };

  return (
    <AdminLayout title="Media Library" email={email} role={role}>
      <div className={adminStyles.main}>
        {!dbConfigured && (
          <p className={adminStyles.note}>
            No database connected yet. Set <code>DATABASE_URL</code> in <code>.env.local</code> to use the
            media library.
          </p>
        )}
        {error && <p className={adminStyles.uploadError}>{error}</p>}

        <div className={styles.toolbar}>
          <input
            className={styles.searchInput}
            placeholder="Search by filename…"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            disabled={!dbConfigured}
          />
          <label className={styles.uploadLabel} data-disabled={!dbConfigured || uploading}>
            {uploading ? "Uploading…" : "+ Upload Images"}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={!dbConfigured || uploading}
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {loading ? (
          <p className={adminStyles.empty}>Loading…</p>
        ) : (
          <MediaGrid assets={assets} onDelete={remove} />
        )}

        {totalPages > 1 && (
          <div className={styles.pagerRow}>
            <button className={styles.pagerBtn} disabled={page <= 1} onClick={() => setPage(page - 1)}>
              ← Prev
            </button>
            <span>
              Page {page} of {totalPages} ({total} images)
            </span>
            <button
              className={styles.pagerBtn}
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
