import { useEffect, useState } from "react";
import AdminLayout from "@/features/admin/AdminLayout";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { displayStatus } from "@/data/orderStatuses";
import styles from "@/styles/AdminOrders.module.css";
import adminStyles from "@/styles/Admin.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_DELIVERIES);
  if (guard.redirect) return guard;
  return {
    props: {
      email: guard.session.email,
      role: guard.session.role,
      dbConfigured: isDbConfigured(),
    },
  };
}

// Operational subset — a delivery run only ever moves an order through
// these states, never back into sales/confirmation stages.
const DELIVERY_STATUSES = ["Ready for Delivery", "Out for Delivery", "Delivered", "Returned"];

const STATUS_FILTERS = ["", ...DELIVERY_STATUSES];

export default function AdminDeliveriesPage({ email, role, dbConfigured }) {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(dbConfigured);
  const pageSize = 20;

  const load = () => {
    const params = new URLSearchParams({
      status: statusFilter,
      page: String(page),
      pageSize: String(pageSize),
    });
    fetch(`/api/admin/deliveries?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.rows || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!dbConfigured) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbConfigured, statusFilter, page]);

  const handleStatusChange = async (order, status) => {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    await fetch(`/api/admin/deliveries/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminLayout title="Deliveries" email={email} role={role}>
      <div className={styles.main}>
        <h2 className={adminStyles.heading}>Deliveries</h2>

        {!dbConfigured && (
          <p className={styles.note}>
            No database connected yet. Deliveries will appear here once{" "}
            <code>DATABASE_URL</code> is set.
          </p>
        )}

        <div className={styles.toolbar}>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s ? s : "All Delivery Statuses"}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : orders.length === 0 ? (
          <p className={styles.empty}>No orders match this view.</p>
        ) : (
          <>
            <div className={adminStyles.tableWrap}>
              <table className={adminStyles.table}>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Delivery Area</th>
                    <th>Status</th>
                    <th>Map</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td data-label="Order #">{o.orderNumber}</td>
                      <td data-label="Customer">{o.customerName}</td>
                      <td data-label="Phone">{o.phone || "-"}</td>
                      <td data-label="Delivery Area">{o.deliveryZone || "-"}</td>
                      <td data-label="Status">
                        <select
                          className={styles.statusSelect}
                          value={o.status}
                          onChange={(e) => handleStatusChange(o, e.target.value)}
                        >
                          {!DELIVERY_STATUSES.includes(o.status) && (
                            <option value={o.status}>{displayStatus(o.status)}</option>
                          )}
                          {DELIVERY_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td data-label="Map">
                        {o.deliveryMapUrl ? (
                          <a
                            className={styles.viewBtn}
                            href={o.deliveryMapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td data-label="Date">{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ← Prev
                </button>
                <span>
                  Page {page} of {totalPages} ({total} orders)
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
