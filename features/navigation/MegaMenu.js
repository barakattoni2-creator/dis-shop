import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Skeleton from "@/components/Skeleton";
import styles from "@/styles/MegaMenu.module.css";

// Optional promo slot per main-category slug — shown only when the hovered
// main category has one, per the "promotional area when available"
// requirement. Kept small/static since there's no admin-managed promo model
// for this yet.
const PROMOS = {
  solar: {
    title: "☀️ Solar Season Sale",
    text: "Save up to 20% on panels & inverters",
    href: "/category/solar",
  },
  "air-conditioners": {
    title: "❄️ Gree AC Deals",
    text: "Genuine Gree units, installed and warrantied",
    href: "/category/air-conditioners",
  },
};

export default function MegaMenu({ tree, loading }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const rootRef = useRef(null);
  const closeTimer = useRef(null);

  const mains = tree || [];
  const active = mains.find((m) => m.id === activeId) || mains[0] || null;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        rootRef.current?.querySelector(`.${styles.trigger}`)?.focus();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const openMenu = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  const handleSidebarKeyDown = (e, index) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = mains[Math.min(index + 1, mains.length - 1)];
      setActiveId(next.id);
      rootRef.current?.querySelectorAll(`.${styles.sidebarItem}`)[Math.min(index + 1, mains.length - 1)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = mains[Math.max(index - 1, 0)];
      setActiveId(prev.id);
      rootRef.current?.querySelectorAll(`.${styles.sidebarItem}`)[Math.max(index - 1, 0)]?.focus();
    }
  };

  const promo = active ? PROMOS[active.slug] : null;

  return (
    <div
      className={styles.root}
      ref={rootRef}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <Link href="/shop" className={styles.trigger} aria-expanded={open} aria-haspopup="true">
        <span className={styles.triggerIcon}>☰</span> Shop
        <span className={styles.chevronDown}>▾</span>
      </Link>

      {open && loading && mains.length === 0 && (
        <div className={styles.panel} role="menu" aria-busy="true">
          <ul className={styles.sidebar}>
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className={styles.sidebarSkeletonRow}>
                <Skeleton width="28px" height="28px" radius="7px" />
                <Skeleton width={`${60 + (i % 3) * 15}%`} height="0.85rem" />
              </li>
            ))}
          </ul>
          <div className={styles.detail}>
            <div className={styles.detailScroll}>
              <Skeleton width="40%" height="1.1rem" className={styles.skeletonBlock} />
              <div className={styles.columns}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={styles.column}>
                    <Skeleton width="80%" height="0.9rem" className={styles.skeletonBlock} />
                    <Skeleton width="60%" height="0.75rem" className={styles.skeletonBlock} />
                    <Skeleton width="70%" height="0.75rem" className={styles.skeletonBlock} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {open && mains.length > 0 && (
        <div className={styles.panel} role="menu">
          <ul className={styles.sidebar}>
            {mains.map((main, index) => (
              <li key={main.id}>
                <Link
                  href={`/category/${main.slug}`}
                  className={`${styles.sidebarItem} ${active?.id === main.id ? styles.sidebarItemActive : ""}`}
                  onMouseEnter={() => setActiveId(main.id)}
                  onFocus={() => setActiveId(main.id)}
                  onKeyDown={(e) => handleSidebarKeyDown(e, index)}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  <span className={styles.iconBadge}>
                    {main.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={main.imageUrl} alt="" className={styles.iconImg} />
                    ) : (
                      main.icon || "📦"
                    )}
                  </span>
                  <span className={styles.sidebarName}>{main.name}</span>
                  <span className={styles.chevron}>›</span>
                </Link>
              </li>
            ))}
          </ul>

          {active && (
            <div className={styles.detail}>
              <div className={styles.detailScroll}>
                <div className={styles.detailHeader}>
                  <Link
                    href={`/category/${active.slug}`}
                    className={styles.detailHeading}
                    onClick={() => setOpen(false)}
                  >
                    {active.name}
                    {active.nameAr && <span className={styles.detailHeadingAr}>{active.nameAr}</span>}
                  </Link>
                  <Link
                    href={`/category/${active.slug}`}
                    className={styles.viewAllSmall}
                    onClick={() => setOpen(false)}
                  >
                    View All →
                  </Link>
                </div>

                {active.children.length > 0 ? (
                  <div className={styles.columns}>
                    {active.children.map((sub) => (
                      <div key={sub.id} className={styles.column}>
                        <Link
                          href={`/category/${sub.slug}`}
                          className={styles.columnHeading}
                          onClick={() => setOpen(false)}
                        >
                          {sub.icon && <span className={styles.columnIcon}>{sub.icon}</span>}
                          {sub.name}
                        </Link>
                        {sub.children.length > 0 && (
                          <ul className={styles.columnList}>
                            {sub.children.map((child) => (
                              <li key={child.id}>
                                <Link
                                  href={`/category/${child.slug}`}
                                  className={styles.columnLink}
                                  onClick={() => setOpen(false)}
                                >
                                  {child.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noSub}>Browse all {active.name} products.</p>
                )}
              </div>

              {promo && (
                <Link href={promo.href} className={styles.promo} onClick={() => setOpen(false)}>
                  <span className={styles.promoTitle}>{promo.title}</span>
                  <span className={styles.promoText}>{promo.text}</span>
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
