import { useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import styles from "@/styles/CategoryPage.module.css";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const PAGE_SIZE = 12;

function sortProducts(products, sort) {
  const list = [...products];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "rating":
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case "newest":
      return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    case "featured":
    default:
      return list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }
}

export default function CategoryProductGrid({ products, categoryName }) {
  const [sort, setSort] = useState("featured");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [maxPrice, setMaxPrice] = useState(null);
  const [page, setPage] = useState(1);

  const availableBrands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(),
    [products]
  );
  const priceCeiling = useMemo(
    () => Math.ceil(Math.max(0, ...products.map((p) => p.price || 0))),
    [products]
  );

  const filtered = useMemo(() => {
    let list = products;
    if (selectedBrands.length > 0) {
      list = list.filter((p) => selectedBrands.includes(p.brand));
    }
    if (maxPrice !== null) {
      list = list.filter((p) => p.price <= maxPrice);
    }
    return sortProducts(list, sort);
  }, [products, selectedBrands, maxPrice, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleBrand = (brand) => {
    setPage(1);
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  if (products.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>🗂️</span>
        <h2 className={styles.emptyHeading}>No products yet in {categoryName}</h2>
        <p className={styles.emptyText}>
          We&apos;re still stocking this category — check back soon or browse other categories.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.filters}>
        <h2 className={styles.filtersHeading}>Filters</h2>

        {availableBrands.length > 1 && (
          <div className={styles.filterGroup}>
            <h3 className={styles.filterGroupHeading}>Brand</h3>
            {availableBrands.map((brand) => (
              <label key={brand} className={styles.filterOption}>
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleBrand(brand)}
                />
                {brand}
              </label>
            ))}
          </div>
        )}

        {priceCeiling > 0 && (
          <div className={styles.filterGroup}>
            <h3 className={styles.filterGroupHeading}>Max Price</h3>
            <input
              type="range"
              min="0"
              max={priceCeiling}
              value={maxPrice ?? priceCeiling}
              onChange={(e) => {
                setPage(1);
                setMaxPrice(Number(e.target.value));
              }}
              className={styles.rangeInput}
            />
            <span className={styles.rangeValue}>Up to ${maxPrice ?? priceCeiling}</span>
          </div>
        )}

        {(selectedBrands.length > 0 || maxPrice !== null) && (
          <button
            type="button"
            className={styles.clearFilters}
            onClick={() => {
              setSelectedBrands([]);
              setMaxPrice(null);
              setPage(1);
            }}
          >
            Clear filters
          </button>
        )}
      </aside>

      <div className={styles.resultsCol}>
        <div className={styles.resultsBar}>
          <span className={styles.resultsCount}>
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </span>
          <label className={styles.sortLabel}>
            Sort by
            <select
              className={styles.sortSelect}
              value={sort}
              onChange={(e) => {
                setPage(1);
                setSort(e.target.value);
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔍</span>
            <h2 className={styles.emptyHeading}>No products match your filters</h2>
            <p className={styles.emptyText}>Try clearing a filter to see more results.</p>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {pageItems.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
