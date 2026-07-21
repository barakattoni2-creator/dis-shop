// Client-safe (no Prisma import) — shared between admin UI, services/db/orders.js
// and the customer-facing tracking pages so they never drift apart.

export const ORDER_STATUSES = [
  "Order Received",
  "Confirmed",
  "Preparing",
  "Ready for Delivery",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["Pending", "Paid", "Partially Paid", "Refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// Orders created before this vocabulary existed may still carry the old
// values — map them to their closest new-vocabulary label for display only;
// never rewritten in the database automatically.
export const LEGACY_STATUS_LABELS: Record<string, string> = {
  Pending: "Order Received",
  Shipped: "Out for Delivery",
};

export function displayStatus(status: string): string {
  return LEGACY_STATUS_LABELS[status] || status;
}

// Badge color *names* only (not CSS classes — CSS Modules are scoped per
// importing file, so each component maps these names to its own `styles`
// object; see the BADGE_CLASS helper in OrdersListTable.js / [id].js).
export const STATUS_BADGE_VARIANT: Record<string, string> = {
  "Order Received": "blue",
  Pending: "blue",
  Confirmed: "navy",
  Preparing: "amber",
  "Ready for Delivery": "purple",
  "Out for Delivery": "orange",
  Shipped: "orange",
  Delivered: "green",
  Cancelled: "red",
  Returned: "gray",
};

export const PAYMENT_STATUS_BADGE_VARIANT: Record<string, string> = {
  Pending: "amber",
  Paid: "green",
  "Partially Paid": "blue",
  Refunded: "gray",
};
