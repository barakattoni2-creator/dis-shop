import Link from "next/link";
import Layout from "@/components/Layout";
import { useStore } from "@/context/StoreContext";
import CustomerDashboard from "@/features/dashboard/CustomerDashboard";
import styles from "@/styles/Login.module.css";

export default function DashboardPage() {
  const { user, orders, wishlist, cartCount, logout } = useStore();

  return (
    <Layout
      title="My Dashboard"
      description="Your DIS Shop account, orders and activity."
    >
      {user ? (
        <CustomerDashboard
          user={user}
          orders={orders}
          wishlistCount={wishlist.length}
          cartCount={cartCount}
          onLogout={logout}
        />
      ) : (
        <div className={styles.main}>
          <div className={styles.card}>
            <h1 className={styles.heading}>Sign In Required</h1>
            <p className={styles.subtext}>
              Sign in to view your DIS Shop dashboard.
            </p>
            <Link href="/login" className={styles.submitBtn}>
              Go to Sign In
            </Link>
          </div>
        </div>
      )}
    </Layout>
  );
}
