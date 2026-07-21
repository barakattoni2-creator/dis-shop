import type { NextApiRequest, NextApiResponse } from "next";
import { isDbConfigured } from "@/lib/db";
import { logSearch } from "@/services/db/search";

// Public, fire-and-forget — called by pages/search.js once per query after
// results are computed, so "Most Searched Terms" and "No-Result Searches"
// in Admin reflect real storefront activity.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isDbConfigured()) return res.status(204).end();

  const { term, resultCount } = req.body || {};
  if (!term || typeof term !== "string") {
    return res.status(400).json({ error: "term is required." });
  }

  await logSearch(term, resultCount);
  return res.status(204).end();
}
