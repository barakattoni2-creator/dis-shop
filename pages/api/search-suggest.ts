import type { NextApiRequest, NextApiResponse } from "next";
import {
  searchProductSuggestions,
  fetchTrendingProducts,
  fetchProductSuggestionsByIds,
} from "@/services/db/products";

// Public, unauthenticated — powers the header search bar's live
// autocomplete dropdown. With no `q` (or a blank one) it returns trending
// products only, so the same endpoint covers both the "focused, empty
// input" and "typing" states the dropdown needs. An optional `ids` (comma
// separated) resolves localStorage-tracked recently-viewed product ids
// into displayable cards.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const q = typeof req.query.q === "string" ? req.query.q : "";
  const idsParam = typeof req.query.ids === "string" ? req.query.ids : "";
  const ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const [products, trending, recentlyViewed] = await Promise.all([
    q.trim() ? searchProductSuggestions(q, 6).catch(() => []) : Promise.resolve([]),
    fetchTrendingProducts(6).catch(() => []),
    ids.length ? fetchProductSuggestionsByIds(ids).catch(() => []) : Promise.resolve([]),
  ]);

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ products, trending, recentlyViewed });
}
