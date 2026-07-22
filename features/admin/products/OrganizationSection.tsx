import { useState } from "react";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductFormValues } from "@/features/admin/products/types";
import type { PlainBrand } from "@/types/domain";

// Narrower than PlainCategory on purpose — fetchCategoriesFlat
// (services/db/categories.ts) returns a union with a static-catalog
// fallback shape when the DB has no categories yet, and this is the only
// slice of either shape the picker actually needs.
export interface CategoryOption {
  id: string;
  slug: string;
  name: string;
  level: number;
}

interface OrganizationSectionProps {
  form: ProductFormValues;
  setForm: React.Dispatch<React.SetStateAction<ProductFormValues>>;
  categories: CategoryOption[];
  brands: PlainBrand[];
}

// Indented by level (1 = Main, 2 = Subcategory, 3 = Child) so the existing
// category tree (Category already supports parent/child — see
// prisma/schema.prisma) doubles as the Category/Subcategory picker without
// a separate subcategory field.
function CategoryOptionLabel(c: CategoryOption) {
  const indent = "—".repeat(c.level - 1);
  return `${indent ? indent + " " : ""}${c.name}`;
}

export default function OrganizationSection({ form, setForm, categories, brands }: OrganizationSectionProps) {
  const [tagInput, setTagInput] = useState("");
  const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name)).sort((a, b) => a.level - b.level);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || form.tags.includes(t)) return;
    setForm((prev) => ({ ...prev, tags: [...prev.tags, t] }));
    setTagInput("");
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category / Subcategory</Label>
          <Select value={form.category} onValueChange={(v) => setForm((prev) => ({ ...prev, category: v }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((c) => (
                <SelectItem key={c.id} value={c.slug}>
                  {CategoryOptionLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Brand</Label>
          <Select
            value={form.brand || "__none"}
            onValueChange={(v) => setForm((prev) => ({ ...prev, brand: v === "__none" ? "" : v }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">No brand</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.name} value={b.name}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Type a tag and press Enter"
          />
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {form.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))}
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
