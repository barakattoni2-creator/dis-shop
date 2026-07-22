import NextImage from "next/image";
import { Star, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProductFormValues } from "@/features/admin/products/types";

interface ProductPreviewProps {
  form: ProductFormValues;
  productId?: string;
}

export default function ProductPreview({ form, productId }: ProductPreviewProps) {
  const price = Number(form.price) || 0;
  const compareAt = Number(form.originalPrice) || 0;
  const discount = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
  const cover = form.images[0] || form.imageUrl;

  return (
    <div className="sticky top-4 space-y-3">
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="relative aspect-square bg-muted">
          {cover ? (
            <NextImage src={cover} alt={form.name} fill sizes="320px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {form.isNew && <Badge>New</Badge>}
            {form.bestSeller && <Badge variant="warning">Best Seller</Badge>}
            {discount > 0 && <Badge variant="destructive">{discount}% OFF</Badge>}
          </div>
          {form.status !== "PUBLISHED" && (
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="bg-background">
                {form.status === "DRAFT" ? "Draft" : "Archived"}
              </Badge>
            </div>
          )}
        </div>
        <div className="space-y-1.5 p-4">
          <p className="line-clamp-2 text-sm font-semibold">{form.name || "Product name"}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3 fill-current text-warning" />
            4.5 <span>·</span> {form.category || "Uncategorized"}
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg font-bold text-primary">${price.toFixed(2)}</span>
            {compareAt > price && (
              <span className="text-sm text-muted-foreground line-through">${compareAt.toFixed(2)}</span>
            )}
          </div>
          {form.shortDescription && (
            <p className="line-clamp-2 pt-1 text-xs text-muted-foreground">{form.shortDescription}</p>
          )}
        </div>
      </div>

      {productId && (
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href={`/product/${productId}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" /> View live page
          </a>
        </Button>
      )}
    </div>
  );
}
