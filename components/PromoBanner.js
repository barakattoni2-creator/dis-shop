import Link from "next/link";
import styles from "@/styles/PromoBanner.module.css";

export default function PromoBanner({ eyebrow, title, subtitle, cta, href, bg, icon }) {
  return (
    <section className={styles.banner} style={{ background: bg }}>
      <div className={styles.content}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <Link href={href} className={styles.cta}>
          {cta}
        </Link>
      </div>
      {icon && <span className={styles.icon}>{icon}</span>}
    </section>
  );
}
