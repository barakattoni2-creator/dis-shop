import { useEffect, useRef, useState } from "react";
import { BellIcon } from "@/components/icons";
import styles from "@/styles/Header.module.css";

// No notifications backend exists yet (no order-status-push, no admin
// broadcast system) — rather than fabricate sample alerts, this ships as a
// complete, working UI shell with an honest empty state. The panel and
// unread-badge plumbing are ready for a real feed to be wired in later
// without any markup changes.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const unreadCount = 0;

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.dropdownRoot} ref={rootRef}>
      <button
        type="button"
        className={styles.actionLink}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Notifications"
      >
        <span className={styles.actionIcon}>
          <BellIcon />
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
        </span>
        <span className={styles.actionText}>Alerts</span>
      </button>

      {open && (
        <div className={styles.dropdownPanel}>
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownHeaderName}>Notifications</span>
          </div>
          <div className={styles.notificationEmpty}>
            <BellIcon width="26" height="26" />
            <p>You&rsquo;re all caught up — no new notifications.</p>
          </div>
        </div>
      )}
    </div>
  );
}
