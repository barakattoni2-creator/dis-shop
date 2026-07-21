import type { NextApiRequest, NextApiResponse } from "next";
import { isDbConfigured } from "@/lib/db";
import { fetchReviewsForProduct, createReview } from "@/services/db/reviews";

// Public — no login required, matching the rest of the storefront's
// no-account checkout flow. Verified Purchase is earned automatically when
// the submitted email matches a real order for this product.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const productId = req.query.productId as string;
    if (!productId) return res.status(400).json({ error: "productId is required." });
    const reviews = await fetchReviewsForProduct(productId);
    return res.status(200).json({ reviews });
  }

  if (req.method === "POST") {
    if (!isDbConfigured()) {
      return res.status(503).json({
        error: "Reviews aren't available yet — no database connected.",
      });
    }
    const { productId, customerName, email, rating, comment } = req.body || {};
    if (!productId || !customerName?.trim() || !rating) {
      return res.status(400).json({
        error: "productId, customerName and rating are required.",
      });
    }
    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }
    try {
      const review = await createReview({
        productId,
        customerName: customerName.trim(),
        email: email?.trim() || null,
        rating: numericRating,
        comment,
      });
      return res.status(201).json({ review });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
