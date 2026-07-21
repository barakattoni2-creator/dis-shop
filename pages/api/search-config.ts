import type { NextApiRequest, NextApiResponse } from "next";
import { fetchActiveSearchConfig } from "@/services/db/search";

// Public, unauthenticated — read by the storefront search page and header
// search bar on every load so admin changes (synonyms, keywords, popular
// terms, priority weights) apply immediately, with no rebuild or restart.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const config = await fetchActiveSearchConfig();
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(config);
}
