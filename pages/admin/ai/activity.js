import { useEffect, useState } from "react";
import AdminLayout from "@/features/admin/AdminLayout";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import styles from "@/styles/AdminSearch.module.css";
import adminStyles from "@/styles/Admin.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_AI);
  if (guard.redirect) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
}

const STATUS_ICON = { success: "✅", failed: "❌", blocked: "⛔" };

export default function AiActivityPage({ email, role, dbConfigured }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 30;
  const [loading, setLoading] = useState(dbConfigured);

  useEffect(() => {
    if (!dbConfigured) return;
    fetch(`/api/admin/ai/activity?page=${page}&pageSize=${pageSize}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows || []);
        setTotal(data.total || 0);
        setLoading(false);
      });
  }, [page, dbConfigured]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminLayout title="AI Activity Log" email={email} role={role}>
      <div className={adminStyles.main}>
        {!dbConfigured && (
          <p className={adminStyles.note}>
            No database connected yet. Set <code>DATABASE_URL</code> to enable the AI system.
          </p>
        )}

        <div className={styles.card}>
          <h2 className={styles.cardHeading}>AI Activity Log</h2>
          <p className={styles.cardSubtext}>
            Every suggestion generated, approved, rejected, applied or blocked — most recent
            first. Every entry records who acted and when; nothing here contains API keys or
            secrets.
          </p>

          {loading ? (
            <p className={styles.empty}>Loading…</p>
          ) : rows.length === 0 ? (
            <p className={styles.empty}>
              No AI activity yet. Nothing has been suggested, approved or applied.
            </p>
          ) : (
            <ul className={styles.rankList}>
              {rows.map((r) => (
                <li key={r.id} className={styles.rankRow} style={{ alignItems: "flex-start" }}>
                  <div>
                    <span className={styles.rankTerm}>
                      {STATUS_ICON[r.status] || ""} {r.actorEmail}
                    </span>
                    <span className={styles.cardSubtext} style={{ marginLeft: "0.5rem" }}>
                      {r.action}
                      {r.targetType ? ` · ${r.targetType}` : ""}
                      {r.details ? ` — ${r.details}` : ""}
                    </span>
                  </div>
                  <span className={styles.rankCount}>{new Date(r.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
