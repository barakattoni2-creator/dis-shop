import { useState } from "react";
import NextImage from "next/image";
import { GripVertical, Eye, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BannerPreview from "@/features/admin/BannerPreview";
import type { PlainBanner } from "@/types/domain";

type DropZone = "above" | "below" | null;

interface DragState {
  draggingId: string | null;
  overId: string | null;
  overZone: DropZone;
}

function computeStatus(b: PlainBanner): { label: string; variant: "success" | "warning" | "secondary" | "outline" } {
  if (b.status === "DRAFT") return { label: "Draft", variant: "secondary" };
  if (!b.active) return { label: "Disabled", variant: "secondary" };
  const now = Date.now();
  if (b.startDate && new Date(b.startDate).getTime() > now) return { label: "Scheduled", variant: "warning" };
  if (b.endDate && new Date(b.endDate).getTime() < now) return { label: "Expired", variant: "outline" };
  return { label: "Live", variant: "success" };
}

function formatDateRange(b: PlainBanner): string {
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  if (b.startDate && b.endDate) return `${fmt(b.startDate)} – ${fmt(b.endDate)}`;
  if (b.startDate) return `From ${fmt(b.startDate)}`;
  if (b.endDate) return `Until ${fmt(b.endDate)}`;
  return "Always";
}

interface BannerRowProps {
  banner: PlainBanner;
  onEdit: (b: PlainBanner) => void;
  onDelete: (b: PlainBanner) => void;
  onToggleActive: (b: PlainBanner) => void;
  onPreview: (b: PlainBanner) => void;
  dragState: DragState;
  setDragState: React.Dispatch<React.SetStateAction<DragState>>;
  onReorder: (draggedId: string, target: PlainBanner, zone: "above" | "below") => void;
}

function BannerRow({
  banner,
  onEdit,
  onDelete,
  onToggleActive,
  onPreview,
  dragState,
  setDragState,
  onReorder,
}: BannerRowProps) {
  const isDragging = dragState.draggingId === banner.id;
  const dropZone = dragState.overId === banner.id ? dragState.overZone : null;
  const status = computeStatus(banner);

  const rowClass = [
    "transition-colors",
    isDragging ? "opacity-40" : "",
    dropZone === "above" ? "border-t-2 border-t-primary" : "",
    dropZone === "below" ? "border-b-2 border-b-primary" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    setDragState({ draggingId: banner.id, overId: null, overZone: null });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    setDragState((prev) => ({ ...prev, overId: banner.id, overZone: ratio < 0.5 ? "above" : "below" }));
  };

  const handleDragLeave = () => {
    setDragState((prev) => (prev.overId === banner.id ? { ...prev, overId: null, overZone: null } : prev));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = dragState.draggingId;
    const zone = dragState.overZone;
    setDragState({ draggingId: null, overId: null, overZone: null });
    if (!draggedId || draggedId === banner.id || !zone) return;
    onReorder(draggedId, banner, zone);
  };

  return (
    <TableRow
      className={rowClass}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={() => setDragState({ draggingId: null, overId: null, overZone: null })}
    >
      <TableCell className="w-8">
        <span className="cursor-grab text-muted-foreground active:cursor-grabbing" title="Drag to reorder" aria-label="Drag to reorder">
          <GripVertical className="size-4" />
        </span>
      </TableCell>
      <TableCell>
        <div className="flex gap-1.5">
          {banner.imageUrl ? (
            <div className="relative size-11 overflow-hidden rounded-md border bg-muted" title="Desktop">
              <NextImage src={banner.imageUrl} alt={banner.title} fill sizes="44px" className="object-cover" />
            </div>
          ) : (
            <div className="flex size-11 items-center justify-center rounded-md border bg-muted text-muted-foreground">🖼️</div>
          )}
          {banner.mobileImageUrl && (
            <div className="relative size-11 overflow-hidden rounded-md border bg-muted" title="Mobile">
              <NextImage src={banner.mobileImageUrl} alt={`${banner.title} (mobile)`} fill sizes="44px" className="object-cover" />
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="max-w-[220px] truncate font-medium">{banner.title}</TableCell>
      <TableCell className="text-center text-muted-foreground">{banner.order}</TableCell>
      <TableCell className="hidden text-muted-foreground md:table-cell">{formatDateRange(banner)}</TableCell>
      <TableCell>
        <Badge variant={status.variant}>{status.label}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Preview ${banner.title}`}
            disabled={!banner.imageUrl}
            onClick={() => onPreview(banner)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={banner.active ? `Disable ${banner.title}` : `Enable ${banner.title}`}
            onClick={() => onToggleActive(banner)}
          >
            {banner.active ? <PowerOff className="size-4" /> : <Power className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Edit ${banner.title}`} onClick={() => onEdit(banner)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            aria-label={`Delete ${banner.title}`}
            onClick={() => onDelete(banner)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface BannerTableProps {
  banners: PlainBanner[];
  onEdit: (b: PlainBanner) => void;
  onDelete: (b: PlainBanner) => void;
  onToggleActive: (b: PlainBanner) => void;
  onReorder: (orderedIds: string[]) => void;
}

export default function BannerTable({ banners, onEdit, onDelete, onToggleActive, onReorder }: BannerTableProps) {
  const [dragState, setDragState] = useState<DragState>({ draggingId: null, overId: null, overZone: null });
  const [previewBanner, setPreviewBanner] = useState<PlainBanner | null>(null);

  if (banners.length === 0) {
    return <p className="p-8 text-center text-sm text-muted-foreground">No banners yet. The homepage will show its default slides.</p>;
  }

  const sorted = [...banners].sort((a, b) => a.order - b.order);

  const handleReorder = (draggedId: string, target: PlainBanner, zone: "above" | "below") => {
    const withoutDragged = sorted.filter((b) => b.id !== draggedId);
    const targetIndex = withoutDragged.findIndex((b) => b.id === target.id);
    const insertAt = zone === "above" ? targetIndex : targetIndex + 1;
    const reordered = [...withoutDragged];
    reordered.splice(insertAt, 0, sorted.find((b) => b.id === draggedId)!);
    onReorder(reordered.map((b) => b.id));
  };

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Image</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="text-center">Priority</TableHead>
            <TableHead className="hidden md:table-cell">Schedule</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-36" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((b) => (
            <BannerRow
              key={b.id}
              banner={b}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
              onPreview={setPreviewBanner}
              dragState={dragState}
              setDragState={setDragState}
              onReorder={handleReorder}
            />
          ))}
        </TableBody>
      </Table>

      {previewBanner && (
        <BannerPreview
          banner={{
            eyebrow: previewBanner.eyebrow || "",
            title: previewBanner.title,
            subtitle: previewBanner.subtitle || "",
            ctaLabel: previewBanner.ctaLabel || "",
            imageUrl: previewBanner.imageUrl || "",
            mobileImageUrl: previewBanner.mobileImageUrl || "",
            overlayOpacity: previewBanner.overlayOpacity,
            textAlign: previewBanner.textAlign,
          }}
          onClose={() => setPreviewBanner(null)}
        />
      )}
    </div>
  );
}
