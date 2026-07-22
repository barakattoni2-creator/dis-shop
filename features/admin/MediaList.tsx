import NextImage from "next/image";
import { Eye, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getThumbnailUrl } from "@/lib/cloudinaryTransform";
import { formatBytes } from "@/features/admin/mediaFormat";
import type { PlainMediaAsset } from "@/types/domain";

interface MediaListProps {
  assets: PlainMediaAsset[];
  onSelect?: (asset: PlainMediaAsset) => void;
  onPreview?: (asset: PlainMediaAsset) => void;
  onDelete?: (asset: PlainMediaAsset) => void;
  selectedId?: string | null;
}

export default function MediaList({ assets, onSelect, onPreview, onDelete, selectedId }: MediaListProps) {
  if (assets.length === 0) {
    return <p className="p-8 text-center text-sm text-muted-foreground">No images yet. Upload one to get started.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14" />
            <TableHead>Filename</TableHead>
            <TableHead className="hidden sm:table-cell">Folder</TableHead>
            <TableHead className="hidden md:table-cell">Dimensions</TableHead>
            <TableHead className="hidden sm:table-cell">Size</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => {
            const thumb = getThumbnailUrl(asset.url, 80);
            return (
              <TableRow
                key={asset.id}
                className={`cursor-pointer ${selectedId === asset.id ? "bg-primary/5" : ""}`}
                onClick={() => (onSelect ? onSelect(asset) : onPreview?.(asset))}
              >
                <TableCell>
                  <div className="relative size-9 overflow-hidden rounded-md border bg-muted">
                    <NextImage src={thumb} alt={asset.filename} fill sizes="36px" className="object-cover" />
                  </div>
                </TableCell>
                <TableCell className="max-w-[220px] truncate font-medium" title={asset.filename}>
                  {asset.filename}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{asset.folder}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {asset.width && asset.height ? `${asset.width}×${asset.height}` : "—"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {formatBytes(asset.bytes)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {onPreview && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Preview ${asset.filename}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreview(asset);
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        aria-label={`Delete ${asset.filename}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(asset);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
