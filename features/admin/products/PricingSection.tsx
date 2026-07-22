import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { ProductFormValues } from "@/features/admin/products/types";

interface PricingSectionProps {
  form: ProductFormValues;
  setForm: React.Dispatch<React.SetStateAction<ProductFormValues>>;
}

function calcMargin(cost: string, price: string): string | null {
  const c = Number(cost);
  const p = Number(price);
  if (!c || !p) return null;
  return (((p - c) / p) * 100).toFixed(1);
}

function calcDiscountPct(price: string, compareAt: string): string | null {
  const p = Number(price);
  const c = Number(compareAt);
  if (!c || !p || c <= p) return null;
  return (((c - p) / c) * 100).toFixed(0);
}

export default function PricingSection({ form, setForm }: PricingSectionProps) {
  const margin = calcMargin(form.costPrice, form.price);
  const discount = calcDiscountPct(form.price, form.originalPrice);

  const set = (field: keyof ProductFormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Selling Price (USD)</Label>
          <Input id="price" type="number" step="0.01" min="0" value={form.price} onChange={set("price")} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="originalPrice">Compare-at Price</Label>
          <Input
            id="originalPrice"
            type="number"
            step="0.01"
            min="0"
            value={form.originalPrice}
            onChange={set("originalPrice")}
            placeholder="Optional — shown struck-through"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="costPrice">Cost Price</Label>
          <Input
            id="costPrice"
            type="number"
            step="0.01"
            min="0"
            value={form.costPrice}
            onChange={set("costPrice")}
            placeholder="Internal only — never shown to customers"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxRate">Tax Rate (%)</Label>
          <Input id="taxRate" type="number" step="0.01" min="0" value={form.taxRate} onChange={set("taxRate")} />
        </div>
      </div>

      {(margin || discount) && (
        <Card className="bg-muted/40">
          <CardContent className="flex gap-6 pt-6 text-sm">
            {margin && (
              <div>
                <span className="text-muted-foreground">Margin: </span>
                <span className="font-semibold">{margin}%</span>
              </div>
            )}
            {discount && (
              <div>
                <span className="text-muted-foreground">Discount vs. compare-at: </span>
                <span className="font-semibold">{discount}% OFF</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
