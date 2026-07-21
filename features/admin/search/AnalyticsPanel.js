import { useEffect, useState } from "react";
import styles from "@/styles/AdminSearch.module.css";

export default function AnalyticsPanel({ dbConfigured }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(dbConfigured);

  useEffect(() => {
    if (!dbConfigured) return;
    fetch("/api/admin/search/analytics")
      .then((r) => r.json())
      .then((d) => {
        setData(d.analytics);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dbConfigured]);

  if (loading) {
    return (
      <div className={styles.card}>
        <p className={styles.empty}>Loading…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.card}>
        <p className={styles.empty}>No analytics data yet.</p>
      </div>
    );
  }

  const conversionLabel =
    data.conversionRate === null ? "No data yet" : `${(data.conversionRate * 100).toFixed(1)}%`;

  return (
    <>
      <div className={styles.card}>
        <h2 className={styles.cardHeading}>Search Analytics</h2>
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{data.totalSearches}</span>
            <span className={styles.statLabel}>Total Searches</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{data.noResultCount}</span>
            <span className={styles.statLabel}>No-Result Terms</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{data.totalClicks}</span>
            <span className={styles.statLabel}>Product Clicks</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{conversionLabel}</span>
            <span className={styles.statLabel}>Search → Cart</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardHeading}>Most Searched Terms</h2>
        {data.mostSearched.length === 0 ? (
          <p className={styles.empty}>No searches logged yet.</p>
        ) : (
          <ul className={styles.rankList}>
            {data.mostSearched.map((t) => (
              <li key={t.term} className={styles.rankRow}>
                <span className={styles.rankTerm}>{t.term}</span>
                <span className={styles.rankCount}>{t.count} searches</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardHeading}>Product Clicks from Search</h2>
        {data.topClickedProducts.length === 0 ? (
          <p className={styles.empty}>No clicks logged yet.</p>
        ) : (
          <ul className={styles.rankList}>
            {data.topClickedProducts.map((p) => (
              <li key={p.id} className={styles.rankRow}>
                <span className={styles.rankTerm}>{p.name}</span>
                <span className={styles.rankCount}>{p.count} clicks</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardHeading}>Popular Brands</h2>
        {data.popularBrands.length === 0 ? (
          <p className={styles.empty}>No data yet.</p>
        ) : (
          <ul className={styles.rankList}>
            {data.popularBrands.map((b) => (
              <li key={b.name} className={styles.rankRow}>
                <span className={styles.rankTerm}>{b.name}</span>
                <span className={styles.rankCount}>{b.count} clicks</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardHeading}>Popular Categories</h2>
        {data.popularCategories.length === 0 ? (
          <p className={styles.empty}>No data yet.</p>
        ) : (
          <ul className={styles.rankList}>
            {data.popularCategories.map((c) => (
              <li key={c.name} className={styles.rankRow}>
                <span className={styles.rankTerm}>{c.name}</span>
                <span className={styles.rankCount}>{c.count} clicks</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
