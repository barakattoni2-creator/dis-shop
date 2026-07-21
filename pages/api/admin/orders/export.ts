import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/data/adminRoles";
import { isDbConfigured } from "@/lib/db";
import { fetchOrdersForExport } from "@/services/db/orders";
import { fetchSettings } from "@/services/db/settings";
import { toCsv } from "@/utils/csv";
import { SSP_PER_USD } from "@/data/currency";
import { displayStatus } from "@/data/orderStatuses";

const COLUMNS = [
  "orderNumber",
  "customerName",
  "phone",
  "deliveryArea",
  "totalUsd",
  "totalSsp",
  "paymentMethod",
  "orderStatus",
  "paymentStatus",
  "orderDate",
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res, PERMISSIONS.MANAGE_ORDERS);
  if (!session) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isDbConfigured()) {
    return res.status(503).json({
      error: "No database connected. Set DATABASE_URL in .env.local (see .env.example).",
    });
  }

  const { q = "", status = "", payment = "", paymentStatus = "", dateFrom = "", dateTo = "", archived = "" } =
    req.query;

  const [orders, settings] = await Promise.all([
    fetchOrdersForExport({
      q: String(q),
      status: String(status),
      payment: String(payment),
      paymentStatus: String(paymentStatus),
      dateFrom: String(dateFrom),
      dateTo: String(dateTo),
      includeArchived: archived === "true",
    }),
    fetchSettings(),
  ]);

  const rate = Number(settings.exchangeRate) || SSP_PER_USD;

  const csv = toCsv(
    orders.map((o) => ({
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      phone: o.phone || "",
      deliveryArea: o.deliveryZone || "",
      totalUsd: o.total.toFixed(2),
      totalSsp: Math.round(o.total * rate),
      paymentMethod: o.payment || "",
      orderStatus: displayStatus(o.status),
      paymentStatus: o.paymentStatus,
      orderDate: o.createdAt.toISOString(),
    })),
    COLUMNS
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="dis-shop-orders.csv"');
  return res.status(200).send(csv);
}
