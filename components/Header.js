import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import MegaMenu from "@/features/navigation/MegaMenu";
import MobileCategoryMenu from "@/features/navigation/MobileCategoryMenu";
import SearchBar from "@/features/navigation/SearchBar";
import UserMenu from "@/features/navigation/UserMenu";
import MiniCart from "@/features/navigation/MiniCart";
import NotificationBell from "@/features/navigation/NotificationBell";
import TopBar from "@/components/TopBar";
import { HeartIcon, CompareIcon } from "@/components/icons";
import styles from "@/styles/Header.module.css";

// "Shop" opens the mega menu (built from the live category tree); Household
// and Prefab & Projects are called out as their own top-level links per the
// nav spec, everything else stays reachable only through Shop.
const HOME_LINK = { label: "Home", href: "/" };
const NAV_LINKS = [
  { label: "Household", href: "/category/household" },
  { label: "Prefab & Projects", href: "/category/prefab-projects" },
  { label: "Deals", href: "/#flash-deals" },
  { label: "Brands", href: "/brands" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

export default function Header() {
  const { wishlist, compareList } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryTree, setCategoryTree] = useState([]);
  const [categoryTreeLoading, setCategoryTreeLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  // rAF-throttled so the listener never runs more than once per frame —
  // toggling a boolean class is cheap, but the scroll event itself can fire
  // far faster than the browser can paint.
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategoryTree(data.tree || []))
      .catch(() => {})
      .finally(() => setCategoryTreeLoading(false));
  }, []);

  // Body scroll is locked while the mobile drawer is open so the page
  // behind it can't scroll on iOS Safari (which otherwise rubber-bands the
  // underlying content even with the backdrop in place).
  useEffect(() => {
    if (!menuOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <TopBar />

      <div className={`${styles.stickyWrap} ${scrolled ? styles.stickyWrapScrolled : ""}`}>
        <div className={styles.mainBar}>
          <button
            className={styles.menuToggle}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>

          <Link href="/" className={styles.logo}>
            <span className={styles.logoBadge}>DIS</span>
            <span className={styles.logoText}>Shop</span>
          </Link>

          <SearchBar />

          <nav className={styles.actions}>
            <UserMenu />
            {compareList.length > 0 && (
              <Link href="/compare" className={styles.actionLink}>
                <span className={styles.actionIcon}>
                  <CompareIcon />
                  <span className={styles.badge}>{compareList.length}</span>
                </span>
                <span className={styles.actionText}>Compare</span>
              </Link>
            )}
            <Link href="/wishlist" className={styles.actionLink}>
              <span className={styles.actionIcon}>
                <HeartIcon filled={wishlist.length > 0} />
                {wishlist.length > 0 && (
                  <span className={styles.badge}>{wishlist.length}</span>
                )}
              </span>
              <span className={styles.actionText}>Wishlist</span>
            </Link>
            <NotificationBell />
            <MiniCart />
          </nav>
        </div>

        <nav className={styles.navBar}>
          <Link href={HOME_LINK.href} className={styles.navLink}>
            {HOME_LINK.label}
          </Link>
          <MegaMenu tree={categoryTree} loading={categoryTreeLoading} />
          <div className={styles.navLinks}>
            {NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </div>
          <Link href="/#special-offers" className={styles.specialBtn}>
            🔥 Special Offer
          </Link>
        </nav>
      </div>

      <div
        className={`${styles.backdrop} ${menuOpen ? styles.backdropOpen : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <div className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ""}`}>
        <div className={styles.drawerHeader}>
          <span className={styles.logo}>
            <span className={styles.logoBadge}>DIS</span>
            <span className={styles.logoText}>Shop</span>
          </span>
          <button
            className={styles.drawerClose}
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className={styles.drawerLinks}>
          <Link
            href={HOME_LINK.href}
            className={styles.drawerLink}
            style={{ "--drawer-i": 0 }}
            onClick={() => setMenuOpen(false)}
          >
            {HOME_LINK.label}
          </Link>
          <Link href="/shop" className={styles.drawerLink} style={{ "--drawer-i": 1 }} onClick={() => setMenuOpen(false)}>
            Shop
          </Link>
          <div className={styles.drawerAnimItem} style={{ "--drawer-i": 2 }}>
            <MobileCategoryMenu
              tree={categoryTree}
              loading={categoryTreeLoading}
              onNavigate={() => setMenuOpen(false)}
            />
          </div>
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.label}
              href={link.href}
              className={styles.drawerLink}
              style={{ "--drawer-i": i + 3 }}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <Link
          href="/#special-offers"
          className={styles.specialBtn}
          onClick={() => setMenuOpen(false)}
        >
          🔥 Special Offer
        </Link>
      </div>
    </header>
  );
}
