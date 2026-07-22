import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import MegaMenu from "@/features/navigation/MegaMenu";
import MobileCategoryMenu from "@/features/navigation/MobileCategoryMenu";
import TopBar from "@/components/TopBar";
import { SearchIcon, CartIcon, HeartIcon, UserIcon, CompareIcon } from "@/components/icons";
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
  const { cartCount, wishlist, user, compareList } = useStore();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [popularTerms, setPopularTerms] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
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
    fetch("/api/search-config")
      .then((r) => r.json())
      .then((data) => setPopularTerms(data.popularSearches || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategoryTree(data.tree || []))
      .catch(() => {})
      .finally(() => setCategoryTreeLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
    setMenuOpen(false);
  };

  const handlePopularTermClick = (term) => {
    router.push(`/search?q=${encodeURIComponent(term)}`);
    setQuery(term);
    setSearchFocused(false);
    setMenuOpen(false);
  };

  const showSuggestions = searchFocused && !query.trim() && popularTerms.length > 0;

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

          <div className={styles.searchWrap}>
            <form className={styles.searchForm} onSubmit={handleSearch}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search products, brands and more"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                aria-label="Search"
              />
              <button type="submit" className={styles.searchButton} aria-label="Search">
                <SearchIcon />
              </button>
            </form>
            {showSuggestions && (
              <div className={styles.searchDropdown}>
                <span className={styles.searchDropdownLabel}>Popular Searches</span>
                <div className={styles.searchDropdownChips}>
                  {popularTerms.map((term) => (
                    <button
                      key={term}
                      type="button"
                      className={styles.searchDropdownChip}
                      onMouseDown={() => handlePopularTermClick(term)}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <nav className={styles.actions}>
            <Link href={user ? "/dashboard" : "/login"} className={styles.actionLink}>
              <span className={styles.actionIcon}>
                <UserIcon />
              </span>
              <span className={styles.actionText}>
                {user ? `Hi, ${user.name}` : "Sign In"}
              </span>
            </Link>
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
            <Link href="/cart" className={styles.actionLink}>
              <span className={styles.actionIcon}>
                <CartIcon />
                {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
              </span>
              <span className={styles.actionText}>Cart</span>
            </Link>
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
          <Link href={HOME_LINK.href} className={styles.drawerLink} onClick={() => setMenuOpen(false)}>
            {HOME_LINK.label}
          </Link>
          <Link href="/shop" className={styles.drawerLink} onClick={() => setMenuOpen(false)}>
            Shop
          </Link>
          <MobileCategoryMenu
            tree={categoryTree}
            loading={categoryTreeLoading}
            onNavigate={() => setMenuOpen(false)}
          />
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={styles.drawerLink}
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
