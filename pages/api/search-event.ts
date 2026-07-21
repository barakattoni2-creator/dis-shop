import type { NextApiRequest, NextApiResponse } from "next";
import { isDbConfigured } from "@/lib/db";
import { logSearchEvent } from "@/services/db/search";

// Public, fire-and-forget — called when a shopper clicks a product from a
// search results page ("click"), or adds one to the cart from that same
// page ("cart"). Powers Admin → Smart Search → Search Analytics.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isDbConfigured()) return res.status(204).end();

  const { term, productId, type } = req.body || {};
  if (!["click", "cart"].includes(type)) {
    return res.status(400).json({ error: "type must be 'click' or 'cart'." });
  }

  await logSearchEvent(term, productId, type);
  return res.status(204).end();
}
