import { useEffect, useState } from "react";
import styles from "@/styles/AdminSearch.module.css";
import adminStyles from "@/styles/Admin.module.css";

function AssignProductsForm({ term, onCancel }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [assignedIds, setAssignedIds] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    const res = await fetch(
      `/api/admin/search/keywords?q=${encodeURIComponent(query.trim())}&pageSize=10`
    );
    const data = await res.json();
    setResults(data.rows || []);
    setSearching(false);
  };

  const assign = async (row) => {
    setSavingId(row.productId);
    setError("");
    const nextTags = Array.from(new Set([...(row.searchTags || []), term]));
    const res = await fetch(`/api/admin/search/keywords/${row.productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        arabicName: row.arabicName,
        englishName: row.englishName,
        alternativeNames: row.alternativeNames,
        searchTags: nextTags,
        misspellings: row.misspellings,
        technicalKeywords: row.technicalKeywords,
      }),
    });
    setSavingId(null);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to assign.");
      return;
    }
    setAssignedIds((prev) => [...prev, row.productId]);
  };

  return (
    <div className={adminStyles.modalOverlay} onClick={onCancel}>
      <div className={adminStyles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={adminStyles.modalHeading}>Assign Products to &ldquo;{term}&rdquo;</h2>
        <p className={styles.cardSubtext}>
          Adds &ldquo;{term}&rdquo; as a search tag on the product(s) you choose, so this search
          finds them next time.
        </p>
        <form className={styles.inlineForm} onSubmit={handleSearch}>
          <input
            className={styles.searchInput}
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className={`${styles.btn} ${styles.btnSecondary}`}
            disabled={searching}
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </form>
        {error && <p className={styles.error}>{error}</p>}
        {results.length > 0 && (
          <ul className={styles.rankList}>
            {results.map((row) => {
              const assigned = assignedIds.includes(row.productId);
              return (
                <li key={row.productId} className={styles.rankRow}>
                  <span>
                    {row.productName} {row.productSku ? `(${row.productSku})` : ""}
                  </span>
                  <button
                    type="button"
                    className={`${styles.btn} ${assigned ? styles.btnSecondary : styles.btnPrimary} ${styles.btnSm}`}
                    onClick={() => assign(row)}
                    disabled={savingId === row.productId || assigned}
                  >
                    {assigned ? "Assigned ✓" : savingId === row.productId ? "Assigning…" : "Assign"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className={adminStyles.formActions}>
          <button type="button" className={adminStyles.cancelBtn} onClick={onCancel}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NoResultSearchesPanel({ dbConfigured, onAddSynonym }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [loading, setLoading] = useState(dbConfigured);
  const [assigningTerm, setAssigningTerm] = useState(null);

  // No synchronous setLoading(true) — `loading` already starts true (see
  // useState(dbConfigured) above); this only needs to flip it back off.
  const reload = () => {
    fetch(`/api/admin/search/no-results?page=${page}&pageSize=${pageSize}`)
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
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={styles.card}>
      <div className={styles.cardHeadRow}>
        <div>
          <h2 className={styles.cardHeading}>No-Result Searches</h2>
          <p className={styles.cardSubtext}>
            Terms customers searched that returned nothing — the best source of new synonyms and
            keywords to add.
          </p>
        </div>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>No no-result searches logged yet.</p>
      ) : (
        <div className={adminStyles.tableWrap}>
          <table className={adminStyles.table}>
            <thead>
              <tr>
                <th>Search Term</th>
                <th># Searches</th>
                <th>Last Searched</th>
                <th>Closest Products</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.term}>
                  <td data-label="Search Term">{r.term}</td>
                  <td data-label="# Searches">{r.count}</td>
                  <td data-label="Last Searched">{new Date(r.lastSearchedAt).toLocaleString()}</td>
                  <td data-label="Closest Products">
                    {r.closestProducts.length === 0 ? (
                      "—"
                    ) : (
                      <div className={styles.chipRow}>
                        {r.closestProducts.map((p) => (
                          <span key={p.id} className={styles.chip}>
                            {p.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className={adminStyles.actionsCell}>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                      onClick={() => onAddSynonym(r.term)}
                    >
                      Add Synonym
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                      onClick={() => setAssigningTerm(r.term)}
                    >
                      Assign Products
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

      {assigningTerm && (
        <AssignProductsForm term={assigningTerm} onCancel={() => setAssigningTerm(null)} />
      )}
    </div>
  );
}
