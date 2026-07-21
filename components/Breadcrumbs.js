import Link from "next/link";
import Head from "next/head";
import styles from "@/styles/Breadcrumbs.module.css";

// items: [{ label, href? }] — the last item (current page) should omit href.
export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  };

  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>
      <ol className={styles.list}>
        {items.map((item, i) => (
          <li key={i} className={styles.item}>
            {item.href ? (
              <Link href={item.href} className={styles.link}>
                {item.label}
              </Link>
            ) : (
              <span className={styles.current} aria-current="page">
                {item.label}
              </span>
            )}
            {i < items.length - 1 && <span className={styles.separator}>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
