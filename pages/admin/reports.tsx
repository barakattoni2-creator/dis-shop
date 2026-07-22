import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { DollarSign, ShoppingCart, Users, Package, TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import AdminLayout from "@/features/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import type { AdminRole } from "@/types/domain";
import type { ReportsData } from "@/services/db/reports";

interface AdminReportsPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminReportsPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.VIEW_FINANCIALS);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

export default function AdminReportsPage({ email, role, dbConfigured }: AdminReportsPageProps) {
  const [days, setDays] = useState("30");
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(dbConfigured);

  useEffect(() => {
    if (!dbConfigured) return;
    fetch(`/api/admin/reports?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dbConfigured, days]);

  const cards = [
    { label: "Revenue", value: data ? `$${data.totals.revenue.toFixed(2)}` : "—", icon: DollarSign },
    { label: "Orders", value: data?.totals.orders ?? "—", icon: ShoppingCart },
    { label: "Avg Order Value", value: data ? `$${data.totals.avgOrderValue.toFixed(2)}` : "—", icon: TrendingUp },
    { label: "Customers", value: data?.totals.customers ?? "—", icon: Users },
    { label: "Products", value: data?.totals.products ?? "—", icon: Package },
  ];

  return (
    <AdminLayout title="Reports" email={email} role={role}>
      <div className="shadcn-root">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold">Reports</h1>
          <Select
            value={days}
            onValueChange={(v) => {
              setLoading(true);
              setDays(v);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!dbConfigured && (
          <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            No database connected yet. Set <code>DATABASE_URL</code> in <code>.env.local</code> to see
            reports.
          </p>
        )}

        <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {cards.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <Icon className="size-6 text-primary/40" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.dailySales}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--dis-blue)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--dis-blue)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    fontSize={12}
                    minTickGap={30}
                  />
                  <YAxis fontSize={12} width={50} />
                  <Tooltip
                    labelFormatter={(v) => new Date(String(v)).toLocaleDateString()}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--dis-blue)" fill="url(#revenueFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              {!data || data.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sales in this period.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty Sold</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topProducts.map((p) => (
                      <TableRow key={p.productId || p.name}>
                        <TableCell className="max-w-48 truncate font-medium">{p.name}</TableCell>
                        <TableCell>{p.qtySold}</TableCell>
                        <TableCell>${p.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {!data || data.statusBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders in this period.</p>
              ) : (
                <ul className="space-y-2">
                  {data.statusBreakdown.map((s) => (
                    <li key={s.status} className="flex items-center justify-between text-sm">
                      <span>{s.status}</span>
                      <Badge variant="secondary">{s.count}</Badge>
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
