import styles from "@/styles/AdminAi.module.css";
import adminStyles from "@/styles/Admin.module.css";

export default function SuggestionCard({ suggestion, onApprove, onReject }) {
  const isPending = suggestion.status === "PENDING";
  return (
    <div className={styles.suggestionCard}>
      <div className={styles.suggestionHeader}>
        <span className={styles.suggestionTitle}>{suggestion.title}</span>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <span className={styles.typeTag}>{suggestion.type.replace(/_/g, " ")}</span>
          <span className={`${styles.statusTag} ${styles[`status${suggestion.status}`]}`}>
            {suggestion.status}
          </span>
        </div>
      </div>
      <p className={styles.suggestionMeta}>
        {suggestion.targetType && `${suggestion.targetType} · `}
        Created {new Date(suggestion.createdAt).toLocaleString()}
        {suggestion.reviewedBy && ` · Reviewed by ${suggestion.reviewedBy}`}
      </p>
      {isPending && (
        <div className={styles.suggestionActions}>
          <button type="button" className={adminStyles.saveBtn} onClick={() => onApprove(suggestion)}>
            Approve
          </button>
          <button type="button" className={adminStyles.dangerBtn} onClick={() => onReject(suggestion)}>
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
