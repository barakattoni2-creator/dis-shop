import { useState } from "react";
import styles from "@/styles/Admin.module.css";

function emptyForm() {
  return {
    eyebrow: "",
    title: "",
    subtitle: "",
    discount: "",
    imageUrl: "",
    linkUrl: "",
    bgColor: "linear-gradient(120deg, #081a3a, #0a4dff)",
    ctaLabel: "",
    order: 0,
    active: true,
  };
}

export default function BannerForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    initial
      ? {
          eyebrow: initial.eyebrow || "",
          title: initial.title || "",
          subtitle: initial.subtitle || "",
          discount: initial.discount || "",
          imageUrl: initial.imageUrl || "",
          linkUrl: initial.linkUrl || "",
          bgColor: initial.bgColor || "linear-gradient(120deg, #081a3a, #0a4dff)",
          ctaLabel: initial.ctaLabel || "",
          order: initial.order ?? 0,
          active: initial.active ?? true,
        }
      : emptyForm()
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const set = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
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
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, order: Number(form.order) || 0 });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label}>
        Title
        <input
          className={styles.input}
          value={form.title}
          onChange={set("title")}
          required
        />
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

      <label className={styles.label}>
        Banner Image
        <input
          type="file"
          accept="image/*"
          className={styles.input}
          onChange={handleImageChange}
        />
      </label>
      {uploading && <p className={styles.uploadStatus}>Uploading…</p>}
      {uploadError && <p className={styles.uploadError}>{uploadError}</p>}
      {form.imageUrl && !uploading && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={form.imageUrl} alt="Banner preview" className={styles.imagePreview} />
      )}

      <div className={styles.formRow}>
        <label className={styles.label}>
          Link URL
          <input
            className={styles.input}
            value={form.linkUrl}
            onChange={set("linkUrl")}
            placeholder="/category/solar"
          />
        </label>
        <label className={styles.label}>
          Display Order
          <input
            type="number"
            className={styles.input}
            value={form.order}
            onChange={set("order")}
          />
        </label>
      </div>

      <label className={styles.label}>
        Primary Button Text (optional)
        <input
          className={styles.input}
          value={form.ctaLabel}
          onChange={set("ctaLabel")}
          placeholder="Shop Now"
        />
      </label>

      <label className={styles.label}>
        Background (CSS color or gradient)
        <input className={styles.input} value={form.bgColor} onChange={set("bgColor")} />
      </label>

      <label className={styles.checkboxLabel}>
        <input type="checkbox" checked={form.active} onChange={set("active")} />
        Active (visible on homepage)
      </label>

      <div className={styles.formActions}>
        <button type="submit" className={styles.saveBtn} disabled={uploading}>
          {initial ? "Save Changes" : "Add Banner"}
        </button>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
