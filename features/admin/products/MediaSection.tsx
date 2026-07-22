import { useState } from "react";
import NextImage from "next/image";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Star, X, Upload, FileText, Video, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MediaPicker from "@/features/admin/MediaPicker";
import type { ProductFormValues } from "@/features/admin/products/types";
import type { PlainMediaAsset } from "@/types/domain";

async function fileToUpload(file: File, endpoint: string, extraBody: Record<string, string> = {}): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: dataUrl, file: dataUrl, ...extraBody }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed.");
  return data.url;
}

function SortableThumb({
  url,
  isCover,
  onRemove,
  onMakeCover,
}: {
  url: string;
  isCover: boolean;
  onRemove: () => void;
  onMakeCover: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
    >
      <NextImage src={url} alt="" fill sizes="140px" className="object-cover" />
      <div className="absolute inset-0 flex flex-col justify-between bg-black/0 p-1.5 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
        <div className="flex items-center justify-between">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab rounded bg-black/50 p-1 text-white active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full bg-black/50 p-1 text-white hover:bg-destructive"
            aria-label="Remove image"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={onMakeCover}
          className="flex items-center justify-center gap-1 rounded bg-black/50 px-2 py-1 text-[11px] font-medium text-white hover:bg-black/70"
        >
          <Star className={isCover ? "size-3 fill-yellow-400 text-yellow-400" : "size-3"} />
          {isCover ? "Cover" : "Set as cover"}
        </button>
      </div>
      {isCover && (
        <span className="absolute top-1.5 left-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
          Cover
        </span>
      )}
    </div>
  );
}

interface MediaSectionProps {
  form: ProductFormValues;
  setForm: React.Dispatch<React.SetStateAction<ProductFormValues>>;
}

export default function MediaSection({ form, setForm }: MediaSectionProps) {
  const [uploading, setUploading] = useState<string>("");
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState<"gallery" | "mobile" | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const images = form.images.length > 0 ? form.images : form.imageUrl ? [form.imageUrl] : [];

  const setImages = (next: string[]) => {
    setForm((prev) => ({ ...prev, images: next, imageUrl: next[0] || "" }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.indexOf(String(active.id));
    const newIndex = images.indexOf(String(over.id));
    setImages(arrayMove(images, oldIndex, newIndex));
  };

  const handleGalleryFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    setUploading("gallery");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await fileToUpload(file, "/api/admin/upload"));
      }
      setImages([...images, ...uploaded]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading("");
    }
  };

  const handleSingleUpload = async (
    file: File | undefined,
    field: "mobileImageUrl" | "videoUrl" | "catalogPdfUrl"
  ) => {
    if (!file) return;
    setError("");
    setUploading(field);
    try {
      let url: string;
      if (field === "mobileImageUrl") {
        url = await fileToUpload(file, "/api/admin/upload");
      } else {
        const type = field === "videoUrl" ? "video" : "raw";
        url = await fileToUpload(file, "/api/admin/upload-file", { type });
      }
      setForm((prev) => ({ ...prev, [field]: url }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading("");
    }
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Images className="size-4" /> Product Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={images} strategy={rectSortingStrategy}>
                {images.map((url) => (
                  <SortableThumb
                    key={url}
                    url={url}
                    isCover={url === images[0]}
                    onRemove={() => setImages(images.filter((u) => u !== url))}
                    onMakeCover={() => setImages([url, ...images.filter((u) => u !== url)])}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-input text-muted-foreground hover:border-primary hover:text-primary">
              <Upload className="size-5" />
              <span className="text-xs font-medium">{uploading === "gallery" ? "Uploading…" : "Upload"}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading !== ""}
                onChange={(e) => {
                  handleGalleryFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen("gallery")}>
              Reuse from Media Library
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Drag to reorder. The first image is the storefront cover — drag one to the front or click &ldquo;Set
            as cover&rdquo;.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mobile Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Optional — a separate crop for narrow viewports. Falls back to the cover image if unset.
          </p>
          <div className="flex items-center gap-3">
            {form.mobileImageUrl && (
              <div className="relative size-20 overflow-hidden rounded-md border">
                <NextImage src={form.mobileImageUrl} alt="" fill sizes="80px" className="object-cover" />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  {uploading === "mobileImageUrl" ? "Uploading…" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleSingleUpload(e.target.files?.[0], "mobileImageUrl")}
                  />
                </label>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen("mobile")}>
                Choose from Library
              </Button>
              {form.mobileImageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm((prev) => ({ ...prev, mobileImageUrl: "" }))}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Video className="size-4" /> Product Video
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input
              id="videoUrl"
              value={form.videoUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
              placeholder="https://…"
            />
            <Button type="button" variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                {uploading === "videoUrl" ? "Uploading…" : "Upload a video file"}
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => handleSingleUpload(e.target.files?.[0], "videoUrl")}
                />
              </label>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" /> PDF Catalog
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="catalogPdfUrl">PDF URL</Label>
            <Input
              id="catalogPdfUrl"
              value={form.catalogPdfUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, catalogPdfUrl: e.target.value }))}
              placeholder="https://…"
            />
            <Button type="button" variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                {uploading === "catalogPdfUrl" ? "Uploading…" : "Upload a PDF"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleSingleUpload(e.target.files?.[0], "catalogPdfUrl")}
                />
              </label>
            </Button>
          </CardContent>
        </Card>
      </div>

      {pickerOpen && (
        <MediaPicker
          onClose={() => setPickerOpen(null)}
          onChoose={(asset: PlainMediaAsset) => {
            if (pickerOpen === "gallery") setImages([...images, asset.url]);
            else setForm((prev) => ({ ...prev, mobileImageUrl: asset.url }));
            setPickerOpen(null);
          }}
        />
      )}
    </div>
  );
}
