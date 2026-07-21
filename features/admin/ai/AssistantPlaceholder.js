import styles from "@/styles/AdminAi.module.css";

// Shown for assistant sections whose generation pipeline hasn't been wired
// up yet (see services/ai/suggestions.js's APPLIERS registry) — the route,
// permission and nav entry all exist now; the "Generate suggestions" action
// arrives with its own phase rather than shipping half-wired.
export default function AssistantPlaceholder({ icon, title, bullets }) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.placeholderIcon}>{icon}</span>
      <h2 className={styles.placeholderHeading}>{title}</h2>
      <p className={styles.placeholderText}>
        This assistant&apos;s suggestion pipeline hasn&apos;t been connected yet. Once it
        is, suggestions generated here will always land in Pending Approvals
        first — nothing is ever written automatically.
      </p>
      {bullets && bullets.length > 0 && (
        <ul className={styles.placeholderList}>
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
