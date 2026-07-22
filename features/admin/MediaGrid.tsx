import NextImage from "next/image";
import { X, Eye } from "lucide-react";
import { getThumbnailUrl } from "@/lib/cloudinaryTransform";
import { formatBytes } from "@/features/admin/mediaFormat";
import type { PlainMediaAsset } from "@/types/domain";

interface MediaGridProps {
  assets: PlainMediaAsset[];
  onSelect?: (asset: PlainMediaAsset) => void;
  onPreview?: (asset: PlainMediaAsset) => void;
  onDelete?: (asset: PlainMediaAsset) => void;
  selectedId?: string | null;
}

export default function MediaGrid({ assets, onSelect, onPreview, onDelete, selectedId }: MediaGridProps) {
  if (assets.length === 0) {
    return <p className="p-8 text-center text-sm text-muted-foreground">No images yet. Upload one to get started.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {assets.map((asset) => {
        const thumb = getThumbnailUrl(asset.url, 240);
        return (
          <div
            key={asset.id}
            className={`group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md ${
              selectedId === asset.id ? "ring-2 ring-primary" : ""
            }`}
          >
            <button
              type="button"
              className="block w-full cursor-pointer"
              onClick={() => (onSelect ? onSelect(asset) : onPreview?.(asset))}
            >
              <div className="relative aspect-square bg-muted">
                <NextImage src={thumb} alt={asset.filename} fill sizes="240px" className="object-cover" />
              </div>
            </button>

            <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {onPreview && (
                <button
                  type="button"
                  className="flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  title="Preview"
                  aria-label={`Preview ${asset.filename}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(asset);
                  }}
                >
                  <Eye className="size-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  className="flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-destructive"
                  title="Delete"
                  aria-label={`Delete ${asset.filename}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(asset);
                  }}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="p-2">
              <p className="truncate text-xs font-medium" title={asset.filename}>
                {asset.filename}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ""}
                {formatBytes(asset.bytes)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
