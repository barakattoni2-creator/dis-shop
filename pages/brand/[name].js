import Layout from "@/components/Layout";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductImage from "@/components/ProductImage";
import CategoryProductGrid from "@/features/category/CategoryProductGrid";
import { fetchProducts, fetchBrands } from "@/lib/catalog";
import styles from "@/styles/CategoryPage.module.css";

export async function getStaticPaths() {
  const brands = await fetchBrands();
  return {
    paths: brands.map((b) => ({ params: { name: encodeURIComponent(b.name) } })),
    fallback: "blocking",
  };
}

export async function getStaticProps({ params }) {
  const brandName = decodeURIComponent(params.name);
  const [items, brands] = await Promise.all([fetchProducts(), fetchBrands()]);
  const brand = brands.find((b) => b.name === brandName);
  const products = items.filter((p) => p.brand === brandName);
  if (!brand && products.length === 0) return { notFound: true };
  return { props: { brand: brand || { name: brandName, logoUrl: null }, products }, revalidate: 60 };
}

export default function BrandPage({ brand, products }) {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Brands", href: "/brands" },
    { label: brand.name },
  ];

  return (
    <Layout
      title={brand.name}
      description={`Shop genuine ${brand.name} products at DIS Shop — Juba, South Sudan.`}
      image={brand.logoUrl || undefined}
    >
      <Breadcrumbs items={breadcrumbItems} />

      <div className={styles.hero}>
        <ProductImage
          src={brand.logoUrl}
          icon="🏷️"
          alt={brand.name}
          className={styles.heroImage}
          background="#fff"
          sizes="84px"
          priority
        />
        <div className={styles.heroText}>
          <h1 className={styles.heroHeading}>{brand.name}</h1>
          <p className={styles.heroDescription}>
            Genuine {brand.name} products, sold and warrantied by DIS Shop.
          </p>
        </div>
      </div>

      <CategoryProductGrid products={products} categoryName={brand.name} />
    </Layout>
  );
}
