import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/features/admin/AdminLayout";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import styles from "@/styles/Admin.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.VIEW_DASHBOARD);
  if (guard.redirect) return guard;
  return {
    props: {
      email: guard.session.email,
      role: guard.session.role,
      dbConfigured: isDbConfigured(),
    },
  };
}

export default function AdminDashboardPage({ email, role, dbConfigured }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!dbConfigured) return;
    Promise.all([
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/admin/orders").then((r) => r.json()),
      fetch("/api/admin/customers").then((r) => r.json()),
    ]).then(([products, categories, orders, customers]) => {
      setStats({
        products: products.products?.length ?? 0,
        categories: categories.categories?.length ?? 0,
        orders: orders.total ?? orders.orders?.length ?? 0,
        customers: customers.customers?.length ?? 0,
      });
    });
  }, [dbConfigured]);

  return (
    <AdminLayout title="Dashboard" email={email} role={role}>
      <div className={styles.main}>
        {!dbConfigured && (
          <p className={styles.note}>
            No database connected yet. Set <code>DATABASE_URL</code> in{" "}
            <code>.env.local</code> (see <code>.env.example</code>) to enable
            Products, Categories, Brands, Orders and Customers management.
          </p>
        )}

        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats?.products ?? "—"}</span>
            <span className={styles.statLabel}>Products</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats?.categories ?? "—"}</span>
            <span className={styles.statLabel}>Categories</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats?.orders ?? "—"}</span>
            <span className={styles.statLabel}>Orders</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats?.customers ?? "—"}</span>
            <span className={styles.statLabel}>Customers</span>
          </div>
        </div>

        <div className={styles.quickLinks}>
          <Link href="/admin/products" className={styles.quickLink}>
            Manage Products →
          </Link>
          <Link href="/admin/orders" className={styles.quickLink}>
            View Orders →
          </Link>
          <Link href="/admin/customers" className={styles.quickLink}>
            View Customers →
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
