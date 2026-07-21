import { useEffect, useState } from "react";
import AdminLayout from "@/features/admin/AdminLayout";
import OrdersSummaryCards from "@/features/admin/orders/OrdersSummaryCards";
import OrdersFilters from "@/features/admin/orders/OrdersFilters";
import OrdersListTable from "@/features/admin/orders/OrdersListTable";
import OrderForm from "@/features/admin/OrderForm";
import { useExchangeRate } from "@/components/CompanyInfoProvider";
import { requireAdminPage } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import styles from "@/styles/AdminOrders.module.css";
import adminStyles from "@/styles/Admin.module.css";

export async function getServerSideProps({ req, res }) {
  const guard = await requireAdminPage(req, res, PERMISSIONS.MANAGE_ORDERS);
  if (guard.redirect) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
}

const EMPTY_FILTERS = {
  q: "",
  status: "",
  payment: "",
  paymentStatus: "",
  dateFrom: "",
  dateTo: "",
};

const PAGE_SIZE = 20;

export default function AdminOrdersPage({ email, role, dbConfigured }) {
  const { rate } = useExchangeRate();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(dbConfigured);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(dbConfigured);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = () => {
    setLoading(true);
    const params = new URLSearchParams({
      q: filters.q,
      status: filters.status,
      payment: filters.payment,
      paymentStatus: filters.paymentStatus,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.rows || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const loadSummary = () => {
    fetch("/api/admin/orders/summary")
      .then((r) => r.json())
      .then((data) => {
        setSummary(data.summary);
        setSummaryLoading(false);
      })
      .catch(() => setSummaryLoading(false));
  };

  // Debounced so typing in the search box (part of `filters`) doesn't fire
  // a request per keystroke.
  useEffect(() => {
    if (!dbConfigured) return;
    const t = setTimeout(loadOrders, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  useEffect(() => {
    if (!dbConfigured) return;
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltersChange = (next) => {
    setPage(1);
    setFilters(next);
  };

  const handleClearFilters = () => {
    setPage(1);
    setFilters(EMPTY_FILTERS);
  };

  const patchOrder = async (order, patch) => {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...patch } : o)));
    await fetch(`/api/admin/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    loadSummary();
  };

  const handleStatusChange = (order, status) => patchOrder(order, { status });
  const handlePaymentStatusChange = (order, paymentStatus) => patchOrder(order, { paymentStatus });

  const handleAddOrder = async (data) => {
    setError("");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Save failed.");
      setShowAddForm(false);
      loadOrders();
      loadSummary();
    } catch (err) {
      setError(err.message);
    }
  };

  const exportParams = new URLSearchParams({
    q: filters.q,
    status: filters.status,
    payment: filters.payment,
    paymentStatus: filters.paymentStatus,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });

  return (
    <AdminLayout title="Orders" email={email} role={role}>
      <div className={styles.main}>
        <div className={styles.headerRow}>
          <h2 className={adminStyles.heading}>Orders</h2>
          <div className={`${styles.headerActions} ${styles.noPrint}`}>
            <a
              className={adminStyles.editBtn}
              href={`/api/admin/orders/export?${exportParams}`}
            >
              Export CSV
            </a>
            <button type="button" className={adminStyles.editBtn} onClick={() => window.print()}>
              Print List
            </button>
            <button
              className={adminStyles.addBtn}
              onClick={() => setShowAddForm(true)}
              disabled={!dbConfigured}
            >
              + Add Order
            </button>
          </div>
        </div>

        {!dbConfigured && (
          <p className={styles.note}>
            No database connected yet. Orders placed at checkout are only
            saved to each customer&apos;s own browser until{" "}
            <code>DATABASE_URL</code> is set.
          </p>
        )}
        {error && <p className={styles.error}>{error}</p>}

        <OrdersSummaryCards summary={summary} loading={summaryLoading} />
        <OrdersFilters filters={filters} onChange={handleFiltersChange} onClear={handleClearFilters} />

        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : (
          <OrdersListTable
            orders={orders}
            rate={rate}
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            onStatusChange={handleStatusChange}
            onPaymentStatusChange={handlePaymentStatusChange}
          />
        )}

        {showAddForm && (
          <div className={adminStyles.modalOverlay} onClick={() => setShowAddForm(false)}>
            <div className={adminStyles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 className={adminStyles.modalHeading}>Add Order</h2>
              <OrderForm onSubmit={handleAddOrder} onCancel={() => setShowAddForm(false)} />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
