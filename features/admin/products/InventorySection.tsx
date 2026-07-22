import { AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { ProductFormValues } from "@/features/admin/products/types";

interface InventorySectionProps {
  form: ProductFormValues;
  setForm: React.Dispatch<React.SetStateAction<ProductFormValues>>;
}

export default function InventorySection({ form, setForm }: InventorySectionProps) {
  const set = (field: keyof ProductFormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const lowStock =
    form.lowStockThreshold !== "" && Number(form.stock) <= Number(form.lowStockThreshold);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" value={form.sku} onChange={set("sku")} placeholder="e.g. GRE-1.5HP-AC" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="barcode">Barcode</Label>
          <Input id="barcode" value={form.barcode} onChange={set("barcode")} placeholder="EAN / UPC" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Quantity in Stock</Label>
          <Input id="stock" type="number" min="0" value={form.stock} onChange={set("stock")} />
          {lowStock && (
            <p className="flex items-center gap-1 text-xs font-medium text-warning-foreground">
              <AlertTriangle className="size-3.5 text-warning" /> At or below the low-stock threshold
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
          <Input
            id="lowStockThreshold"
            type="number"
            min="0"
            value={form.lowStockThreshold}
            onChange={set("lowStockThreshold")}
            placeholder="e.g. 5"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="warehouse">Warehouse</Label>
          <Input id="warehouse" value={form.warehouse} onChange={set("warehouse")} placeholder="e.g. Juba Main Warehouse" />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Shipping</p>
        <div className="grid gap-5 sm:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="weightKg">Weight (kg)</Label>
            <Input id="weightKg" type="number" step="0.01" min="0" value={form.weightKg} onChange={set("weightKg")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lengthCm">Length (cm)</Label>
            <Input id="lengthCm" type="number" step="0.1" min="0" value={form.lengthCm} onChange={set("lengthCm")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="widthCm">Width (cm)</Label>
            <Input id="widthCm" type="number" step="0.1" min="0" value={form.widthCm} onChange={set("widthCm")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heightCm">Height (cm)</Label>
            <Input id="heightCm" type="number" step="0.1" min="0" value={form.heightCm} onChange={set("heightCm")} />
          </div>
        </div>
      </div>
    </div>
  );
}
