import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { toast } from "sonner";
import { Plus, Search, Upload, Download, Loader2 } from "lucide-react";
import AdminLayout from "@/features/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductsDataTable from "@/features/admin/products/ProductsDataTable";
import { requireAdminPage, type AnyRes } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import type { AdminRole, PlainProduct, ProductStatus } from "@/types/domain";

interface AdminProductsPageProps {
  email: string;
  role: AdminRole;
  dbConfigured: boolean;
}

export const getServerSideProps: GetServerSideProps<AdminProductsPageProps> = async ({ req, res }) => {
  const guard = await requireAdminPage(req, res as unknown as AnyRes, PERMISSIONS.MANAGE_PRODUCTS);
  if ("redirect" in guard) return guard;
  return {
    props: { email: guard.session.email, role: guard.session.role, dbConfigured: isDbConfigured() },
  };
};

const PAGE_SIZE = 25;

export default function AdminProductsPage({ email, role, dbConfigured }: AdminProductsPageProps) {
  const router = useRouter();
  const [products, setProducts] = useState<PlainProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ProductStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(dbConfigured);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [importing, setImporting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const reload = () => {
    if (!dbConfigured) return;
    setLoading(true);
    const params = new URLSearchParams({
      q,
      status,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    fetch(`/api/admin/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.rows || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!dbConfigured) return;
    const t = setTimeout(reload, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbConfigured, q, status, page]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const allSelected = products.length > 0 && products.every((p) => prev.has(p.id));
      if (allSelected) return new Set();
      return new Set(products.map((p) => p.id));
    });
  };

  const runBulk = async (action: "publish" | "draft" | "archive" | "delete") => {
    if (selected.size === 0) return;
    if (action === "delete" && !window.confirm(`Delete ${selected.size} product(s)? This can't be undone.`)) {
      return;
    }
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected], action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk action failed.");
      toast.success(`${action} applied to ${data.count} product(s).`);
      setSelected(new Set());
      reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBulkBusy(false);
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams({ q, status });
    window.open(`/api/admin/products/export?${params.toString()}`, "_blank");
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed.");
      toast.success(`Imported: ${data.created} created, ${data.updated} updated${data.errors.length ? `, ${data.errors.length} errors` : ""}.`);
      if (data.errors.length) {
        console.warn("Import errors:", data.errors);
      }
      reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminLayout title="Products" email={email} role={role}>
      <div className="shadcn-root">
        {!dbConfigured && (
          <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            No database connected yet. Set <code>DATABASE_URL</code> in <code>.env.local</code> to manage
            products.
          </p>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold">Products</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                Import
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  disabled={importing}
                  onChange={(e) => {
                    handleImport(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="size-4" /> Export
            </Button>
            <Button size="sm" onClick={() => router.push("/admin/products/new")} disabled={!dbConfigured}>
              <Plus className="size-4" /> Add Product
            </Button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="Search by name, SKU, or barcode…"
              className="pl-8"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setPage(1);
              setStatus(v as ProductStatus | "ALL");
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="PUBLISHED">Active</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>

          {selected.size > 0 && (
            <div className="ml-auto flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5">
              <span className="text-sm font-medium">{selected.size} selected</span>
              <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => runBulk("publish")}>
                Publish
              </Button>
              <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => runBulk("draft")}>
                Draft
              </Button>
              <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => runBulk("archive")}>
                Archive
              </Button>
              <Button size="sm" variant="outline" className="text-destructive" disabled={bulkBusy} onClick={() => runBulk("delete")}>
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (
            <ProductsDataTable
              products={products}
              selected={selected}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onReload={reload}
            />
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              ← Prev
            </Button>
            <span>
              Page {page} of {totalPages} ({total} products)
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next →
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
