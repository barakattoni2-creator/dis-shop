import { prisma, isDbConfigured } from "@/lib/db";
import type { Review } from "@/lib/generated/prisma/client";
import type { PlainReview } from "@/types/domain";

function toPlain(row: Review): PlainReview {
  return {
    id: row.id,
    customerName: row.customerName,
    rating: row.rating,
    comment: row.comment,
    verified: row.verified,
    createdAt: row.createdAt,
  };
}

export async function fetchReviewsForProduct(productId: string): Promise<PlainReview[]> {
  if (!isDbConfigured()) return [];
  const rows = await prisma!.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toPlain);
}

// Keeps Product.rating/Product.reviews (shown across the whole storefront —
// cards, hero, etc.) in sync with the real review rows, rather than leaving
// them as the static numbers an admin typed in.
async function recalcProductRating(productId: string): Promise<void> {
  const agg = await prisma!.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma!.product.update({
    where: { id: productId },
    data: {
      rating: agg._avg.rating ?? 4.5,
      reviews: agg._count.rating,
    },
  });
}

export interface CreateReviewInput {
  productId: string;
  customerName: string;
  email?: string | null;
  rating: number;
  comment?: string | null;
}

export async function createReview({
  productId,
  customerName,
  email,
  rating,
  comment,
}: CreateReviewInput): Promise<PlainReview> {
  if (!isDbConfigured()) throw new Error("Database not configured.");

  // A review from a real customer whose email matches an order that
  // actually contains this product earns the "Verified Purchase" badge.
  let verified = false;
  if (email) {
    const customer = await prisma!.customer.findUnique({ where: { email } });
    if (customer) {
      const orderCount = await prisma!.orderItem.count({
        where: { productId, order: { customerId: customer.id } },
      });
      verified = orderCount > 0;
    }
  }

  const row = await prisma!.review.create({
    data: {
      productId,
      customerName,
      email: email || null,
      rating: Math.max(1, Math.min(5, Math.round(Number(rating)))),
      comment: comment?.trim() || null,
      verified,
    },
  });

  await recalcProductRating(productId);

  return toPlain(row);
}

export async function deleteReview(id: string): Promise<true> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const row = await prisma!.review.delete({ where: { id } });
  await recalcProductRating(row.productId);
  return true;
}
