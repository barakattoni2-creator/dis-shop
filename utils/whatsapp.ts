import { WHATSAPP_NUMBER } from "@/data/contact";
import { formatPrice } from "@/utils/format";
import type { PlainProduct } from "@/types/domain";

function buildLink(message: string, whatsappNumber: string): string {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function buildProductOrderLink(
  product: Pick<PlainProduct, "name" | "price">,
  whatsappNumber: string = WHATSAPP_NUMBER,
  qty = 1
): string {
  const message =
    qty > 1
      ? `Hi DIS Shop, I'd like to order:\n\n${product.name} × ${qty} — ${formatPrice(
          product.price * qty
        )}\n\nIs it available?`
      : `Hi DIS Shop, I'd like to order:\n\n${product.name} — ${formatPrice(
          product.price
        )}\n\nIs it available?`;
  return buildLink(message, whatsappNumber);
}

// Used by the Prefab & Projects category pages, where most "products" are
// really services (site camps, quotation requests, etc.) with no fixed
// price to add to a cart.
export function buildQuoteRequestLink(categoryName: string, whatsappNumber: string = WHATSAPP_NUMBER): string {
  const message = `Hi DIS Shop, I'd like to request a quotation for: ${categoryName}.\n\nCould you share more details?`;
  return buildLink(message, whatsappNumber);
}

export interface CartOrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface CartOrderDetails {
  name?: string;
  phone?: string;
  state?: string;
  city?: string;
  address?: string;
  notes?: string;
  orderNumber?: string;
  mapUrl?: string;
}

// `details` is optional — when supplied (e.g. from the checkout form), the
// message is enriched with whatever the shopper has filled in so far.
export function buildCartOrderLink(
  items: CartOrderItem[],
  total: number,
  whatsappNumber: string = WHATSAPP_NUMBER,
  details: CartOrderDetails | null = null
): string {
  const lines = items.map(
    (item) => `• ${item.name} × ${item.qty} — ${formatPrice(item.price * item.qty)}`
  );
  let message = `Hi DIS Shop, I'd like to order:\n\n${lines.join(
    "\n"
  )}\n\nTotal: ${formatPrice(total)}`;

  if (details) {
    const { name, phone, state, city, address, notes, orderNumber, mapUrl } = details;
    const deliveryLines: string[] = [];
    if (name) deliveryLines.push(`Name: ${name}`);
    if (phone) deliveryLines.push(`Phone: ${phone}`);
    if (state || city) deliveryLines.push(`Location: ${[city, state].filter(Boolean).join(", ")}`);
    if (address) deliveryLines.push(`Address: ${address}`);
    if (notes) deliveryLines.push(`Notes: ${notes}`);
    if (mapUrl) deliveryLines.push(`Pinned Location: ${mapUrl}`);
    if (deliveryLines.length > 0) {
      message += `\n\nDelivery Details:\n${deliveryLines.join("\n")}`;
    }
    if (orderNumber) {
      message = `Hi DIS Shop, following up on my order ${orderNumber}:\n\n${lines.join(
        "\n"
      )}\n\nTotal: ${formatPrice(total)}`;
      if (mapUrl) message += `\n\nPinned Location: ${mapUrl}`;
    }
  }

  return buildLink(message, whatsappNumber);
}
