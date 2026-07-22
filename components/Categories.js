import Link from "next/link";
import Image from "next/image";
import { ChevronRightIcon } from "@/components/icons";
import { CATEGORY_ILLUSTRATIONS } from "@/components/categoryIllustrations";
import styles from "@/styles/Categories.module.css";

// Cycled per-category so the grid reads as colorful tiles rather than one
// flat block, while staying inside the brand's soft blue/orange tint family.
// Soft two-stop gradients rather than flat fills for a more modern tile look.
const TILE_COLORS = [
  "linear-gradient(135deg, #DCEAFB 0%, #EEF6FE 100%)",
  "linear-gradient(135deg, #FCE4D0 0%, #FDF1E6 100%)",
  "linear-gradient(135deg, #D6E8FA 0%, #EBF4FD 100%)",
  "linear-gradient(135deg, #FAD9B8 0%, #FCEBDA 100%)",
  "linear-gradient(135deg, #E3F0FC 0%, #F2F8FE 100%)",
  "linear-gradient(135deg, #FBEEDD 0%, #FDF7EF 100%)",
  "linear-gradient(135deg, #CFE4FA 0%, #E7F2FD 100%)",
  "linear-gradient(135deg, #F7E0C4 0%, #FCF0E1 100%)",
  "linear-gradient(135deg, #E8F0F8 0%, #F4F9FC 100%)",
  "linear-gradient(135deg, #FDE8D6 0%, #FEF4EB 100%)",
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
