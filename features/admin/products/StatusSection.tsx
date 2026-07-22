import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { ProductFormValues } from "@/features/admin/products/types";
import type { ProductStatus } from "@/types/domain";

interface StatusSectionProps {
  form: ProductFormValues;
  setForm: React.Dispatch<React.SetStateAction<ProductFormValues>>;
}

const FLAGS: { key: "featured" | "bestSeller" | "isNew"; label: string; hint: string }[] = [
  { key: "featured", label: "Featured", hint: "Highlighted in featured sections on the homepage." },
  { key: "bestSeller", label: "Best Seller", hint: "Shown with a best-seller badge." },
  { key: "isNew", label: "New Arrival", hint: "Shown with a new-arrival badge." },
];

export default function StatusSection({ form, setForm }: StatusSectionProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Lifecycle Status</Label>
        <Select
          value={form.status}
          onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as ProductStatus }))}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DRAFT">Draft — hidden from the storefront</SelectItem>
            <SelectItem value="PUBLISHED">Active — visible on the storefront</SelectItem>
            <SelectItem value="ARCHIVED">Archived — hidden, kept for records</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="divide-y pt-6">
          {FLAGS.map(({ key, label, hint }) => (
            <div key={key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
              <Switch
                checked={form[key]}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, [key]: checked }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
