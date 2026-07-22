import { useState } from "react";
import { useRouter } from "next/router";
import NextImage from "next/image";
import { toast } from "sonner";
import { MoreHorizontal, Eye, Pencil, Copy, Archive, Trash2, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProductQuickPreview from "@/features/admin/products/ProductQuickPreview";
import type { PlainProduct } from "@/types/domain";

function StatusBadge({ status }: { status: PlainProduct["status"] }) {
  if (status === "PUBLISHED") return <Badge variant="success">Active</Badge>;
  if (status === "DRAFT") return <Badge variant="secondary">Draft</Badge>;
  return <Badge variant="outline">Archived</Badge>;
}

interface ProductsDataTableProps {
  products: PlainProduct[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onReload: () => void;
}

export default function ProductsDataTable({
  products,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onReload,
}: ProductsDataTableProps) {
  const router = useRouter();
  const [previewProduct, setPreviewProduct] = useState<PlainProduct | null>(null);
  const allSelected = products.length > 0 && products.every((p) => selected.has(p.id));

  const duplicate = async (p: PlainProduct) => {
    try {
      const res = await fetch(`/api/admin/products/${p.id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Duplicate failed.");
      toast.success("Duplicated as a draft.");
      onReload();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const archive = async (p: PlainProduct) => {
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      if (!res.ok) throw new Error("Archive failed.");
      toast.success(`Archived "${p.name}".`);
      onReload();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const remove = async (p: PlainProduct) => {
    if (!window.confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed.");
      toast.success("Product deleted.");
      onReload();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (products.length === 0) {
    return <p className="p-8 text-center text-sm text-muted-foreground">No products match your filters.</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onCheckedChange={onToggleSelectAll} aria-label="Select all" />
            </TableHead>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => {
            const lowStock = p.lowStockThreshold !== null && p.stock <= p.lowStockThreshold;
            return (
              <TableRow key={p.id} data-state={selected.has(p.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(p.id)}
                    onCheckedChange={() => onToggleSelect(p.id)}
                    aria-label={`Select ${p.name}`}
                  />
                </TableCell>
                <TableCell>
                  <button
                    className="flex items-center gap-3 text-left"
                    onClick={() => router.push(`/admin/products/${p.id}`)}
                  >
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                      {p.imageUrl && <NextImage src={p.imageUrl} alt="" fill sizes="40px" className="object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.brand || "—"}</p>
                    </div>
                  </button>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.sku || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.category || "—"}</TableCell>
                <TableCell className="text-sm font-medium">${p.price.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`text-sm ${lowStock ? "font-semibold text-warning-foreground" : ""}`}>
                    {p.stock}
                  </span>
                  {lowStock && <AlertTriangle className="ml-1 inline size-3.5 text-warning" />}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <StatusBadge status={p.status} />
                    {p.featured && <Badge variant="outline">Featured</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Actions for ${p.name}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewProduct(p)}>
                        <Eye className="size-4" /> Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/admin/products/${p.id}`)}>
                        <Pencil className="size-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicate(p)}>
                        <Copy className="size-4" /> Duplicate
                      </DropdownMenuItem>
                      {p.status !== "ARCHIVED" && (
                        <DropdownMenuItem onClick={() => archive(p)}>
                          <Archive className="size-4" /> Archive
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => remove(p)}>
                        <Trash2 className="size-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {previewProduct && <ProductQuickPreview product={previewProduct} onClose={() => setPreviewProduct(null)} />}
    </>
  );
}
