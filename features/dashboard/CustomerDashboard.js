import Link from "next/link";
import Price from "@/components/Price";
import styles from "@/styles/Dashboard.module.css";

export default function CustomerDashboard({
  user,
  orders,
  wishlistCount,
  cartCount,
  onLogout,
}) {
  const recentOrders = orders.slice(0, 3);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>Hi, {user.name}</h1>
          <p className={styles.email}>{user.email}</p>
        </div>
        <button className={styles.logoutBtn} onClick={onLogout}>
          Sign Out
        </button>
      </div>

      <div className={styles.statGrid}>
        <Link href="/track-order" className={styles.statCard}>
          <span className={styles.statValue}>{orders.length}</span>
          <span className={styles.statLabel}>Orders</span>
        </Link>
        <Link href="/wishlist" className={styles.statCard}>
          <span className={styles.statValue}>{wishlistCount}</span>
          <span className={styles.statLabel}>Wishlist Items</span>
        </Link>
        <Link href="/cart" className={styles.statCard}>
          <span className={styles.statValue}>{cartCount}</span>
          <span className={styles.statLabel}>Items in Cart</span>
        </Link>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeadingRow}>
          <h2>Recent Orders</h2>
          {orders.length > 0 && <Link href="/track-order">View all →</Link>}
        </div>
        {recentOrders.length === 0 ? (
          <p className={styles.empty}>
            No orders yet. <Link href="/">Start shopping</Link>
          </p>
        ) : (
          <ul className={styles.orderList}>
            {recentOrders.map((order) => (
              <li key={order.id} className={styles.orderRow}>
                <span className={styles.orderId}>{order.id}</span>
                <span>{new Date(order.date).toLocaleDateString()}</span>
                <span className={styles.status}>{order.status}</span>
                <span className={styles.orderTotal}>
                  <Price amount={order.total} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
