import { useEffect, useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { Package, FolderTree, ShoppingCart, Users, AlertTriangle, ArrowRight } from "lucide-react";
import AdminLayout from "@/features/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import type { AdminRole, PlainProduct } from "@/types/domain";

interface AdminDashboardPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminDashboardPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.VIEW_DASHBOARD);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

interface Stats {
  products: number;
  categories: number;
  orders: number;
  customers: number;
}

interface OrderSummary {
  newOrders: number;
  confirmed: number;
  preparing: number;
  outForDelivery: number;
  deliveredToday: number;
  totalSalesToday: number;
}

const QUICK_LINKS = [
  { href: "/admin/products", label: "Manage Products", icon: Package },
  { href: "/admin/orders", label: "View Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "View Customers", icon: Users },
  { href: "/admin/categories", label: "Manage Categories", icon: FolderTree },
];

export default function AdminDashboardPage({ email, role, dbConfigured }: AdminDashboardPageProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [lowStock, setLowStock] = useState<PlainProduct[]>([]);

  useEffect(() => {
    if (!dbConfigured) return;
    Promise.all([
      fetch("/api/admin/products?pageSize=200").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/admin/orders").then((r) => r.json()),
      fetch("/api/admin/customers").then((r) => r.json()),
    ]).then(([products, categories, orders, customers]) => {
      setStats({
        products: products.total ?? 0,
        categories: categories.categories?.length ?? 0,
        orders: orders.total ?? orders.orders?.length ?? 0,
        customers: customers.customers?.length ?? 0,
      });
      setLowStock(
        (products.rows || [])
          .filter((p: PlainProduct) => p.lowStockThreshold !== null && p.stock <= p.lowStockThreshold)
          .slice(0, 6)
      );
    });
    fetch("/api/admin/orders/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setSummary(data.summary))
      .catch(() => {});
  }, [dbConfigured]);

  const statCards = [
    { label: "Products", value: stats?.products, icon: Package, href: "/admin/products" },
    { label: "Categories", value: stats?.categories, icon: FolderTree, href: "/admin/categories" },
    { label: "Orders", value: stats?.orders, icon: ShoppingCart, href: "/admin/orders" },
    { label: "Customers", value: stats?.customers, icon: Users, href: "/admin/customers" },
  ];

  return (
    <AdminLayout title="Dashboard" email={email} role={role}>
      <div className="shadcn-root space-y-6">
        {!dbConfigured && (
          <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            No database connected yet. Set <code>DATABASE_URL</code> in <code>.env.local</code> (see{" "}
            <code>.env.example</code>) to enable Products, Categories, Brands, Orders and Customers
            management.
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, href }) => (
            <Link key={label} href={href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="text-2xl font-bold">{value ?? "—"}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </div>
                  <Icon className="size-8 text-primary/40" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today at a Glance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <SummaryStat label="New Orders" value={summary.newOrders} />
                <SummaryStat label="Confirmed" value={summary.confirmed} />
                <SummaryStat label="Preparing" value={summary.preparing} />
                <SummaryStat label="Out for Delivery" value={summary.outForDelivery} />
                <SummaryStat label="Delivered Today" value={summary.deliveredToday} />
                <SummaryStat label="Sales Today" value={`$${summary.totalSalesToday.toFixed(2)}`} />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
                <Button key={href} variant="outline" className="justify-start" asChild>
                  <Link href={href}>
                    <Icon className="size-4" /> {label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Low Stock</CardTitle>
              {lowStock.length > 0 && <Badge variant="warning">{lowStock.length}</Badge>}
            </CardHeader>
            <CardContent>
              {lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing below its low-stock threshold.</p>
              ) : (
                <ul className="space-y-2">
                  {lowStock.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="flex items-center justify-between rounded-md p-1.5 text-sm hover:bg-accent"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <AlertTriangle className="size-3.5 shrink-0 text-warning" />
                          {p.name}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {p.stock} left <ArrowRight className="ml-1 inline size-3" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function SummaryStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
