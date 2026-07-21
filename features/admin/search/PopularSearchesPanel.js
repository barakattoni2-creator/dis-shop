import { useEffect, useState } from "react";
import styles from "@/styles/AdminSearch.module.css";
import adminStyles from "@/styles/Admin.module.css";

export default function PopularSearchesPanel({ dbConfigured }) {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(dbConfigured);
  const [newTerm, setNewTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // No synchronous setLoading(true) — `loading` already starts true (see
  // useState(dbConfigured) above); this only needs to flip it back off.
  const reload = () => {
    fetch("/api/admin/search/popular")
      .then((r) => r.json())
      .then((data) => {
        setTerms(data.terms || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (dbConfigured) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTerm.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/search/popular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term: newTerm.trim() }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setNewTerm("");
    reload();
  };

  const handleToggle = async (term) => {
    await fetch(`/api/admin/search/popular/${term.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !term.active }),
    });
    reload();
  };

  const handleDelete = async (term) => {
    if (!window.confirm(`Delete "${term.term}"?`)) return;
    await fetch(`/api/admin/search/popular/${term.id}`, { method: "DELETE" });
    reload();
  };

  const move = async (index, dir) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= terms.length) return;
    const reordered = [...terms];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setTerms(reordered);
    await fetch("/api/admin/search/popular/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: reordered.map((t) => t.id) }),
    });
    reload();
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeadRow}>
        <div>
          <h2 className={styles.cardHeading}>Popular Searches</h2>
          <p className={styles.cardSubtext}>
            Featured terms shown below the search bar on the storefront. Reorder with the
            arrows — the top term shows first.
          </p>
        </div>
      </div>

      <form className={styles.inlineForm} onSubmit={handleAdd}>
        <input
          className={styles.searchInput}
          placeholder="e.g. Solar Panel"
          value={newTerm}
          onChange={(e) => setNewTerm(e.target.value)}
          disabled={!dbConfigured}
        />
        <button
          type="submit"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={!dbConfigured || saving}
        >
          {saving ? "Adding…" : "Add Term"}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : terms.length === 0 ? (
        <p className={styles.empty}>No featured terms yet.</p>
      ) : (
        <div className={adminStyles.tableWrap}>
          <table className={adminStyles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Term</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {terms.map((t, i) => (
                <tr key={t.id}>
                  <td data-label="Order">
                    <button
                      type="button"
                      className={styles.dragHandle}
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                    >
                      ↑
                    </button>{" "}
                    <button
                      type="button"
                      className={styles.dragHandle}
                      onClick={() => move(i, 1)}
                      disabled={i === terms.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </td>
                  <td data-label="Term">{t.term}</td>
                  <td data-label="Status">
                    <span
                      className={`${styles.badge} ${t.active ? styles.badgeActive : styles.badgeInactive}`}
                    >
                      {t.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className={adminStyles.actionsCell}>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                      onClick={() => handleToggle(t)}
                    >
                      {t.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                      onClick={() => handleDelete(t)}
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
    </div>
  );
}
