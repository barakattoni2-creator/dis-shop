import Link from "next/link";
import { formatPrice, formatCurrency } from "@/utils/format";
import { ORDER_STATUSES, PAYMENT_STATUSES, displayStatus } from "@/data/orderStatuses";
import styles from "@/styles/AdminOrders.module.css";
import adminStyles from "@/styles/Admin.module.css";

export default function OrdersListTable({
  orders,
  rate,
  page,
  pageSize,
  total,
  onPageChange,
  onStatusChange,
  onPaymentStatusChange,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (orders.length === 0) {
    return <p className={styles.empty}>No orders match these filters.</p>;
  }

  return (
    <>
      <div className={adminStyles.tableWrap}>
        <table className={adminStyles.table}>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Delivery Area</th>
              <th>Total (USD)</th>
              <th>Total (SSP)</th>
              <th>Payment</th>
              <th>Order Status</th>
              <th>Payment Status</th>
              <th>Date</th>
              <th className={styles.noPrint}></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td data-label="Order #">{o.orderNumber}</td>
                <td data-label="Customer">{o.customerName}</td>
                <td data-label="Phone">{o.phone || "-"}</td>
                <td data-label="Delivery Area">{o.deliveryZone || "-"}</td>
                <td data-label="Total (USD)">{formatPrice(o.total)}</td>
                <td data-label="Total (SSP)">{formatCurrency(o.total, "SSP", rate)}</td>
                <td data-label="Payment">{o.payment || "-"}</td>
                <td data-label="Order Status">
                  <select
                    className={`${styles.statusSelect} ${styles.noPrint}`}
                    value={o.status}
                    onChange={(e) => onStatusChange(o, e.target.value)}
                  >
                    {!ORDER_STATUSES.includes(o.status) && (
                      <option value={o.status}>{displayStatus(o.status)}</option>
                    )}
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td data-label="Payment Status">
                  <select
                    className={`${styles.statusSelect} ${styles.noPrint}`}
                    value={o.paymentStatus}
                    onChange={(e) => onPaymentStatusChange(o, e.target.value)}
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td data-label="Date">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className={`${adminStyles.actionsCell} ${styles.noPrint}`}>
                  <Link href={`/admin/orders/${o.id}`} className={styles.viewBtn}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={`${styles.pagination} ${styles.noPrint}`}>
          <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            ← Prev
          </button>
          <span>
            Page {page} of {totalPages} ({total} orders)
          </span>
          <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Next →
          </button>
        </div>
      )}
    </>
  );
}
