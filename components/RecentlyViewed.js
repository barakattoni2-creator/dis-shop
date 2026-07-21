import { useSyncExternalStore } from "react";
import { getRecentlyViewedIds } from "@/lib/recentlyViewed";
import FeaturedProducts from "@/components/FeaturedProducts";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return JSON.stringify(getRecentlyViewedIds());
}

function getServerSnapshot() {
  return "[]";
}

export default function RecentlyViewed({ products }) {
  const idsJson = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ids = JSON.parse(idsJson);
  const byId = new Map(products.map((p) => [p.id, p]));
  const items = ids.map((id) => byId.get(id)).filter(Boolean);

  if (items.length === 0) return null;

  return <FeaturedProducts products={items} heading="Recently Viewed" layout="slider" />;
}
