import { useState } from "react";
import styles from "@/styles/Admin.module.css";

const BADGES = ["", "Best Seller", "Deal"];

function emptyForm(categories, brands) {
  return {
    name: "",
    category: categories[0]?.slug || "",
    brand: brands[0]?.name || "",
    price: "",
    originalPrice: "",
    badge: "",
    isNew: false,
    featured: false,
    description: "",
    stock: 0,
    sku: "",
    videoUrl: "",
    images: [],
  };
}

export default function ProductForm({ initial, categories, brands, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name || "",
          category: initial.category || categories[0]?.slug || "",
          brand: initial.brand || brands[0]?.name || "",
          price: initial.price ?? "",
          originalPrice: initial.originalPrice ?? "",
          badge: initial.badge || "",
          isNew: Boolean(initial.isNew),
          featured: Boolean(initial.featured),
          description: initial.description || "",
          stock: initial.stock ?? 0,
          sku: initial.sku || "",
          videoUrl: initial.videoUrl || "",
          images: initial.images?.length ? initial.images : initial.imageUrl ? [initial.imageUrl] : [],
        }
      : emptyForm(categories, brands)
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const set = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const uploadOne = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch("/api/admin/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: reader.result }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Upload failed.");
          resolve(data.url);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImagesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadError("");
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadOne));
      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (url) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((i) => i !== url) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      price: Number(form.price),
      originalPrice: Number(form.originalPrice) || Number(form.price),
      badge: form.badge || null,
      featured: form.featured,
      stock: Number(form.stock) || 0,
      sku: form.sku,
      videoUrl: form.videoUrl,
      images: form.images,
      imageUrl: form.images[0] || null,
      rating: initial?.rating ?? 4.5,
      reviews: initial?.reviews ?? 0,
      color: initial?.color ?? "#E5ECF3",
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label}>
        Product Name
        <input
          className={styles.input}
          value={form.name}
          onChange={set("name")}
          required
        />
      </label>

      <label className={styles.label}>
        Product Images (first image is the cover photo)
        <input
          type="file"
          accept="image/*"
          multiple
          className={styles.input}
          onChange={handleImagesChange}
        />
      </label>
      {uploading && <p className={styles.uploadStatus}>Uploading…</p>}
      {uploadError && <p className={styles.uploadError}>{uploadError}</p>}
      {form.images.length > 0 && (
        <div className={styles.thumbGrid}>
          {form.images.map((url, i) => (
            <div key={url} className={styles.thumbItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Product ${i + 1}`} className={styles.thumbImage} />
              {i === 0 && <span className={styles.thumbCoverTag}>Cover</span>}
              <button
                type="button"
                className={styles.thumbRemove}
                onClick={() => removeImage(url)}
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <label className={styles.label}>
        SKU (optional, must be unique)
        <input
          className={styles.input}
          value={form.sku}
          onChange={set("sku")}
          placeholder="e.g. GREE-AC-15HP"
        />
      </label>

      <div className={styles.formRow}>
        <label className={styles.label}>
          Category
          <select className={styles.input} value={form.category} onChange={set("category")}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          Brand
          <select className={styles.input} value={form.brand} onChange={set("brand")}>
            {brands.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.formRow}>
        <label className={styles.label}>
          Price (USD)
          <input
            type="number"
            step="0.01"
            min="0"
            className={styles.input}
            value={form.price}
            onChange={set("price")}
            required
          />
        </label>
        <label className={styles.label}>
          Original Price (USD) — used to show a discount
          <input
            type="number"
            step="0.01"
            min="0"
            className={styles.input}
            value={form.originalPrice}
            onChange={set("originalPrice")}
          />
        </label>
      </div>
      {Number(form.originalPrice) > Number(form.price) && Number(form.price) > 0 && (
        <p className={styles.uploadStatus}>
          Discount: {Math.round((1 - Number(form.price) / Number(form.originalPrice)) * 100)}% off
        </p>
      )}

      <div className={styles.formRow}>
        <label className={styles.label}>
          Badge
          <select className={styles.input} value={form.badge} onChange={set("badge")}>
            {BADGES.map((b) => (
              <option key={b || "none"} value={b}>
                {b === "Deal" ? "Deal (Flash Deal)" : b || "None"}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={form.isNew} onChange={set("isNew")} />
          Mark as New Arrival
        </label>
      </div>

      <label className={styles.checkboxLabel}>
        <input type="checkbox" checked={form.featured} onChange={set("featured")} />
        Feature on homepage (Featured Products section)
      </label>

      <label className={styles.label}>
        Stock Quantity
        <input
          type="number"
          min="0"
          className={styles.input}
          value={form.stock}
          onChange={set("stock")}
        />
      </label>

      <label className={styles.label}>
        Product Video URL (optional — YouTube or Cloudinary link)
        <input
          className={styles.input}
          value={form.videoUrl}
          onChange={set("videoUrl")}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </label>

      <label className={styles.label}>
        Description
        <textarea
          className={styles.textarea}
          value={form.description}
          onChange={set("description")}
        />
      </label>

      <div className={styles.formActions}>
        <button type="submit" className={styles.saveBtn} disabled={uploading}>
          {initial ? "Save Changes" : "Add Product"}
        </button>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
