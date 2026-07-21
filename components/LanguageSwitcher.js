import { useEffect, useRef, useState } from "react";
import styles from "@/styles/LanguageSwitcher.module.css";

const LANGUAGES = [
  { code: "en", label: "English", ready: true },
  { code: "ar", label: "العربية (Coming Soon)", ready: false },
];

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        🌐 English
      </button>
      {open && (
        <div className={styles.menu}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={styles.option}
              disabled={!lang.ready}
              onClick={() => setOpen(false)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
