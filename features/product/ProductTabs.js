import { useState } from "react";
import ProductReviews from "@/features/product/ProductReviews";
import styles from "@/styles/ProductTabs.module.css";

// Splits a multi-line "spec sheet" description into two non-overlapping
// sets: lines shaped like "Label: Value" become Specification rows, and
// everything else becomes Feature bullets. A single-paragraph prose
// description isn't a spec sheet, so it's left alone for the Description
// tab instead of being split apart.
function splitDescription(description) {
  const lines = (description || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return { isProse: lines.length === 1, specRows: [], features: [] };

  const specRows = [];
  const features = [];
  const labelPattern = /^([A-Za-z][A-Za-z /]*?)\s*:\s*(.+)$/;
  for (const line of lines) {
    const match = line.match(labelPattern);
    if (match) {
      specRows.push([match[1].trim(), match[2].trim()]);
    } else {
      features.push(line);
    }
  }
  return { isProse: false, specRows, features };
}

export default function ProductTabs({ product, reviews, onReviewSubmitted }) {
  const { isProse, specRows: parsedSpecRows, features } = splitDescription(product.description);

  // Admin-entered structured specs (Product.specs) take priority over
  // anything parsed from free-text description; the parsed fallback only
  // runs when no structured specs exist on file.
  const adminSpecs = product.specs && Object.keys(product.specs).length > 0
    ? Object.entries(product.specs)
    : null;
  const specRows = adminSpecs || parsedSpecRows;
  const brandRow = product.brand ? [["Brand", product.brand]] : [];
  const fullSpecRows = specRows.length > 0 ? [...brandRow, ...specRows] : [];

  const warranty = product.specs?.Warranty || product.specs?.warranty;
  const shipping =
    "Delivered across Juba and surrounding areas. The exact delivery fee and " +
    "timeframe are confirmed by WhatsApp or phone before dispatch — message us " +
    "using the button above for a same-day estimate.";

  const TABS = [
    { key: "description", label: "Description", hidden: !isProse },
    { key: "specifications", label: "Specifications", hidden: fullSpecRows.length === 0 },
    { key: "features", label: "Features", hidden: features.length === 0 },
    { key: "warranty", label: "Warranty" },
    { key: "shipping", label: "Shipping" },
    { key: "reviews", label: `Reviews (${reviews.length})` },
  ].filter((t) => !t.hidden);

  const [activeTab, setActiveTab] = useState(TABS[0]?.key || "description");

  return (
    <div className={styles.wrap}>
      <div className={styles.tabList} role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.panel}>
        {activeTab === "description" && (
          <p className={styles.description}>{product.description}</p>
        )}

        {activeTab === "specifications" && (
          <table className={styles.specs}>
            <tbody>
              {fullSpecRows.map(([key, value]) => (
                <tr key={key}>
                  <th>{key}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "features" && (
          <ul className={styles.featureList}>
            {features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}

        {activeTab === "warranty" && (
          <p className={styles.description}>
            {warranty
              ? `This product includes: ${warranty}.`
              : "This product includes the standard manufacturer warranty. Keep your order confirmation as proof of purchase, and contact us via WhatsApp or phone for any warranty claims or support."}
          </p>
        )}

        {activeTab === "shipping" && <p className={styles.description}>{shipping}</p>}

        {activeTab === "reviews" && (
          <ProductReviews
            productId={product.id}
            rating={product.rating}
            reviews={reviews}
            onReviewSubmitted={onReviewSubmitted}
          />
        )}
      </div>
    </div>
  );
}
