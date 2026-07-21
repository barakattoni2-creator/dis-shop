import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "@/styles/ProductImage.module.css";

// Three real states instead of a verified/not-verified boolean: "loading"
// (a shimmer skeleton, shown while the browser probes the URL) is now
// visually distinct from "error" (the icon fallback, shown once the photo
// is confirmed missing or broken) — previously both looked identical,
// which made a slow-loading real photo indistinguishable from a product
// that simply has no photo yet.
// Rejects empty/whitespace-only values without a wasted network probe —
// still permissive of both absolute Cloudinary/Odoo URLs and relative
// static-catalog paths, so nothing that currently works gets excluded.
function hasUsableSrc(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export default function ProductImage({
  src,
  icon = "📦",
  alt = "",
  background,
  className = "",
  sizes = "(max-width: 768px) 50vw, 320px",
  priority = false,
}) {
  const [status, setStatus] = useState(hasUsableSrc(src) ? "loading" : "error");
  // When src changes on an already-mounted instance, reset status at
  // render time (React's "adjust state when a prop changes" pattern)
  // rather than in an effect, avoiding a cascading-render lint violation.
  const [trackedSrc, setTrackedSrc] = useState(src);
  if (src !== trackedSrc) {
    setTrackedSrc(src);
    setStatus(hasUsableSrc(src) ? "loading" : "error");
  }

  useEffect(() => {
    if (!hasUsableSrc(src)) return;
    let cancelled = false;
    const probe = new window.Image();
    probe.onload = () => {
      if (!cancelled) setStatus("loaded");
    };
    probe.onerror = () => {
      if (cancelled) return;
      if (process.env.NODE_ENV !== "production") {
        console.error(`[ProductImage] Failed to load image: ${src}`);
      }
      setStatus("error");
    };
    probe.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <div className={`${styles.stage} ${className}`} style={{ background }}>
      {status === "loading" && <span className={styles.skeleton} />}
      {status === "loaded" && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={styles.photo}
        />
      )}
      {status === "error" && (
        <>
          <span className={styles.glow} />
          <span className={styles.icon}>{icon}</span>
        </>
      )}
    </div>
  );
}
