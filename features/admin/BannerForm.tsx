import { useState } from "react";
import styles from "@/styles/Admin.module.css";
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
  };
}

// <input type="date"> needs "YYYY-MM-DD"; the DB/API round-trips full ISO
// datetimes — this trims to just the date portion for the field, and
// createBanner/updateBanner (services/db/banners.ts) parse it back via
// `new Date(value)` on save.
function toDateInputValue(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

interface BannerFormProps {
  initial?: PlainBanner | null;
  onSubmit: (data: BannerFormValues) => void;
  onCancel: () => void;
}

export default function BannerForm({ initial, onSubmit, onCancel }: BannerFormProps) {
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
        }
      : emptyForm()
  );
  const [uploading, setUploading] = useState<"" | "desktop" | "mobile">("");
  const [uploadError, setUploadError] = useState("");
  const [pickerTarget, setPickerTarget] = useState<"imageUrl" | "mobileImageUrl" | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const set =
    (field: keyof BannerFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

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
        setForm((prev) => ({ ...prev, [field]: data.url }));
      } catch (err) {
        setUploadError((err as Error).message);
      } finally {
        setUploading("");
      }
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, order: Number(form.order) || 0 });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label}>
        Title
        <input className={styles.input} value={form.title} onChange={set("title")} required />
      </label>

      <div className={styles.formRow}>
        <label className={styles.label}>
          Eyebrow (small label above title)
          <input className={styles.input} value={form.eyebrow} onChange={set("eyebrow")} />
        </label>
        <label className={styles.label}>
          Discount badge (optional)
          <input
            className={styles.input}
            value={form.discount}
            onChange={set("discount")}
            placeholder="Up to 20% OFF"
          />
        </label>
      </div>

      <label className={styles.label}>
        Subtitle
        <textarea className={styles.textarea} value={form.subtitle} onChange={set("subtitle")} />
      </label>

      <div className={styles.formRow}>
        <label className={styles.label}>
          Desktop Image
          <input
            type="file"
            accept="image/*"
            className={styles.input}
            onChange={handleImageChange("imageUrl", "desktop")}
          />
          <button
            type="button"
            className={styles.cancelBtn}
            style={{ marginTop: "0.4rem" }}
            onClick={() => setPickerTarget("imageUrl")}
          >
            Choose from Library
          </button>
        </label>
        <label className={styles.label}>
          Mobile Image (optional — falls back to desktop image)
          <input
            type="file"
            accept="image/*"
            className={styles.input}
            onChange={handleImageChange("mobileImageUrl", "mobile")}
          />
          <button
            type="button"
            className={styles.cancelBtn}
            style={{ marginTop: "0.4rem" }}
            onClick={() => setPickerTarget("mobileImageUrl")}
          >
            Choose from Library
          </button>
        </label>
      </div>
      {uploading && <p className={styles.uploadStatus}>Uploading {uploading} image…</p>}
      {uploadError && <p className={styles.uploadError}>{uploadError}</p>}
      {(form.imageUrl || form.mobileImageUrl) && (
        <div className={styles.thumbGrid}>
          {form.imageUrl && (
            <div className={styles.thumbItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imageUrl} alt="Desktop preview" className={styles.thumbImage} />
            </div>
          )}
          {form.mobileImageUrl && (
            <div className={styles.thumbItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.mobileImageUrl} alt="Mobile preview" className={styles.thumbImage} />
            </div>
          )}
        </div>
      )}

      <div className={styles.formRow}>
        <label className={styles.label}>
          Button URL
          <input
            className={styles.input}
            value={form.linkUrl}
            onChange={set("linkUrl")}
            placeholder="/category/solar"
          />
        </label>
        <label className={styles.label}>
          Display Order
          <input type="number" className={styles.input} value={form.order} onChange={set("order")} />
        </label>
      </div>

      <label className={styles.label}>
        Button Text (optional)
        <input
          className={styles.input}
          value={form.ctaLabel}
          onChange={set("ctaLabel")}
          placeholder="Shop Now"
        />
      </label>

      <div className={styles.formRow}>
        <label className={styles.label}>
          Start Date (optional — leave blank to go live immediately)
          <input type="date" className={styles.input} value={form.startDate} onChange={set("startDate")} />
        </label>
        <label className={styles.label}>
          End Date (optional — leave blank to run indefinitely)
          <input type="date" className={styles.input} value={form.endDate} onChange={set("endDate")} />
        </label>
      </div>

      <label className={styles.label}>
        Background (CSS color or gradient, used as a fallback behind the image)
        <input className={styles.input} value={form.bgColor} onChange={set("bgColor")} />
      </label>

      <label className={styles.checkboxLabel}>
        <input type="checkbox" checked={form.active} onChange={set("active")} />
        Active (visible on homepage when within its date range)
      </label>

      <div className={styles.formActions}>
        <button type="submit" className={styles.saveBtn} disabled={uploading !== ""}>
          {initial ? "Save Changes" : "Add Banner"}
        </button>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => setShowPreview(true)}
          disabled={!form.imageUrl && !form.mobileImageUrl}
        >
          Preview
        </button>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>

      {pickerTarget && (
        <MediaPicker
          defaultFolder="Banners"
          onClose={() => setPickerTarget(null)}
          onChoose={(asset: PlainMediaAsset) => {
            setForm((prev) => ({ ...prev, [pickerTarget]: asset.url }));
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
          }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </form>
  );
}
