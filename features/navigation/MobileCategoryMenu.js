import { useState } from "react";
import Link from "next/link";
import Skeleton from "@/components/Skeleton";
import styles from "@/styles/MobileCategoryMenu.module.css";

// Drill-down accordion: tapping a category slides in its children with a
// "Back" header, one level at a time (Main → Sub → Child). Used inside
// components/Header.js's mobile drawer.
export default function MobileCategoryMenu({ tree, loading, onNavigate, dir = "ltr" }) {
  const [stack, setStack] = useState([]); // array of category nodes, root..current

  const currentLevel = stack.length === 0 ? tree || [] : stack[stack.length - 1].children;
  const currentParent = stack[stack.length - 1] || null;

  const drillInto = (node) => {
    if (node.children && node.children.length > 0) {
      setStack((prev) => [...prev, node]);
    } else {
      onNavigate?.();
    }
  };

  const goBack = () => setStack((prev) => prev.slice(0, -1));

  if (loading && currentLevel.length === 0) {
    return (
      <div className={styles.root} dir={dir} aria-busy="true">
        <ul className={styles.list}>
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className={styles.row}>
              <div className={styles.rowLink}>
                <Skeleton width="26px" height="26px" radius="6px" />
                <Skeleton width={`${50 + (i % 3) * 15}%`} height="0.88rem" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={styles.root} dir={dir}>
      {currentParent && (
        <button type="button" className={styles.backRow} onClick={goBack}>
          <span className={styles.backArrow}>‹</span>
          Back to {stack.length > 1 ? stack[stack.length - 2].name : "All Categories"}
        </button>
      )}

      {currentParent && (
        <div className={styles.currentHeading}>
          <Link href={`/category/${currentParent.slug}`} className={styles.currentHeadingLink} onClick={onNavigate}>
            View all {currentParent.name} →
          </Link>
        </div>
      )}

      <ul className={styles.list}>
        {currentLevel.map((node) => {
          const hasChildren = node.children && node.children.length > 0;
          return (
            <li key={node.id} className={styles.row}>
              <Link href={`/category/${node.slug}`} className={styles.rowLink} onClick={onNavigate}>
                <span className={styles.rowIcon}>
                  {node.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={node.imageUrl} alt="" className={styles.rowIconImg} />
                  ) : (
                    node.icon || "📦"
                  )}
                </span>
                <span className={styles.rowNames}>
                  <span className={styles.rowName}>{node.name}</span>
                  {node.nameAr && <span className={styles.rowNameAr}>{node.nameAr}</span>}
                </span>
              </Link>
              {hasChildren && (
                <button
                  type="button"
                  className={styles.expandBtn}
                  onClick={() => drillInto(node)}
                  aria-label={`Show ${node.name} subcategories`}
                >
                  ›
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
