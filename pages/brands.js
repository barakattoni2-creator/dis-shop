import Link from "next/link";
import Image from "next/image";
import Layout from "@/components/Layout";
import { fetchProducts, fetchBrands } from "@/lib/catalog";
import styles from "@/styles/BrandsPage.module.css";

export async function getStaticProps() {
  const [products, brands] = await Promise.all([fetchProducts(), fetchBrands()]);
  const counts = {};
  products.forEach((p) => {
    if (p.brand) counts[p.brand] = (counts[p.brand] || 0) + 1;
  });
  const list = brands.map((b) => ({ ...b, productCount: counts[b.name] || 0 }));
  return { props: { brands: list }, revalidate: 60 };
}

export default function BrandsPage({ brands }) {
  return (
    <Layout
      title="All Brands"
      description="Shop genuine products from every brand DIS Shop carries — Gree, EMTOP, Sonifer, Total, Spartan, Felicity, Deye and more."
    >
      <section className={styles.section}>
        <h1 className={styles.heading}>Shop by Brand</h1>
        <div className={styles.grid}>
          {brands.map((brand) => (
            <Link
              key={brand.name}
              href={`/brand/${encodeURIComponent(brand.name)}`}
              className={styles.card}
            >
              {brand.logoUrl ? (
                <Image src={brand.logoUrl} alt={brand.name} width={64} height={64} className={styles.logo} />
              ) : (
                <span className={styles.logoFallback}>{brand.name.charAt(0)}</span>
              )}
              <span className={styles.name}>{brand.name}</span>
              <span className={styles.count}>
                {brand.productCount} product{brand.productCount !== 1 ? "s" : ""}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
