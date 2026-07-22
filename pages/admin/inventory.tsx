import { useEffect, useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { toast } from "sonner";
import { Search, AlertTriangle } from "lucide-react";
import AdminLayout from "@/features/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import type { AdminRole, PlainProduct } from "@/types/domain";

interface AdminInventoryPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminInventoryPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_PRODUCTS);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

function isLowStock(p: PlainProduct): boolean {
  const threshold = p.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
  return p.stock <= threshold;
}

export default function AdminInventoryPage({ email, role, dbConfigured }: AdminInventoryPageProps) {
  const [products, setProducts] = useState<PlainProduct[]>([]);
  const [loading, setLoading] = useState(dbConfigured);
  const [q, setQ] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const reload = () => {
    fetch("/api/admin/products?pageSize=500")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.rows || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (dbConfigured) reload();
  }, [dbConfigured]);

  const handleStockChange = async (product: PlainProduct, value: string) => {
    const stock = Math.max(0, Number(value) || 0);
    if (stock === product.stock) return;
    setSavingId(product.id);
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, stock } : p)));
    } catch {
      toast.error("Couldn't save that stock level.");
    } finally {
      setSavingId(null);
    }
  };

  const lowStockCount = products.filter(isLowStock).length;
  const filtered = products.filter((p) => {
    if (lowStockOnly && !isLowStock(p)) return false;
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return (
      p.name.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      p.barcode?.toLowerCase().includes(term)
    );
  });

  return (
    <AdminLayout title="Inventory" email={email} role={role}>
      <div className="shadcn-root">
        <h1 className="mb-4 text-xl font-bold">Inventory</h1>

        {!dbConfigured && (
          <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            No database connected yet. Set <code>DATABASE_URL</code> in <code>.env.local</code> to manage
            stock levels.
          </p>
        )}

        {dbConfigured && !loading && (
          <div className="mb-4 grid grid-cols-2 gap-4 sm:max-w-md">
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-muted-foreground">Products</p>
              </CardContent>
            </Card>
            <button type="button" className="text-left" onClick={() => setLowStockOnly((v) => !v)}>
              <Card className={lowStockOnly ? "ring-2 ring-warning" : "hover:shadow-md"}>
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold text-warning-foreground">{lowStockCount}</p>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                </CardContent>
              </Card>
            </button>
          </div>
        )}

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, SKU, or barcode…"
            className="pl-8"
          />
        </div>

        <div className="rounded-lg border bg-card">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No products match.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/products/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.sku || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.category || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.warehouse || "—"}</TableCell>
                    <TableCell>${p.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min="0"
                          className="w-24"
                          defaultValue={p.stock}
                          disabled={savingId === p.id}
                          onBlur={(e) => handleStockChange(p, e.target.value)}
                        />
                        {isLowStock(p) && <AlertTriangle className="size-4 shrink-0 text-warning" />}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
