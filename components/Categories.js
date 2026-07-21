import Link from "next/link";
import Image from "next/image";
import { ChevronRightIcon } from "@/components/icons";
import { CATEGORY_ILLUSTRATIONS } from "@/components/categoryIllustrations";
import styles from "@/styles/Categories.module.css";

// Cycled per-category so the grid reads as colorful tiles rather than one
// flat block, while staying inside the brand's soft blue/orange tint family.
const TILE_COLORS = [
  "#DCEAFB",
  "#FCE4D0",
  "#D6E8FA",
  "#FAD9B8",
  "#E3F0FC",
  "#FBEEDD",
  "#CFE4FA",
  "#F7E0C4",
  "#E8F0F8",
  "#FDE8D6",
];

// `categories` is admin-curated (Category.showOnHomepage), not derived from
// which categories happen to have products — see pages/admin/categories.js.
export default function Categories({ products = [], categories = [] }) {
  const imageByCategory = {};
  products.forEach((p) => {
    const photo = p.imageUrl || p.images?.[0];
    if (photo && !imageByCategory[p.category]) {
      imageByCategory[p.category] = photo;
    }
  });

  if (categories.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>Shop by Category</h2>
        <Link href="/categories" className={styles.viewAll}>
          View All Categories →
        </Link>
      </div>
      <div className={styles.grid}>
        {categories.map((cat, i) => {
          const image = cat.imageUrl || imageByCategory[cat.slug];
          const Illustration = CATEGORY_ILLUSTRATIONS[cat.slug];
          return (
            <Link key={cat.slug} href={`/category/${cat.slug}`} className={styles.card}>
              <span
                className={styles.imageStage}
                style={{ background: TILE_COLORS[i % TILE_COLORS.length] }}
              >
                {image ? (
                  <Image
                    src={image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 40vw, 200px"
                    className={styles.catImage}
                  />
                ) : Illustration ? (
                  <Illustration className={styles.illustration} />
                ) : (
                  <span className={styles.icon}>{cat.icon || "📦"}</span>
                )}
              </span>
              <span className={styles.name}>{cat.name}</span>
              {typeof cat.productCount === "number" && cat.productCount > 0 && (
                <span className={styles.count}>
                  {cat.productCount} product{cat.productCount !== 1 ? "s" : ""}
                </span>
              )}
              <span className={styles.arrow}>
                <ChevronRightIcon width="14" height="14" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
