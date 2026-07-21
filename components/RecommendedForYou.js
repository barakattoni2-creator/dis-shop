import { useStore } from "@/context/StoreContext";
import FeaturedProducts from "@/components/FeaturedProducts";

export default function RecommendedForYou({ products }) {
  const { wishlist, cart } = useStore();
  const signals = [...wishlist, ...cart];
  const signalCategories = new Set(signals.map((item) => item.category));
  const signalIds = new Set(signals.map((item) => item.id));

  const recommended =
    signalCategories.size > 0
      ? products.filter(
          (p) => signalCategories.has(p.category) && !signalIds.has(p.id)
        )
      : products.filter((p) => p.badge === "Best Seller");

  if (recommended.length === 0) return null;

  return (
    <FeaturedProducts
      products={recommended.slice(0, 8)}
      heading="Recommended For You"
    />
  );
}
