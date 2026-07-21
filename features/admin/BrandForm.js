import { useState } from "react";
import styles from "@/styles/Admin.module.css";

export default function BrandForm({ initial, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, logoUrl });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label}>
        Brand Name
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={Boolean(initial)}
        />
      </label>
      <label className={styles.label}>
        Logo URL (optional)
        <input
          className={styles.input}
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://…"
        />
      </label>
      <div className={styles.formActions}>
        <button type="submit" className={styles.saveBtn}>
          {initial ? "Save Changes" : "Add Brand"}
        </button>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
