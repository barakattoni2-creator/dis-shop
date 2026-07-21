import type { NextApiRequest, NextApiResponse } from "next";
import { isDbConfigured } from "@/lib/db";
import { createDbOrder } from "@/services/db/orders";
import { isOdooConfigured } from "@/services/odoo/config";
import { executeKw } from "@/services/odoo/client";

// No persistent counter available outside the primary database, so this is
// a reference number for display only — not a claim of true sequential
// order position.
function fallbackOrderNumber(): string {
  const now = new Date();
  return `DIS-WEB-${now.getFullYear()}-${Date.now().toString().slice(-4)}`;
}

interface OrderCustomer {
  id?: string | number;
  name: string;
  email?: string;
  phone?: string;
  state?: string;
  deliveryZone?: string;
  address?: string;
  notes?: string;
  payment?: string;
  discount?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryMapUrl?: string;
  deliveryLocationLabel?: string;
}

interface OrderItemInput {
  odooId?: number;
  qty: number;
  price: number;
  [key: string]: unknown;
}

async function createOdooOrder({
  customer,
  items,
  total,
}: {
  customer: OrderCustomer;
  items: OrderItemInput[];
  total: number;
}) {
  const orderLines = items.map((item) => [
    0,
    0,
    { product_id: item.odooId, product_uom_qty: item.qty, price_unit: item.price },
  ]);
  const odooOrderId = await executeKw("sale.order", "create", [
    [{ partner_id: customer.id, order_line: orderLines }],
  ]);
  return {
    id: String(odooOrderId),
    orderNumber: fallbackOrderNumber(),
    date: new Date().toISOString(),
    customer,
    items,
    total,
    status: "Order Received",
    deliveryLatitude: customer.deliveryLatitude,
    deliveryLongitude: customer.deliveryLongitude,
    deliveryMapUrl: customer.deliveryMapUrl,
    deliveryLocationLabel: customer.deliveryLocationLabel,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { customer, items, total } = req.body || {};
  if (!customer || !items?.length || !total) {
    return res.status(400).json({ error: "customer, items and total are required." });
  }

  if (isDbConfigured()) {
    try {
      const dbOrder = await createDbOrder({
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        state: customer.state,
        deliveryZone: customer.deliveryZone,
        address: customer.address,
        notes: customer.notes,
        payment: customer.payment,
        items,
        total,
        discount: customer.discount,
        deliveryLatitude: customer.deliveryLatitude,
        deliveryLongitude: customer.deliveryLongitude,
        deliveryMapUrl: customer.deliveryMapUrl,
        deliveryLocationLabel: customer.deliveryLocationLabel,
      });
      return res.status(201).json({
        order: {
          id: dbOrder!.id,
          orderNumber: dbOrder!.orderNumber,
          date: dbOrder!.createdAt,
          customer,
          items: dbOrder!.items,
          total: dbOrder!.total,
          status: dbOrder!.status,
          paymentStatus: dbOrder!.paymentStatus,
          discount: dbOrder!.discount,
          deliveryLatitude: dbOrder!.deliveryLatitude,
          deliveryLongitude: dbOrder!.deliveryLongitude,
          deliveryMapUrl: dbOrder!.deliveryMapUrl,
          deliveryLocationLabel: dbOrder!.deliveryLocationLabel,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }

  if (isOdooConfigured()) {
    try {
      const order = await createOdooOrder({ customer, items, total });
      return res.status(201).json({ order });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  }

  // No database or Odoo configured yet — return a locally-scoped order so
  // checkout still works; it's stored in the shopper's browser only (see
  // StoreContext).
  return res.status(201).json({
    order: {
      id: `DIS-${Date.now().toString(36).toUpperCase()}`,
      orderNumber: fallbackOrderNumber(),
      date: new Date().toISOString(),
      customer,
      items,
      total,
      status: "Order Received",
      deliveryLatitude: customer.deliveryLatitude,
      deliveryLongitude: customer.deliveryLongitude,
      deliveryMapUrl: customer.deliveryMapUrl,
      deliveryLocationLabel: customer.deliveryLocationLabel,
    },
  });
}
