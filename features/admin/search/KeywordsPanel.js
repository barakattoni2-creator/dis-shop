import { useEffect, useState } from "react";
import styles from "@/styles/AdminSearch.module.css";
import adminStyles from "@/styles/Admin.module.css";

function splitInput(text) {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function KeywordEditForm({ row, onCancel, onSaved }) {
  const [form, setForm] = useState({
    arabicName: row.arabicName || "",
    englishName: row.englishName || "",
    alternativeNames: (row.alternativeNames || []).join(", "),
    searchTags: (row.searchTags || []).join(", "),
    misspellings: (row.misspellings || []).join(", "),
    technicalKeywords: (row.technicalKeywords || []).join(", "),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      arabicName: form.arabicName,
      englishName: form.englishName,
      alternativeNames: splitInput(form.alternativeNames),
      searchTags: splitInput(form.searchTags),
      misspellings: splitInput(form.misspellings),
      technicalKeywords: splitInput(form.technicalKeywords),
    };
    const res = await fetch(`/api/admin/search/keywords/${row.productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Save failed.");
      return;
    }
    onSaved(data.keyword);
  };

  return (
    <div className={adminStyles.modalOverlay} onClick={onCancel}>
      <div className={adminStyles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={adminStyles.modalHeading}>
          {row.productName} {row.productSku ? `(${row.productSku})` : ""}
        </h2>
        <form className={adminStyles.form} onSubmit={handleSubmit}>
          <div className={adminStyles.formRow}>
            <label className={adminStyles.label}>
              Arabic Name
              <input
                className={adminStyles.input}
                value={form.arabicName}
                onChange={set("arabicName")}
                dir="rtl"
              />
            </label>
            <label className={adminStyles.label}>
              English Name
              <input className={adminStyles.input} value={form.englishName} onChange={set("englishName")} />
            </label>
          </div>
          <label className={adminStyles.label}>
            Alternative Names (comma separated)
            <input
              className={adminStyles.input}
              value={form.alternativeNames}
              onChange={set("alternativeNames")}
              placeholder="e.g. Split AC, Wall Unit AC"
            />
          </label>
          <label className={adminStyles.label}>
            Search Tags (comma separated)
            <input
              className={adminStyles.input}
              value={form.searchTags}
              onChange={set("searchTags")}
              placeholder="e.g. cooling, inverter, 1.5hp"
            />
          </label>
          <label className={adminStyles.label}>
            Common Misspellings (comma separated)
            <input
              className={adminStyles.input}
              value={form.misspellings}
              onChange={set("misspellings")}
              placeholder="e.g. aircondition, ariconditioner"
            />
          </label>
          <label className={adminStyles.label}>
            Technical Keywords (comma separated)
            <input
              className={adminStyles.input}
              value={form.technicalKeywords}
              onChange={set("technicalKeywords")}
              placeholder="e.g. model numbers, BTU rating"
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <div className={adminStyles.formActions}>
            <button type="submit" className={adminStyles.saveBtn} disabled={saving}>
              {saving ? "Saving…" : "Save Keywords"}
            </button>
            <button type="button" className={adminStyles.cancelBtn} onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KeywordsPanel({ dbConfigured }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(dbConfigured);
  const [editingRow, setEditingRow] = useState(null);

  // No synchronous setLoading(true) — `loading` already starts true (see
  // useState(dbConfigured) above); this only needs to flip it back off.
  const reload = () => {
    const params = new URLSearchParams({ q, page: String(page), pageSize: String(pageSize) });
    fetch(`/api/admin/search/keywords?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.rows || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQ(qInput);
    }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    if (!dbConfigured) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={styles.card}>
      <div className={styles.cardHeadRow}>
        <div>
          <h2 className={styles.cardHeading}>Product Search Keywords</h2>
          <p className={styles.cardSubtext}>
            Give each product Arabic/English names, alternative names, search tags, common
            misspellings and technical keywords, so it surfaces for more of the ways customers
            actually search.
          </p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="Search by product name or SKU…"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          disabled={!dbConfigured}
        />
      </div>

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>No products found.</p>
      ) : (
        <div className={adminStyles.tableWrap}>
          <table className={adminStyles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Arabic Name</th>
                <th>English Name</th>
                <th>Tags</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.productId}>
                  <td data-label="Product">{row.productName}</td>
                  <td data-label="SKU">{row.productSku || "—"}</td>
                  <td data-label="Arabic Name" dir="rtl">
                    {row.arabicName || "—"}
                  </td>
                  <td data-label="English Name">{row.englishName || "—"}</td>
                  <td data-label="Tags">
                    {row.searchTags.length === 0 ? (
                      "—"
                    ) : (
                      <div className={styles.chipRow}>
                        {row.searchTags.slice(0, 3).map((t) => (
                          <span key={t} className={styles.chip}>
                            {t}
                          </span>
                        ))}
                        {row.searchTags.length > 3 && (
                          <span className={styles.chip}>+{row.searchTags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={adminStyles.actionsCell}>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                      onClick={() => setEditingRow(row)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}

      {editingRow && (
        <KeywordEditForm
          row={editingRow}
          onCancel={() => setEditingRow(null)}
          onSaved={() => {
            setEditingRow(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
