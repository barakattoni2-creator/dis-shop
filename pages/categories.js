import Link from "next/link";
import Image from "next/image";
import Layout from "@/components/Layout";
import { fetchCategoryTree } from "@/lib/catalog";
import styles from "@/styles/CategoriesPage.module.css";

function subtreeProductCount(node) {
  return (node.productCount || 0) + node.children.reduce((sum, c) => sum + subtreeProductCount(c), 0);
}

export async function getStaticProps() {
  const tree = await fetchCategoryTree();
  const mains = tree
    .filter((c) => c.level === 1)
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      nameAr: c.nameAr,
      icon: c.icon,
      imageUrl: c.imageUrl,
      childCount: c.children.length,
      productCount: subtreeProductCount(c),
    }));
  return { props: { categories: mains }, revalidate: 60 };
}

export default function CategoriesPage({ categories }) {
  return (
    <Layout
      title="All Categories"
      description="Browse every DIS Shop category: tools, air conditioners, electrical, lighting, solar, plumbing, household, decoration, paint, automotive, fire safety, hardware and prefab & projects."
    >
      <section className={styles.section}>
        <h1 className={styles.heading}>Shop by Category</h1>
        <div className={styles.grid}>
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/category/${cat.slug}`} className={styles.card}>
              {cat.imageUrl ? (
                <Image
                  src={cat.imageUrl}
                  alt={cat.name}
                  width={64}
                  height={64}
                  className={styles.cardImage}
                />
              ) : (
                <span className={styles.icon}>{cat.icon || "📦"}</span>
              )}
              <span className={styles.name}>{cat.name}</span>
              {cat.nameAr && <span className={styles.nameAr}>{cat.nameAr}</span>}
              <span className={styles.count}>
                {cat.productCount} product{cat.productCount !== 1 ? "s" : ""}
                {cat.childCount > 0 && ` · ${cat.childCount} subcategories`}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
