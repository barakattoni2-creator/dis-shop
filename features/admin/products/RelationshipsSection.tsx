import { useMemo, useState } from "react";
import NextImage from "next/image";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProductFormValues } from "@/features/admin/products/types";
import type { PlainProduct } from "@/types/domain";

interface PickerProps {
  label: string;
  hint: string;
  ids: string[];
  onChange: (ids: string[]) => void;
  allProducts: PlainProduct[];
  excludeId?: string;
}

function ProductMultiPicker({ label, hint, ids, onChange, allProducts, excludeId }: PickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(allProducts.map((p) => [p.id, p])), [allProducts]);
  const selected = ids.map((id) => byId.get(id)).filter((p): p is PlainProduct => Boolean(p));

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return allProducts
      .filter((p) => p.id !== excludeId && !ids.includes(p.id))
      .filter((p) => !term || p.name.toLowerCase().includes(term) || p.sku?.toLowerCase().includes(term))
      .slice(0, 50);
  }, [allProducts, query, ids, excludeId]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>

      {selected.length > 0 && (
        <ul className="space-y-1.5">
          {selected.map((p) => (
            <li key={p.id} className="flex items-center gap-2 rounded-md border p-1.5 pr-2">
              <div className="relative size-8 shrink-0 overflow-hidden rounded bg-muted">
                {p.imageUrl && <NextImage src={p.imageUrl} alt="" fill sizes="32px" className="object-cover" />}
              </div>
              <span className="flex-1 truncate text-sm">{p.name}</span>
              <button
                type="button"
                onClick={() => onChange(ids.filter((id) => id !== p.id))}
                aria-label={`Remove ${p.name}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Search className="size-3.5" /> Add products
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-2">
            <Input
              autoFocus
              placeholder="Search products…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ScrollArea className="h-64">
            <div className="p-2 pt-0">
              {results.length === 0 && (
                <p className="p-2 text-sm text-muted-foreground">No matching products.</p>
              )}
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md p-1.5 text-left hover:bg-accent"
                  onClick={() => {
                    onChange([...ids, p.id]);
                    setQuery("");
                  }}
                >
                  <div className="relative size-8 shrink-0 overflow-hidden rounded bg-muted">
                    {p.imageUrl && <NextImage src={p.imageUrl} alt="" fill sizes="32px" className="object-cover" />}
                  </div>
                  <span className="flex-1 truncate text-sm">{p.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface RelationshipsSectionProps {
  form: ProductFormValues;
  setForm: React.Dispatch<React.SetStateAction<ProductFormValues>>;
  allProducts: PlainProduct[];
  excludeId?: string;
}

export default function RelationshipsSection({ form, setForm, allProducts, excludeId }: RelationshipsSectionProps) {
  return (
    <div className="space-y-6">
      <ProductMultiPicker
        label="Related Products"
        hint="Shown as “You may also like” suggestions."
        ids={form.relatedProductIds}
        onChange={(ids) => setForm((prev) => ({ ...prev, relatedProductIds: ids }))}
        allProducts={allProducts}
        excludeId={excludeId}
      />
      <ProductMultiPicker
        label="Cross-Sell"
        hint="Suggested add-ons shown at checkout/cart alongside this product."
        ids={form.crossSellProductIds}
        onChange={(ids) => setForm((prev) => ({ ...prev, crossSellProductIds: ids }))}
        allProducts={allProducts}
        excludeId={excludeId}
      />
      <ProductMultiPicker
        label="Up-Sell"
        hint="Higher-value alternatives suggested on this product's page."
        ids={form.upSellProductIds}
        onChange={(ids) => setForm((prev) => ({ ...prev, upSellProductIds: ids }))}
        allProducts={allProducts}
        excludeId={excludeId}
      />
    </div>
  );
}
