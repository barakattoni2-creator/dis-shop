import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { ROUTE_PERMISSIONS, ROLE_LABELS, hasPermission } from "@/data/adminRoles";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import styles from "@/styles/AdminLayout.module.css";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Products", icon: "📦" },
  { href: "/admin/inventory", label: "Inventory", icon: "📋" },
  { href: "/admin/categories", label: "Categories", icon: "🗂️" },
  { href: "/admin/brands", label: "Brands", icon: "🏷️" },
  { href: "/admin/banners", label: "Banners", icon: "🖼️" },
  { href: "/admin/media", label: "Media Library", icon: "📷" },
  { href: "/admin/homepage-builder", label: "Homepage Builder", icon: "🏠" },
  { href: "/admin/orders", label: "Orders", icon: "🧾" },
  { href: "/admin/deliveries", label: "Deliveries", icon: "🚚" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/reports", label: "Reports", icon: "📈" },
  { href: "/admin/ai", label: "AI Assistants", icon: "🤖" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
  { href: "/admin/odoo", label: "Odoo", icon: "🔗" },
  { href: "/admin/users", label: "Admin Users", icon: "🛡️" },
];

// Mirrors lib/adminAuth.js's SESSION_IDLE_TTL_MS — logs an idle admin out
// client-side instead of leaving them staring at a page that will only
// discover the session expired on their next click.
const IDLE_TIMEOUT_MS = 1000 * 60 * 30;

export default function AdminLayout({ title, email, role, children }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(router.pathname);

  // Close the mobile drawer on every route change. Adjusting state during
  // render (rather than in an effect) avoids an extra cascading render.
  if (router.pathname !== prevPathname) {
    setPrevPathname(router.pathname);
    setMenuOpen(false);
  }

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    hasPermission(role, ROUTE_PERMISSIONS[item.href])
  );

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  useEffect(() => {
    let timer = setTimeout(handleLogout, IDLE_TIMEOUT_MS);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(handleLogout, IDLE_TIMEOUT_MS);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, reset));
    return () => {
      clearTimeout(timer);
      events.forEach((evt) => window.removeEventListener(evt, reset));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Head>
        <title>{title ? `${title} — DIS Admin` : "DIS Admin"}</title>
      </Head>
      <div className={`${styles.shell} admin-shell`}>
        <header className={styles.mobileTopbar}>
          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setMenuOpen(true)}
            aria-label="Open admin menu"
            aria-expanded={menuOpen}
          >
            ☰
          </button>
          <span className={styles.mobileTitle}>{title}</span>
          <ThemeToggle />
          <button
            type="button"
            className={styles.mobileLogoutBtn}
            onClick={handleLogout}
            aria-label="Sign out"
          >
            Sign Out
          </button>
        </header>

        <div
          className={`${styles.backdrop} ${menuOpen ? styles.backdropOpen : ""}`}
          onClick={() => setMenuOpen(false)}
        />

        <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
          <Link href="/admin/dashboard" className={styles.logo}>
            <span className={styles.logoBadge}>DIS</span>
            <span>Admin</span>
          </Link>
          <nav className={styles.nav}>
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${
                  router.pathname === item.href ? styles.navLinkActive : ""
                }`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className={styles.storeLink}>
            ← Back to Store
          </Link>
        </aside>

        <div className={styles.main}>
          <header className={styles.topbar}>
            <h1 className={styles.pageTitle}>{title}</h1>
            <div className={styles.topbarRight}>
              {email && (
                <span className={styles.email}>
                  {email}
                  {role && <span className={styles.roleTag}>{ROLE_LABELS[role] || role}</span>}
                </span>
              )}
              <ThemeToggle />
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          </header>
          <main className={styles.content}>{children}</main>
        </div>
      </div>
    </>
  );
}
