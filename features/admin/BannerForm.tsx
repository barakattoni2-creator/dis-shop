import { useState } from "react";
import NextImage from "next/image";
import { AlignLeft, AlignCenter, AlignRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import MediaPicker from "@/features/admin/MediaPicker";
import BannerPreview from "@/features/admin/BannerPreview";
import type { PlainBanner, PlainMediaAsset } from "@/types/domain";

export interface BannerFormValues {
  eyebrow: string;
  title: string;
  subtitle: string;
  discount: string;
  imageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  bgColor: string;
  ctaLabel: string;
  order: number;
  startDate: string;
  endDate: string;
  active: boolean;
  status: "DRAFT" | "ACTIVE";
  overlayOpacity: number;
  textAlign: "left" | "center" | "right";
  openInNewTab: boolean;
}

function emptyForm(): BannerFormValues {
  return {
    eyebrow: "",
    title: "",
    subtitle: "",
    discount: "",
    imageUrl: "",
    mobileImageUrl: "",
    linkUrl: "",
    bgColor: "linear-gradient(120deg, #081a3a, #0a4dff)",
    ctaLabel: "",
    order: 0,
    startDate: "",
    endDate: "",
    active: true,
    status: "ACTIVE",
    overlayOpacity: 100,
    textAlign: "left",
    openInNewTab: false,
  };
}

// <input type="date"> needs "YYYY-MM-DD"; the DB/API round-trips full ISO
// datetimes — this trims to just the date portion for the field, and
// createBanner/updateBanner (services/db/banners.ts) parse it back via
// `new Date(value)` on save.
function toDateInputValue(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

const TEXT_ALIGN_OPTIONS: Array<{ value: BannerFormValues["textAlign"]; label: string; Icon: typeof AlignLeft }> = [
  { value: "left", label: "Left", Icon: AlignLeft },
  { value: "center", label: "Center", Icon: AlignCenter },
  { value: "right", label: "Right", Icon: AlignRight },
];

interface BannerFormProps {
  initial?: PlainBanner | null;
  onSubmit: (data: BannerFormValues) => void;
  onCancel: () => void;
  saving?: boolean;
}

export default function BannerForm({ initial, onSubmit, onCancel, saving }: BannerFormProps) {
  const [form, setForm] = useState<BannerFormValues>(
    initial
      ? {
          eyebrow: initial.eyebrow || "",
          title: initial.title || "",
          subtitle: initial.subtitle || "",
          discount: initial.discount || "",
          imageUrl: initial.imageUrl || "",
          mobileImageUrl: initial.mobileImageUrl || "",
          linkUrl: initial.linkUrl || "",
          bgColor: initial.bgColor || "linear-gradient(120deg, #081a3a, #0a4dff)",
          ctaLabel: initial.ctaLabel || "",
          order: initial.order ?? 0,
          startDate: toDateInputValue(initial.startDate),
          endDate: toDateInputValue(initial.endDate),
          active: initial.active ?? true,
          status: initial.status || "ACTIVE",
          overlayOpacity: initial.overlayOpacity ?? 100,
          textAlign: initial.textAlign || "left",
          openInNewTab: initial.openInNewTab ?? false,
        }
      : emptyForm()
  );
  const [uploading, setUploading] = useState<"" | "desktop" | "mobile">("");
  const [uploadError, setUploadError] = useState("");
  const [pickerTarget, setPickerTarget] = useState<"imageUrl" | "mobileImageUrl" | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const set = <K extends keyof BannerFormValues>(field: K, value: BannerFormValues[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleImageChange =
    (field: "imageUrl" | "mobileImageUrl", uploadKey: "desktop" | "mobile") =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadError("");
      setUploading(uploadKey);
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed.");
        set(field, data.url);
      } catch (err) {
        setUploadError((err as Error).message);
      } finally {
        setUploading("");
      }
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, order: Number(form.order) || 0, overlayOpacity: Number(form.overlayOpacity) || 0 });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="banner-title">Title</Label>
        <Input id="banner-title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="banner-eyebrow">Eyebrow (small label above title)</Label>
          <Input id="banner-eyebrow" value={form.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="banner-discount">Discount badge (optional)</Label>
          <Input
            id="banner-discount"
            value={form.discount}
            onChange={(e) => set("discount", e.target.value)}
            placeholder="Up to 20% OFF"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="banner-subtitle">Subtitle</Label>
        <Textarea id="banner-subtitle" rows={2} value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="banner-desktop-image">Desktop Image</Label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" asChild disabled={uploading !== ""}>
              <label className="cursor-pointer">
                {uploading === "desktop" ? "Uploading…" : "Upload"}
                <input
                  id="banner-desktop-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange("imageUrl", "desktop")}
                />
              </label>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setPickerTarget("imageUrl")}>
              Choose from Library
            </Button>
          </div>
          {form.imageUrl && (
            <div className="relative mt-2 h-24 w-full overflow-hidden rounded-md border bg-muted">
              <NextImage src={form.imageUrl} alt="Desktop preview" fill sizes="320px" className="object-cover" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="banner-mobile-image">Mobile Image (optional — falls back to desktop image)</Label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" asChild disabled={uploading !== ""}>
              <label className="cursor-pointer">
                {uploading === "mobile" ? "Uploading…" : "Upload"}
                <input
                  id="banner-mobile-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange("mobileImageUrl", "mobile")}
                />
              </label>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setPickerTarget("mobileImageUrl")}>
              Choose from Library
            </Button>
          </div>
          {form.mobileImageUrl && (
            <div className="relative mt-2 h-24 w-full overflow-hidden rounded-md border bg-muted">
              <NextImage src={form.mobileImageUrl} alt="Mobile preview" fill sizes="320px" className="object-cover" />
            </div>
          )}
        </div>
      </div>
      {uploadError && <p className="text-sm font-medium text-destructive">{uploadError}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="banner-link">Button URL</Label>
          <Input
            id="banner-link"
            value={form.linkUrl}
            onChange={(e) => set("linkUrl", e.target.value)}
            placeholder="/category/solar"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="banner-cta">Button Text (optional)</Label>
          <Input
            id="banner-cta"
            value={form.ctaLabel}
            onChange={(e) => set("ctaLabel", e.target.value)}
            placeholder="Shop Now"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label htmlFor="banner-new-tab">Open button link in a new tab</Label>
          <p className="text-xs text-muted-foreground">Useful for links to external sites.</p>
        </div>
        <Switch id="banner-new-tab" checked={form.openInNewTab} onCheckedChange={(v) => set("openInNewTab", v)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="banner-order">Display Priority</Label>
          <Input
            id="banner-order"
            type="number"
            value={form.order}
            onChange={(e) => set("order", Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Lower numbers show first. Drag rows in the list to reorder instead.</p>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v as BannerFormValues["status"])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft — never shown on the homepage</SelectItem>
              <SelectItem value="ACTIVE">Active — follows the Enabled toggle and dates below</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="banner-start">Start Date (optional — leave blank to go live immediately)</Label>
          <Input id="banner-start" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="banner-end">End Date (optional — leave blank to run indefinitely)</Label>
          <Input id="banner-end" type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="banner-overlay">Background overlay strength</Label>
          <span className="font-mono text-xs text-muted-foreground">{form.overlayOpacity}%</span>
        </div>
        <input
          id="banner-overlay"
          type="range"
          min={0}
          max={100}
          step={5}
          value={form.overlayOpacity}
          onChange={(e) => set("overlayOpacity", Number(e.target.value))}
          className="w-full accent-primary"
        />
        <p className="text-xs text-muted-foreground">
          Darkens the left side of the photo so the title stays readable. Lower it for already-dark photos.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Text alignment</Label>
        <div className="flex overflow-hidden rounded-md border w-fit">
          {TEXT_ALIGN_OPTIONS.map(({ value, label, Icon }, i) => (
            <Button
              key={value}
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Align text ${label.toLowerCase()}`}
              aria-pressed={form.textAlign === value}
              className={`rounded-none ${i > 0 ? "border-l" : ""} ${form.textAlign === value ? "bg-accent" : ""}`}
              onClick={() => set("textAlign", value)}
            >
              <Icon className="size-4" /> {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="banner-bg">Background (CSS color or gradient, used as a fallback behind the image)</Label>
        <Input id="banner-bg" value={form.bgColor} onChange={(e) => set("bgColor", e.target.value)} />
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label htmlFor="banner-active">Enabled</Label>
          <p className="text-xs text-muted-foreground">Visible on the homepage when Active and within its date range.</p>
        </div>
        <Switch id="banner-active" checked={form.active} onCheckedChange={(v) => set("active", v)} />
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowPreview(true)}
          disabled={!form.imageUrl && !form.mobileImageUrl}
        >
          <Eye className="size-4" /> Preview
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={uploading !== "" || saving}>
            {saving ? "Saving…" : initial ? "Save Changes" : "Add Banner"}
          </Button>
        </div>
      </DialogFooter>

      {pickerTarget && (
        <MediaPicker
          defaultFolder="Banners"
          onClose={() => setPickerTarget(null)}
          onChoose={(asset: PlainMediaAsset) => {
            set(pickerTarget, asset.url);
            setPickerTarget(null);
          }}
        />
      )}

      {showPreview && (
        <BannerPreview
          banner={{
            eyebrow: form.eyebrow,
            title: form.title,
            subtitle: form.subtitle,
            ctaLabel: form.ctaLabel,
            imageUrl: form.imageUrl,
            mobileImageUrl: form.mobileImageUrl,
            overlayOpacity: form.overlayOpacity,
            textAlign: form.textAlign,
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </form>
  );
}
