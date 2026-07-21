import styles from "@/styles/Admin.module.css";

export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", danger, onConfirm, onCancel }) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <h2 className={styles.modalHeading}>{title}</h2>
        <p style={{ marginBottom: "1.2rem", color: "#565959", lineHeight: 1.5 }}>{message}</p>
        <div className={styles.formActions}>
          <button
            type="button"
            className={danger ? styles.dangerBtn : styles.saveBtn}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
