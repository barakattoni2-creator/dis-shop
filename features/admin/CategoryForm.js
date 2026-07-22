import { useMemo, useState } from "react";
import styles from "@/styles/Admin.module.css";
import MediaPicker from "@/features/admin/MediaPicker";

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emptyForm() {
  return {
    name: "",
    nameAr: "",
    slug: "",
    description: "",
    icon: "📦",
    imageUrl: "",
    parentId: "",
    order: 0,
    active: true,
    showOnHomepage: false,
    showInNav: true,
    seoTitle: "",
    seoDescription: "",
    odooCategoryId: "",
  };
}

// Every id that is `category` itself or one of its descendants — these
// can't be offered as a new parent (would create a circular relationship).
function collectDescendantIds(categories, categoryId) {
  const childrenOf = {};
  categories.forEach((c) => {
    if (c.parentId) (childrenOf[c.parentId] ||= []).push(c.id);
  });
  const out = new Set([categoryId]);
  const walk = (id) => {
    (childrenOf[id] || []).forEach((childId) => {
      out.add(childId);
      walk(childId);
    });
  };
  walk(categoryId);
  return out;
}

export default function CategoryForm({ initial, categories, onSubmit, onCancel, error }) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name || "",
          nameAr: initial.nameAr || "",
          slug: initial.slug || "",
          description: initial.description || "",
          icon: initial.icon || "📦",
          imageUrl: initial.imageUrl || "",
          parentId: initial.parentId || "",
          order: initial.order ?? 0,
          active: initial.active ?? true,
          showOnHomepage: initial.showOnHomepage ?? false,
          showInNav: initial.showInNav ?? true,
          seoTitle: initial.seoTitle || "",
          seoDescription: initial.seoDescription || "",
          odooCategoryId: initial.odooCategoryId ?? "",
        }
      : emptyForm()
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const excludedParentIds = useMemo(
    () => (initial ? collectDescendantIds(categories, initial.id) : new Set()),
    [categories, initial]
  );

  const parentOptions = useMemo(() => {
    const byId = {};
    categories.forEach((c) => (byId[c.id] = c));
    const depthOf = (c) => {
      let d = 0;
      let cur = c;
      while (cur.parentId && byId[cur.parentId]) {
        d++;
        cur = byId[cur.parentId];
      }
      return d;
    };
    return categories
      .filter((c) => !excludedParentIds.has(c.id) && c.level < 3)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({ id: c.id, label: `${"— ".repeat(depthOf(c))}${c.name}` }));
  }, [categories, excludedParentIds]);

  const selectedParent = categories.find((c) => c.id === form.parentId);
  const computedLevel = selectedParent ? Math.min(selectedParent.level + 1, 3) : 1;

  const set = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const handleSlugChange = (e) => {
    setSlugTouched(true);
    setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
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
    onSubmit({
      ...form,
      slug: slugify(form.slug),
      parentId: form.parentId || null,
      order: Number(form.order) || 0,
      odooCategoryId: form.odooCategoryId ? Number(form.odooCategoryId) : null,
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <p className={styles.uploadError}>{error}</p>}

      <div className={styles.formRow}>
        <label className={styles.label}>
          English Name
          <input className={styles.input} value={form.name} onChange={handleNameChange} required />
        </label>
        <label className={styles.label}>
          Arabic Name
          <input
            className={styles.input}
            value={form.nameAr}
            onChange={set("nameAr")}
            dir="rtl"
            placeholder="الاسم بالعربية"
          />
        </label>
      </div>

      <div className={styles.formRow}>
        <label className={styles.label}>
          Slug (used in the URL)
          <input className={styles.input} value={form.slug} onChange={handleSlugChange} required />
        </label>
        <label className={styles.label}>
          Parent Category
          <select className={styles.input} value={form.parentId} onChange={set("parentId")}>
            <option value="">— Top Level (Main Category) —</option>
            {parentOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className={styles.uploadStatus}>
        Level: {computedLevel === 1 ? "Main Category" : computedLevel === 2 ? "Subcategory" : "Child Category"}
        {" · "}Preview: <code>/category/{form.slug || "…"}</code>
        {initial?.productCount !== undefined && <> {" · "}{initial.productCount} product(s)</>}
      </p>

      <label className={styles.label}>
        Description
        <textarea className={styles.textarea} value={form.description} onChange={set("description")} />
      </label>

      <div className={styles.formRow}>
        <label className={styles.label}>
          Icon (emoji)
          <input className={styles.input} value={form.icon} onChange={set("icon")} />
        </label>
        <label className={styles.label}>
          Display Order
          <input type="number" className={styles.input} value={form.order} onChange={set("order")} />
        </label>
      </div>

      <label className={styles.label}>
        Category Image
        <input type="file" accept="image/*" className={styles.input} onChange={handleImageChange} />
      </label>
      <button
        type="button"
        className={styles.cancelBtn}
        style={{ alignSelf: "flex-start" }}
        onClick={() => setShowPicker(true)}
      >
        Choose from Library
      </button>
      {uploading && <p className={styles.uploadStatus}>Uploading…</p>}
      {uploadError && <p className={styles.uploadError}>{uploadError}</p>}
      {form.imageUrl && !uploading && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={form.imageUrl} alt="Category preview" className={styles.imagePreview} />
      )}
      {showPicker && (
        <MediaPicker
          defaultFolder="Categories"
          onClose={() => setShowPicker(false)}
          onChoose={(asset) => {
            setForm((prev) => ({ ...prev, imageUrl: asset.url }));
            setShowPicker(false);
          }}
        />
      )}

      <div className={styles.formRow}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={form.active} onChange={set("active")} />
          Active
        </label>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={form.showOnHomepage} onChange={set("showOnHomepage")} />
          Show on Homepage
        </label>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={form.showInNav} onChange={set("showInNav")} />
          Show in Navigation
        </label>
      </div>

      <label className={styles.label}>
        SEO Title
        <input className={styles.input} value={form.seoTitle} onChange={set("seoTitle")} />
      </label>
      <label className={styles.label}>
        SEO Description
        <textarea className={styles.textarea} value={form.seoDescription} onChange={set("seoDescription")} />
      </label>

      <label className={styles.label}>
        Odoo Category ID (optional)
        <input
          type="number"
          className={styles.input}
          value={form.odooCategoryId}
          onChange={set("odooCategoryId")}
          placeholder="Not synced — for future Odoo mapping only"
        />
      </label>

      <div className={styles.formActions}>
        <button type="submit" className={styles.saveBtn} disabled={uploading}>
          {initial ? "Save Changes" : "Add Category"}
        </button>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
