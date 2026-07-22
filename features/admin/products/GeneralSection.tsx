import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/features/admin/products/RichTextEditor";
import type { ProductFormValues } from "@/features/admin/products/types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

interface GeneralSectionProps {
  form: ProductFormValues;
  setForm: React.Dispatch<React.SetStateAction<ProductFormValues>>;
  slugTouched: boolean;
  setSlugTouched: (v: boolean) => void;
}

export default function GeneralSection({ form, setForm, slugTouched, setSlugTouched }: GeneralSectionProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => {
            const name = e.target.value;
            setForm((prev) => ({
              ...prev,
              name,
              slug: slugTouched ? prev.slug : slugify(name),
            }));
          }}
          placeholder="e.g. Gree 1.5HP Split Air Conditioner"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
          }}
          placeholder="gree-1-5hp-split-air-conditioner"
        />
        <p className="text-xs text-muted-foreground">Auto-generated from the name unless you edit it directly.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shortDescription">Short Description</Label>
        <Textarea
          id="shortDescription"
          value={form.shortDescription}
          onChange={(e) => setForm((prev) => ({ ...prev, shortDescription: e.target.value }))}
          placeholder="One or two sentences shown in listing cards and search results."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <RichTextEditor
          value={form.description}
          onChange={(html) => setForm((prev) => ({ ...prev, description: html }))}
          placeholder="Full product description…"
        />
      </div>
    </div>
  );
}
