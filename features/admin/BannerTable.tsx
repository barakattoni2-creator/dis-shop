import { useState } from "react";
import adminStyles from "@/styles/Admin.module.css";
import styles from "@/styles/BannerTable.module.css";
import BannerPreview from "@/features/admin/BannerPreview";
import type { PlainBanner } from "@/types/domain";

type DropZone = "above" | "below" | null;

interface DragState {
  draggingId: string | null;
  overId: string | null;
  overZone: DropZone;
}

function computeStatus(b: PlainBanner): { label: string; className: string } {
  if (!b.active) return { label: "Hidden", className: styles.statusHidden };
  const now = Date.now();
  if (b.startDate && new Date(b.startDate).getTime() > now) {
    return { label: "Scheduled", className: styles.statusScheduled };
  }
  if (b.endDate && new Date(b.endDate).getTime() < now) {
    return { label: "Expired", className: styles.statusExpired };
  }
  return { label: "Live", className: styles.statusLive };
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
    isDragging ? styles.rowDragging : "",
    dropZone === "above" ? styles.rowDragOverAbove : "",
    dropZone === "below" ? styles.rowDragOverBelow : "",
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
    <tr
      className={rowClass}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={() => setDragState({ draggingId: null, overId: null, overZone: null })}
    >
      <td className={styles.dragCell} title="Drag to reorder" aria-label="Drag to reorder">
        <span className={styles.dragHandle}>⠿</span>
      </td>
      <td data-label="Image">
        <div className={styles.thumbPair}>
          {banner.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={banner.imageUrl} alt={banner.title} className={adminStyles.rowThumb} title="Desktop" />
          ) : (
            <span className={adminStyles.rowThumbEmpty}>🖼️</span>
          )}
          {banner.mobileImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner.mobileImageUrl}
              alt={`${banner.title} (mobile)`}
              className={adminStyles.rowThumb}
              title="Mobile"
            />
          )}
        </div>
      </td>
      <td data-label="Title">{banner.title}</td>
      <td data-label="Schedule" className={styles.scheduleCell}>
        {formatDateRange(banner)}
      </td>
      <td data-label="Status">
        <span className={`${styles.statusBadge} ${status.className}`}>{status.label}</span>
      </td>
      <td className={adminStyles.actionsCell}>
        <button
          type="button"
          className={adminStyles.editBtn}
          onClick={() => onPreview(banner)}
          disabled={!banner.imageUrl}
        >
          Preview
        </button>
        <button type="button" className={adminStyles.editBtn} onClick={() => onToggleActive(banner)}>
          {banner.active ? "Disable" : "Enable"}
        </button>
        <button type="button" className={adminStyles.editBtn} onClick={() => onEdit(banner)}>
          Edit
        </button>
        <button type="button" className={adminStyles.deleteBtn} onClick={() => onDelete(banner)}>
          Delete
        </button>
      </td>
    </tr>
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
    return <p className={adminStyles.empty}>No banners yet. The homepage will show its default slides.</p>;
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
    <div className={adminStyles.tableWrap}>
      <table className={adminStyles.table}>
        <thead>
          <tr>
            <th></th>
            <th>Image</th>
            <th>Title</th>
            <th>Schedule</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
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
        </tbody>
      </table>

      {previewBanner && (
        <BannerPreview
          banner={{
            eyebrow: previewBanner.eyebrow || "",
            title: previewBanner.title,
            subtitle: previewBanner.subtitle || "",
            ctaLabel: previewBanner.ctaLabel || "",
            imageUrl: previewBanner.imageUrl || "",
            mobileImageUrl: previewBanner.mobileImageUrl || "",
          }}
          onClose={() => setPreviewBanner(null)}
        />
      )}
    </div>
  );
}
