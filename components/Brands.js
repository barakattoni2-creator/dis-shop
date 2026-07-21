import Link from "next/link";
import Image from "next/image";
import styles from "@/styles/Brands.module.css";

// `brands` is server-fetched (real DB rows with logos when configured,
// falling back to the static name list otherwise) — see pages/index.js.
export default function Brands({ brands = [] }) {
  if (brands.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>Top Brands</h2>
        <Link href="/brands" className={styles.viewAll}>
          View All Brands →
        </Link>
      </div>
      <div className={styles.row}>
        {brands.map((brand) => (
          <Link
            key={brand.name}
            href={`/brand/${encodeURIComponent(brand.name)}`}
            className={styles.tile}
          >
            {brand.logoUrl ? (
              <Image src={brand.logoUrl} alt={brand.name} width={100} height={40} className={styles.logo} />
            ) : (
              <span className={styles.logoFallback}>{brand.name}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
