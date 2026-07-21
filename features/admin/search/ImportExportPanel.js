import { useRef, useState } from "react";
import styles from "@/styles/AdminSearch.module.css";

function ImportBlock({ label, description, importUrl, exportUrl }) {
  const fileRef = useRef(null);
  const [result, setResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError("");
    setResult(null);
    try {
      const text = await file.text();
      const res = await fetch(importUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed.");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeadRow}>
        <div>
          <h2 className={styles.cardHeading}>{label}</h2>
          <p className={styles.cardSubtext}>{description}</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <a className={`${styles.btn} ${styles.btnSecondary}`} href={exportUrl}>
          Export CSV
        </a>
        <label className={`${styles.btn} ${styles.btnPrimary}`} style={{ cursor: "pointer" }}>
          {importing ? "Importing…" : "Import CSV"}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            disabled={importing}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {result && (
        <div className={styles.csvSummary}>
          <span>
            Imported: {result.imported} · Skipped: {result.skipped}
          </span>
          {result.errors.length > 0 && (
            <ul className={styles.csvErrorList}>
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function ImportExportPanel({ dbConfigured }) {
  if (!dbConfigured) {
    return (
      <div className={styles.card}>
        <p className={styles.empty}>No database connected yet.</p>
      </div>
    );
  }

  return (
    <>
      <ImportBlock
        label="Search Synonyms"
        description='CSV columns: terms (semicolon-separated, e.g. "AC;Air Conditioner;مكيف"), active (true/false). Rows are validated before import — malformed rows and exact duplicates of existing groups are skipped, not written.'
        importUrl="/api/admin/search/import/synonyms"
        exportUrl="/api/admin/search/export/synonyms"
      />
      <ImportBlock
        label="Product Search Keywords"
        description="CSV columns: sku or productName (to match an existing product), arabicName, englishName, alternativeNames, searchTags, misspellings, technicalKeywords (list fields semicolon-separated). Rows that don't match a real product are skipped and reported."
        importUrl="/api/admin/search/import/keywords"
        exportUrl="/api/admin/search/export/keywords"
      />
    </>
  );
}
