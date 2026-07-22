import Link from "next/link";
import Layout from "@/components/Layout";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductImage from "@/components/ProductImage";
import CategoryProductGrid from "@/features/category/CategoryProductGrid";
import ProjectQuoteCTA from "@/features/category/ProjectQuoteCTA";
import {
  fetchProducts,
  fetchCategoryDetail,
  fetchCategoryAndDescendantSlugs,
  findCategoryRedirect,
} from "@/lib/catalog";
import styles from "@/styles/CategoryPage.module.css";

export async function getStaticPaths() {
  // Every category is generated on-demand and cached (ISR) rather than
  // enumerated at build time — correct regardless of how many categories
  // exist, and doesn't require DB access during the build step itself.
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const category = await fetchCategoryDetail(params.slug).catch(() => null);

  if (!category || category.active === false) {
    const redirectTo = await findCategoryRedirect(params.slug).catch(() => null);
    if (redirectTo) {
      return { redirect: { destination: `/category/${redirectTo}`, permanent: true } };
    }
    return { notFound: true };
  }

  const slugsInSubtree = await fetchCategoryAndDescendantSlugs(category.id, category.slug).catch(
    () => [category.slug]
  );
  const allProducts = await fetchProducts().catch(() => []);
  const products = allProducts.filter((p) => slugsInSubtree.includes(p.category));

  return {
    props: { category, products },
    revalidate: 60,
  };
}

// The Prefab & Projects main category and everything under it (Prefab,
// Projects, and their children like "Request a Quotation") are services,
// not stocked/priced SKUs — see features/category/ProjectQuoteCTA.js.
const PROJECT_ROOT_SLUG = "prefab-projects";

function isProjectCategory(category) {
  return category.slug === PROJECT_ROOT_SLUG || category.breadcrumbs.some((b) => b.slug === PROJECT_ROOT_SLUG);
}

export default function CategoryPage({ category, products }) {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...category.breadcrumbs.map((b) => ({ label: b.name, href: `/category/${b.slug}` })),
    { label: category.name },
  ];

  const seoTitle = category.seoTitle || category.name;
  const seoDescription =
    category.seoDescription ||
    category.description ||
    `Shop ${category.name} at DIS Shop — Juba, South Sudan.`;

  return (
    <Layout title={seoTitle} description={seoDescription} image={category.imageUrl || undefined}>
      <Breadcrumbs items={breadcrumbItems} />

      <div className={styles.hero}>
        <ProductImage
          src={category.imageUrl}
          icon={category.icon || "📦"}
          alt={category.name}
          className={styles.heroImage}
          sizes="84px"
          priority
        />
        <div className={styles.heroText}>
          <h1 className={styles.heroHeading}>
            {category.name}
            {category.nameAr && <span className={styles.heroHeadingAr}>{category.nameAr}</span>}
          </h1>
          {category.description && <p className={styles.heroDescription}>{category.description}</p>}
        </div>
      </div>

      {category.children.length > 0 && (
        <div className={styles.subcatRow}>
          {category.children.map((child) => (
            <Link key={child.id} href={`/category/${child.slug}`} className={styles.subcatChip}>
              {child.icon ? `${child.icon} ` : ""}
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {isProjectCategory(category) && <ProjectQuoteCTA categoryName={category.name} />}

      <CategoryProductGrid products={products} categoryName={category.name} />
    </Layout>
  );
}
