import { useState } from "react";
import styles from "@/styles/Admin.module.css";

export default function CustomerForm({ initial, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [phone, setPhone] = useState(initial?.phone || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, email, phone });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label}>
        Name
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <label className={styles.label}>
        Email
        <input
          type="email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className={styles.label}>
        Phone
        <input className={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <div className={styles.formActions}>
        <button type="submit" className={styles.saveBtn}>
          {initial ? "Save Changes" : "Add Customer"}
        </button>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
