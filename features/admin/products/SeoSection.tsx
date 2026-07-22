import { useState } from "react";
import NextImage from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MediaPicker from "@/features/admin/MediaPicker";
import type { ProductFormValues } from "@/features/admin/products/types";
import type { PlainMediaAsset } from "@/types/domain";

interface SeoSectionProps {
  form: ProductFormValues;
  setForm: React.Dispatch<React.SetStateAction<ProductFormValues>>;
}

export default function SeoSection({ form, setForm }: SeoSectionProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const titleLen = form.metaTitle.length;
  const descLen = form.metaDescription.length;

  return (
    <div className="space-y-5">
      <Card className="bg-muted/40">
        <CardContent className="pt-6">
          <p className="text-xs font-medium text-muted-foreground">Search result preview</p>
          <p className="mt-2 truncate text-base text-primary">
            {form.metaTitle || form.name || "Product title"}
          </p>
          <p className="text-xs text-success">disshop.example.com/product/{form.slug || "…"}</p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {form.metaDescription || form.shortDescription || "Meta description preview…"}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="metaTitle">Meta Title</Label>
          <span className="text-xs text-muted-foreground">{titleLen}/60</span>
        </div>
        <Input
          id="metaTitle"
          value={form.metaTitle}
          onChange={(e) => setForm((prev) => ({ ...prev, metaTitle: e.target.value }))}
          maxLength={70}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="metaDescription">Meta Description</Label>
          <span className="text-xs text-muted-foreground">{descLen}/160</span>
        </div>
        <Textarea
          id="metaDescription"
          value={form.metaDescription}
          onChange={(e) => setForm((prev) => ({ ...prev, metaDescription: e.target.value }))}
          rows={3}
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="metaKeywords">Keywords</Label>
        <Input
          id="metaKeywords"
          value={form.metaKeywords}
          onChange={(e) => setForm((prev) => ({ ...prev, metaKeywords: e.target.value }))}
          placeholder="comma, separated, keywords"
        />
      </div>

      <div className="space-y-2">
        <Label>Open Graph Image</Label>
        <p className="text-xs text-muted-foreground">Shown when this product is shared on social media. Falls back to the cover image if unset.</p>
        <div className="flex items-center gap-3">
          {form.ogImage && (
            <div className="relative h-16 w-28 overflow-hidden rounded-md border">
              <NextImage src={form.ogImage} alt="" fill sizes="112px" className="object-cover" />
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              Choose Image
            </Button>
            {form.ogImage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setForm((prev) => ({ ...prev, ogImage: "" }))}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {pickerOpen && (
        <MediaPicker
          onClose={() => setPickerOpen(false)}
          onChoose={(asset: PlainMediaAsset) => {
            setForm((prev) => ({ ...prev, ogImage: asset.url }));
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
