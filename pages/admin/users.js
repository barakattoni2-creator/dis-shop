import { useEffect, useState } from "react";
import AdminLayout from "@/features/admin/AdminLayout";
import { requireAdminPage } from "@/lib/adminAuth";
import { ADMIN_ROLES, ROLE_LABELS, PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import styles from "@/styles/AdminSearch.module.css";
import adminStyles from "@/styles/Admin.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_USERS);
  if (guard.redirect) return guard;
  return {
    props: {
      email: guard.session.email,
      role: guard.session.role,
      dbConfigured: isDbConfigured(),
    },
  };
}

function emptyForm() {
  return { name: "", email: "", password: "", role: "SALES" };
}

function UsersPanel({ currentEmail, dbConfigured }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(dbConfigured);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (dbConfigured) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbConfigured]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setShowForm(false);
    setForm(emptyForm());
    reload();
  };

  const patchUser = async (user, patch) => {
    setError("");
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    reload();
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Remove admin account "${user.email}"?`)) return;
    setError("");
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    reload();
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeadRow}>
        <div>
          <h2 className={styles.cardHeading}>Admin Users</h2>
          <p className={styles.cardSubtext}>
            Accounts and roles for /admin access. Roles: Super Admin, Admin, Sales, Warehouse,
            Delivery.
          </p>
        </div>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => setShowForm(true)}
          disabled={!dbConfigured}
        >
          + Add Admin User
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : users.length === 0 ? (
        <p className={styles.empty}>No admin users yet.</p>
      ) : (
        <div className={adminStyles.tableWrap}>
          <table className={adminStyles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td data-label="Name">{u.name}</td>
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Role">
                    <select
                      className={styles.statusSelect}
                      value={u.role}
                      onChange={(e) => patchUser(u, { role: e.target.value })}
                    >
                      {ADMIN_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label="Status">
                    <span
                      className={`${styles.badge} ${u.active ? styles.badgeGreen : styles.badgeGray}`}
                    >
                      {u.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td data-label="Last Login">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                  </td>
                  <td className={adminStyles.actionsCell}>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                      onClick={() => patchUser(u, { active: !u.active })}
                      disabled={u.email === currentEmail}
                    >
                      {u.active ? "Disable" : "Enable"}
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                      onClick={() => handleDelete(u)}
                      disabled={u.email === currentEmail}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className={adminStyles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={adminStyles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={adminStyles.modalHeading}>Add Admin User</h2>
            <form className={adminStyles.form} onSubmit={handleAdd}>
              <label className={adminStyles.label}>
                Name
                <input className={adminStyles.input} value={form.name} onChange={set("name")} required />
              </label>
              <label className={adminStyles.label}>
                Email
                <input
                  type="email"
                  className={adminStyles.input}
                  value={form.email}
                  onChange={set("email")}
                  required
                />
              </label>
              <label className={adminStyles.label}>
                Temporary Password (min 8 characters)
                <input
                  type="password"
                  className={adminStyles.input}
                  value={form.password}
                  onChange={set("password")}
                  minLength={8}
                  required
                />
              </label>
              <label className={adminStyles.label}>
                Role
                <select className={adminStyles.input} value={form.role} onChange={set("role")}>
                  {ADMIN_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </label>
              <div className={adminStyles.formActions}>
                <button type="submit" className={adminStyles.saveBtn} disabled={saving}>
                  {saving ? "Creating…" : "Create Admin User"}
                </button>
                <button type="button" className={adminStyles.cancelBtn} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityPanel({ dbConfigured }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 30;
  const [loading, setLoading] = useState(dbConfigured);

  const reload = () => {
    fetch(`/api/admin/activity?page=${page}&pageSize=${pageSize}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!dbConfigured) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbConfigured, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={styles.card}>
      <h2 className={styles.cardHeading}>Activity Log</h2>
      <p className={styles.cardSubtext}>
        Sign-ins, sign-outs, denied actions and admin-account changes, most recent first.
      </p>

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>No activity logged yet.</p>
      ) : (
        <ul className={styles.rankList}>
          {rows.map((r) => (
            <li key={r.id} className={styles.rankRow} style={{ alignItems: "flex-start" }}>
              <div>
                <span className={styles.rankTerm}>{r.actorEmail}</span>
                <span className={styles.cardSubtext} style={{ marginLeft: "0.5rem" }}>
                  {r.action}
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
  );
}

export default function AdminUsersPage({ email, role, dbConfigured }) {
  const [tab, setTab] = useState("users");

  return (
    <AdminLayout title="Admin Users" email={email} role={role}>
      <div className={styles.main}>
        {!dbConfigured && (
          <p className={styles.note}>
            No database connected yet. Set <code>DATABASE_URL</code> in{" "}
            <code>.env.local</code> to manage admin accounts.
          </p>
        )}

        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "users" ? styles.tabBtnActive : ""}`}
            onClick={() => setTab("users")}
          >
            Admin Users
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "activity" ? styles.tabBtnActive : ""}`}
            onClick={() => setTab("activity")}
          >
            Activity Log
          </button>
        </div>

        <div className={styles.tabPanel}>
          {tab === "users" && <UsersPanel currentEmail={email} dbConfigured={dbConfigured} />}
          {tab === "activity" && <ActivityPanel dbConfigured={dbConfigured} />}
        </div>
      </div>
    </AdminLayout>
  );
}
