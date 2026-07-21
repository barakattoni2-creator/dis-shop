import styles from "@/styles/Skeleton.module.css";

// Generic shimmer placeholder — width/height/radius are the only knobs, so
// call sites compose it into whatever shape they need (a text line, an
// avatar circle, a card) rather than each screen inventing its own
// loading-state CSS. Pairs with components/ProductImage.js's own built-in
// image skeleton for anything that isn't an image.
export default function Skeleton({ width = "100%", height = "1em", radius = "6px", className = "" }) {
  return (
    <span
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}
