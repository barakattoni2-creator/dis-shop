import { useEffect, useState } from "react";
import { PRIORITY_FIELDS } from "@/data/searchPriorityFields";
import styles from "@/styles/AdminSearch.module.css";

const FIELD_LABELS = {
  sku: "SKU",
  name: "Product Name",
  brand: "Brand",
  model: "Model",
  category: "Category",
  tags: "Tags",
  description: "Description",
  specifications: "Specifications",
};

export default function PriorityPanel({ dbConfigured }) {
  const [weights, setWeights] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/search/weights")
      .then((r) => r.json())
      .then((data) => {
        setWeights(data.weights || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (field, value) => {
    setSaved(false);
    setWeights((prev) => ({ ...prev, [field]: Number(value) }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/search/weights", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weights }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setWeights(data.weights);
      setSaved(true);
    }
  };

  if (loading) {
    return (
      <div className={styles.card}>
        <p className={styles.empty}>Loading…</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeadRow}>
        <div>
          <h2 className={styles.cardHeading}>Search Priority</h2>
          <p className={styles.cardSubtext}>
            Higher weight means that field matters more when ranking search results. &ldquo;Model&rdquo;
            scores against each product&apos;s Technical Keywords, and &ldquo;Tags&rdquo; against its
            Search Tags (see Product Search Keywords) — there&apos;s no separate Model field on
            products.
          </p>
        </div>
      </div>

      <div>
        {PRIORITY_FIELDS.map((field) => (
          <div key={field} className={styles.weightRow}>
            <span className={styles.weightLabel}>{FIELD_LABELS[field]}</span>
            <input
              type="range"
              min="0"
              max="10"
              className={styles.weightSlider}
              value={weights[field] ?? 0}
              onChange={(e) => handleChange(field, e.target.value)}
              disabled={!dbConfigured}
            />
            <span className={styles.weightValue}>{weights[field] ?? 0}</span>
          </div>
        ))}
      </div>

      <div>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleSave}
          disabled={!dbConfigured || saving}
        >
          {saving ? "Saving…" : "Save Priority Weights"}
        </button>
        {saved && <span className={styles.success} style={{ marginLeft: "0.8rem" }}>Saved.</span>}
      </div>
    </div>
  );
}
