import { formatPrice } from "@/utils/format";
import styles from "@/styles/AdminOrders.module.css";

const CARDS = [
  { key: "newOrders", label: "New Orders" },
  { key: "confirmed", label: "Confirmed Orders", variant: "Navy" },
  { key: "preparing", label: "Preparing", variant: "Orange" },
  { key: "outForDelivery", label: "Out for Delivery", variant: "Orange" },
  { key: "deliveredToday", label: "Delivered Today", variant: "Green" },
  { key: "totalSalesToday", label: "Total Sales Today", variant: "Green", isMoney: true },
];

export default function OrdersSummaryCards({ summary, loading }) {
  return (
    <div className={`${styles.summaryGrid} ${styles.noPrint}`}>
      {CARDS.map((c) => (
        <div
          key={c.key}
          className={`${styles.summaryCard} ${c.variant ? styles[`summaryCard${c.variant}`] : ""}`}
        >
          <span className={styles.summaryValue}>
            {loading ? "…" : c.isMoney ? formatPrice(summary?.[c.key] || 0) : summary?.[c.key] ?? 0}
          </span>
          <span className={styles.summaryLabel}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}
