import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { Plus, Download, Printer } from "lucide-react";
import AdminLayout from "@/features/admin/AdminLayout";
import OrdersSummaryCards from "@/features/admin/orders/OrdersSummaryCards";
import OrdersFilters from "@/features/admin/orders/OrdersFilters";
import OrdersListTable from "@/features/admin/orders/OrdersListTable";
import OrderForm from "@/features/admin/OrderForm";
import { Button } from "@/components/ui/button";
import { useExchangeRate } from "@/components/CompanyInfoProvider";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import type { AdminRole } from "@/types/domain";

interface AdminOrdersPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminOrdersPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_ORDERS);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

const EMPTY_FILTERS = {
  q: "",
  status: "",
  payment: "",
  paymentStatus: "",
  dateFrom: "",
  dateTo: "",
};

const PAGE_SIZE = 20;

export default function AdminOrdersPage({ email, role, dbConfigured }: AdminOrdersPageProps) {
  const { rate } = useExchangeRate();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(dbConfigured);
  const [summary, setSummary] = useState<any>(null);
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

  const handleFiltersChange = (next: typeof EMPTY_FILTERS) => {
    setPage(1);
    setFilters(next);
  };

  const handleClearFilters = () => {
    setPage(1);
    setFilters(EMPTY_FILTERS);
  };

  const patchOrder = async (order: any, patch: Record<string, unknown>) => {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...patch } : o)));
    await fetch(`/api/admin/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    loadSummary();
  };

  const handleStatusChange = (order: any, status: string) => patchOrder(order, { status });
  const handlePaymentStatusChange = (order: any, paymentStatus: string) => patchOrder(order, { paymentStatus });

  const handleAddOrder = async (data: Record<string, unknown>) => {
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
      setError((err as Error).message);
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
      <div className="shadcn-root">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold">Orders</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/admin/orders/export?${exportParams}`}>
                <Download className="size-4" /> Export CSV
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-4" /> Print List
            </Button>
            <Button size="sm" onClick={() => setShowAddForm(true)} disabled={!dbConfigured}>
              <Plus className="size-4" /> Add Order
            </Button>
          </div>
        </div>

        {!dbConfigured && (
          <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            No database connected yet. Orders placed at checkout are only saved to each customer&apos;s own
            browser until <code>DATABASE_URL</code> is set.
          </p>
        )}
        {error && <p className="mb-4 text-sm font-medium text-destructive">{error}</p>}

        <OrdersSummaryCards summary={summary} loading={summaryLoading} />
        <OrdersFilters filters={filters} onChange={handleFiltersChange} onClear={handleClearFilters} />

        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
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
          // Plain overlay (not the Radix Dialog primitive) on purpose:
          // OrderForm is still a CSS-Modules component whose dark-mode
          // colors come from .admin-shell-scoped tokens (styles/globals.css)
          // — Radix's Dialog portals to document.body, outside .admin-shell,
          // which would silently break its dark-mode styling.
          <div
            className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/40 p-8"
            onClick={() => setShowAddForm(false)}
          >
            <div
              className="w-full max-w-lg rounded-lg border bg-card p-6 text-card-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-lg font-semibold">Add Order</h2>
              <OrderForm initial={null} onSubmit={handleAddOrder} onCancel={() => setShowAddForm(false)} />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
