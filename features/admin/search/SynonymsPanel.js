import { useEffect, useState } from "react";
import styles from "@/styles/AdminSearch.module.css";
import adminStyles from "@/styles/Admin.module.css";

function parseTermsInput(text) {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function SynonymsPanel({ dbConfigured, prefillTerm = "" }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(dbConfigured);
  const [error, setError] = useState("");
  const [newTerms, setNewTerms] = useState(prefillTerm ? `${prefillTerm}, ` : "");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTerms, setEditTerms] = useState("");

  // No synchronous setLoading(true) here — `loading` already starts out
  // true (see useState(dbConfigured) above) for the initial mount-effect
  // call below; later calls from action handlers just swap the data in
  // place without a loading flash.
  const reload = () => {
    fetch("/api/admin/search/synonyms")
      .then((r) => r.json())
      .then((data) => {
        setGroups(data.groups || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  // dbConfigured is a stable prop from getServerSideProps — this only ever
  // runs once, on mount. prefillTerm is captured directly in useState above:
  // this panel is unmounted/remounted on every tab switch (see
  // pages/admin/settings/search.js), so a fresh prefillTerm always arrives
  // as a fresh mount, never as a prop change on an already-mounted instance.
  useEffect(() => {
    if (dbConfigured) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const terms = parseTermsInput(newTerms);
    if (terms.length < 2) {
      setError("Enter at least two terms separated by commas.");
      return;
    }
    setError("");
    setSaving(true);
    const res = await fetch("/api/admin/search/synonyms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terms }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setNewTerms("");
    reload();
  };

  const handleToggle = async (group) => {
    await fetch(`/api/admin/search/synonyms/${group.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !group.active }),
    });
    reload();
  };

  const handleDelete = async (group) => {
    if (!window.confirm(`Delete synonym group "${group.terms.join(" = ")}"?`)) return;
    await fetch(`/api/admin/search/synonyms/${group.id}`, { method: "DELETE" });
    reload();
  };

  const startEdit = (group) => {
    setEditingId(group.id);
    setEditTerms(group.terms.join(", "));
  };

  const saveEdit = async (id) => {
    const terms = parseTermsInput(editTerms);
    if (terms.length < 2) {
      setError("Enter at least two terms separated by commas.");
      return;
    }
    setError("");
    const res = await fetch(`/api/admin/search/synonyms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terms }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setEditingId(null);
    reload();
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeadRow}>
        <div>
          <h2 className={styles.cardHeading}>Search Synonyms</h2>
          <p className={styles.cardSubtext}>
            Group equivalent terms — e.g. AC = Air Conditioner = مكيف = تكييف. A customer
            searching any active term also matches the others in its group.
          </p>
        </div>
      </div>

      <form className={styles.inlineForm} onSubmit={handleAdd}>
        <input
          className={styles.searchInput}
          placeholder="AC, Air Conditioner, مكيف, تكييف"
          value={newTerms}
          onChange={(e) => setNewTerms(e.target.value)}
          disabled={!dbConfigured}
        />
        <button
          type="submit"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={!dbConfigured || saving}
        >
          {saving ? "Adding…" : "Add Synonym Group"}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : groups.length === 0 ? (
        <p className={styles.empty}>No synonym groups yet.</p>
      ) : (
        <div className={adminStyles.tableWrap}>
          <table className={adminStyles.table}>
            <thead>
              <tr>
                <th>Terms</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id}>
                  <td data-label="Terms">
                    {editingId === g.id ? (
                      <input
                        className={adminStyles.input}
                        value={editTerms}
                        onChange={(e) => setEditTerms(e.target.value)}
                      />
                    ) : (
                      <div className={styles.chipRow}>
                        {g.terms.map((t) => (
                          <span key={t} className={styles.chip}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td data-label="Status">
                    <span
                      className={`${styles.badge} ${g.active ? styles.badgeActive : styles.badgeInactive}`}
                    >
                      {g.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className={adminStyles.actionsCell}>
                    {editingId === g.id ? (
                      <>
                        <button
                          className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                          onClick={() => saveEdit(g.id)}
                        >
                          Save
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                          onClick={() => startEdit(g)}
                        >
                          Edit
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                          onClick={() => handleToggle(g)}
                        >
                          {g.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                          onClick={() => handleDelete(g)}
                        >
                          Delete
                        </button>
                      </>
                    )}
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
