import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/data/orderStatuses";
import styles from "@/styles/AdminOrders.module.css";

const PAYMENT_METHODS = ["Cash on Delivery", "Bank Transfer", "Mobile Money"];

export default function OrdersFilters({ filters, onChange, onClear }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return (
    <div className={`${styles.toolbar} ${styles.noPrint}`}>
      <input
        className={styles.searchInput}
        placeholder="Search order number, customer or phone…"
        value={filters.q}
        onChange={set("q")}
      />
      <select className={styles.select} value={filters.status} onChange={set("status")}>
        <option value="">All Statuses</option>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select className={styles.select} value={filters.payment} onChange={set("payment")}>
        <option value="">All Payment Methods</option>
        {PAYMENT_METHODS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <select className={styles.select} value={filters.paymentStatus} onChange={set("paymentStatus")}>
        <option value="">All Payment Statuses</option>
        {PAYMENT_STATUSES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <input
        type="date"
        className={styles.dateInput}
        value={filters.dateFrom}
        onChange={set("dateFrom")}
        aria-label="From date"
      />
      <input
        type="date"
        className={styles.dateInput}
        value={filters.dateTo}
        onChange={set("dateTo")}
        aria-label="To date"
      />
      <button type="button" className={styles.clearFiltersBtn} onClick={onClear}>
        Clear Filters
      </button>
    </div>
  );
}
