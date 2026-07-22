import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { ExternalLink } from "lucide-react";
import AdminLayout from "@/features/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { displayStatus } from "@/data/orderStatuses";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import type { AdminRole } from "@/types/domain";

interface AdminDeliveriesPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminDeliveriesPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_DELIVERIES);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

// Operational subset — a delivery run only ever moves an order through
// these states, never back into sales/confirmation stages.
const DELIVERY_STATUSES = ["Ready for Delivery", "Out for Delivery", "Delivered", "Returned"];
const ALL_VALUE = "__all";

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone?: string;
  deliveryZone?: string;
  status: string;
  deliveryMapUrl?: string;
  createdAt: string;
}

const PAGE_SIZE = 20;

export default function AdminDeliveriesPage({ email, role, dbConfigured }: AdminDeliveriesPageProps) {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(dbConfigured);

  const load = () => {
    const params = new URLSearchParams({ status: statusFilter, page: String(page), pageSize: String(PAGE_SIZE) });
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

  const handleStatusChange = async (order: DeliveryOrder, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    await fetch(`/api/admin/deliveries/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout title="Deliveries" email={email} role={role}>
      <div className="shadcn-root">
        <h1 className="mb-4 text-xl font-bold">Deliveries</h1>

        {!dbConfigured && (
          <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            No database connected yet. Deliveries will appear here once <code>DATABASE_URL</code> is set.
          </p>
        )}

        <Select
          value={statusFilter || ALL_VALUE}
          onValueChange={(v) => {
            setPage(1);
            setStatusFilter(v === ALL_VALUE ? "" : v);
          }}
        >
          <SelectTrigger className="mb-4 w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All Delivery Statuses</SelectItem>
            {DELIVERY_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="rounded-lg border bg-card">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : orders.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No orders match this view.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Delivery Area</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Map</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.orderNumber}</TableCell>
                    <TableCell>{o.customerName}</TableCell>
                    <TableCell className="text-muted-foreground">{o.phone || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{o.deliveryZone || "—"}</TableCell>
                    <TableCell>
                      <Select value={o.status} onValueChange={(v) => handleStatusChange(o, v)}>
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {!DELIVERY_STATUSES.includes(o.status) && (
                            <SelectItem value={o.status}>{displayStatus(o.status)}</SelectItem>
                          )}
                          {DELIVERY_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {o.deliveryMapUrl ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={o.deliveryMapUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-3.5" /> Open
                          </a>
                        </Button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </Button>
            <span>
              Page {page} of {totalPages} ({total} orders)
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
