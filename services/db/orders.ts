import { prisma, isDbConfigured } from "@/lib/db";
import { upsertCustomer } from "@/services/db/customers";
import type { Order, OrderItem, OrderActivity, Product } from "@/lib/generated/prisma/client";
import type { PaginatedResult } from "@/services/db/adminActivity";

const ORDER_INCLUDE = {
  items: { include: { product: { select: { sku: true, imageUrl: true } } } },
};

type OrderItemWithProduct = OrderItem & { product?: Pick<Product, "sku" | "imageUrl"> | null };
type OrderWithItems = Order & { items: OrderItemWithProduct[]; customer?: { email: string | null } | null };

export interface PlainOrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  sku: string | null;
  imageUrl: string | null;
}

export interface PlainOrder {
  id: string;
  customerName: string;
  phone: string | null;
  state: string | null;
  deliveryZone: string | null;
  address: string | null;
  notes: string | null;
  payment: string | null;
  status: string;
  paymentStatus: string;
  discount: number | null;
  deliveryFee: number | null;
  archived: boolean;
  total: number;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  deliveryMapUrl: string | null;
  deliveryLocationLabel: string | null;
  items: PlainOrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

function toPlain(row: OrderWithItems): PlainOrder {
  return {
    id: row.id,
    customerName: row.customerName,
    phone: row.phone,
    state: row.state,
    deliveryZone: row.deliveryZone,
    address: row.address,
    notes: row.notes,
    payment: row.payment,
    status: row.status,
    paymentStatus: row.paymentStatus,
    discount: row.discount,
    deliveryFee: row.deliveryFee,
    archived: row.archived,
    total: row.total,
    deliveryLatitude: row.deliveryLatitude,
    deliveryLongitude: row.deliveryLongitude,
    deliveryMapUrl: row.deliveryMapUrl,
    deliveryLocationLabel: row.deliveryLocationLabel,
    items: row.items.map((item) => ({
      id: item.productId || item.id,
      name: item.name,
      price: item.price,
      qty: item.qty,
      sku: item.product?.sku ?? null,
      imageUrl: item.product?.imageUrl ?? null,
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export interface PlainOrderActivity {
  id: string;
  type: string;
  message: string;
  actor: string | null;
  createdAt: Date;
}

function activityToPlain(row: OrderActivity): PlainOrderActivity {
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    actor: row.actor,
    createdAt: row.createdAt,
  };
}

export async function fetchOrders(): Promise<PlainOrder[]> {
  if (!isDbConfigured()) return [];
  const rows = await prisma!.order.findMany({
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toPlain);
}

// Order numbers aren't a stored column — they're a same-year sequential
// rank computed at read time (see findOrderByNumberAndPhone below). This
// assigns that same rank to a whole batch of rows in one pass, so the list,
// search, export and detail views all agree on the same number.
function withOrderNumbers(rows: Order[]): Map<string, string> {
  const perYearCount = new Map<number, number>();
  const sorted = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const numbered = new Map<string, string>();
  for (const row of sorted) {
    const year = row.createdAt.getFullYear();
    const next = (perYearCount.get(year) || 0) + 1;
    perYearCount.set(year, next);
    numbered.set(row.id, `DIS-WEB-${year}-${String(next).padStart(4, "0")}`);
  }
  return numbered;
}

export async function logOrderActivity(
  orderId: string,
  type: string,
  message: string,
  actor: string | null = null
): Promise<PlainOrderActivity | null> {
  if (!isDbConfigured()) return null;
  const row = await prisma!.orderActivity.create({ data: { orderId, type, message, actor } });
  return activityToPlain(row);
}

export interface CartItemInput {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface CreateDbOrderInput {
  customerName: string;
  email?: string | null;
  phone?: string | null;
  state?: string | null;
  deliveryZone?: string | null;
  address?: string | null;
  notes?: string | null;
  payment?: string | null;
  items: CartItemInput[];
  total: number;
  discount?: number | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  deliveryMapUrl?: string | null;
  deliveryLocationLabel?: string | null;
}

export async function createDbOrder({
  customerName,
  email,
  phone,
  state,
  deliveryZone,
  address,
  notes,
  payment,
  items,
  total,
  discount,
  deliveryLatitude,
  deliveryLongitude,
  deliveryMapUrl,
  deliveryLocationLabel,
}: CreateDbOrderInput): Promise<(PlainOrder & { orderNumber: string }) | null> {
  if (!isDbConfigured()) return null;

  const customer = email
    ? await upsertCustomer({ name: customerName, email, phone: phone ?? undefined })
    : null;

  // Only link productId when it's a real row in this database — cart items
  // can also be static fallback products (ids like "p1") that don't exist
  // as Product rows, which would otherwise violate the foreign key.
  const existingProducts = await prisma!.product.findMany({
    where: { id: { in: items.map((item) => item.id) } },
    select: { id: true },
  });
  const knownIds = new Set(existingProducts.map((p) => p.id));

  const row = await prisma!.order.create({
    data: {
      customerId: customer?.id ?? null,
      customerName,
      phone,
      state,
      deliveryZone,
      address,
      notes,
      payment,
      total,
      discount: discount ?? null,
      deliveryLatitude: deliveryLatitude ?? null,
      deliveryLongitude: deliveryLongitude ?? null,
      deliveryMapUrl: deliveryMapUrl || null,
      deliveryLocationLabel: deliveryLocationLabel || null,
      items: {
        create: items.map((item) => ({
          productId: knownIds.has(item.id) ? item.id : null,
          name: item.name,
          price: item.price,
          qty: item.qty,
        })),
      },
    },
    include: ORDER_INCLUDE,
  });

  // Human-readable order number for the confirmation screen — computed at
  // read time from a same-year count rather than a stored column, so it
  // needs no schema change.
  const yearStart = new Date(row.createdAt.getFullYear(), 0, 1);
  const sequence = await prisma!.order.count({
    where: { createdAt: { gte: yearStart, lte: row.createdAt } },
  });
  const orderNumber = `DIS-WEB-${row.createdAt.getFullYear()}-${String(sequence).padStart(4, "0")}`;

  await logOrderActivity(
    row.id,
    "created",
    `Order placed — ${items.length} item${items.length === 1 ? "" : "s"}, total $${Number(total).toFixed(2)}.`
  );

  return { ...toPlain(row), orderNumber };
}

function normalizePhone(phone: string | null | undefined): string {
  const digits = String(phone || "").replace(/\D/g, "");
  // Compare local numbers only, so "0923600599", "923600599" and
  // "211923600599" (with/without the South Sudan country code or leading
  // trunk 0) all match the same underlying number.
  if (digits.startsWith("211") && digits.length > 9) return digits.slice(-9);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

const ORDER_NUMBER_RE = /^DIS-WEB-(\d{4})-(\d+)$/i;

// Order numbers aren't a stored column (see the comment in createDbOrder) —
// they're a same-year sequential rank computed at read time. To look one up,
// re-derive that same rank and phone-match against it. Returns null for any
// mismatch (bad format, no such rank, wrong phone) so callers can respond
// with one uniform "not found" for every case, never leaking which part failed.
export async function findOrderByNumberAndPhone(
  orderNumber: string | null | undefined,
  phone: string | null | undefined
): Promise<(PlainOrder & { orderNumber: string }) | null> {
  if (!isDbConfigured()) return null;
  const match = ORDER_NUMBER_RE.exec(String(orderNumber || "").trim());
  if (!match) return null;

  const year = Number(match[1]);
  const sequence = Number(match[2]);
  if (!sequence || sequence < 1) return null;

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  const rows = await prisma!.order.findMany({
    where: { createdAt: { gte: yearStart, lt: yearEnd } },
    orderBy: { createdAt: "asc" },
    include: ORDER_INCLUDE,
  });

  const row = rows[sequence - 1];
  if (!row) return null;

  const inputPhone = normalizePhone(phone);
  if (!inputPhone || inputPhone !== normalizePhone(row.phone)) return null;

  return { ...toPlain(row), orderNumber: `DIS-WEB-${year}-${String(sequence).padStart(4, "0")}` };
}

export async function updateOrderStatus(id: string, status: string): Promise<PlainOrder> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const row = await prisma!.order.update({
    where: { id },
    data: { status },
    include: ORDER_INCLUDE,
  });
  await logOrderActivity(id, "status_changed", `Status changed to "${status}".`);
  return toPlain(row);
}

export interface CreateOrderInput {
  customerName: string;
  phone?: string | null;
  state?: string | null;
  deliveryZone?: string | null;
  address?: string | null;
  notes?: string | null;
  payment?: string | null;
  status?: string | null;
  items: Array<{ name: string; price: number | string; qty: number | string }>;
  actor?: string | null;
}

// Admin-authored order: no checkout flow behind it, so items are plain
// name/price/qty rows rather than linked to real Product records.
export async function createOrder({
  customerName,
  phone,
  state,
  deliveryZone,
  address,
  notes,
  payment,
  status,
  items,
  actor = null,
}: CreateOrderInput): Promise<PlainOrder> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
  const row = await prisma!.order.create({
    data: {
      customerName,
      phone: phone || null,
      state: state || null,
      deliveryZone: deliveryZone || null,
      address: address || null,
      notes: notes || null,
      payment: payment || null,
      status: status || "Order Received",
      total,
      items: {
        create: items.map((item) => ({
          name: item.name,
          price: Number(item.price),
          qty: Number(item.qty),
        })),
      },
    },
    include: ORDER_INCLUDE,
  });
  await logOrderActivity(
    row.id,
    "created",
    `Order created by admin — ${items.length} item${items.length === 1 ? "" : "s"}, total $${total.toFixed(2)}.`,
    actor
  );
  return toPlain(row);
}

export interface UpdateOrderInput {
  customerName?: string;
  phone?: string | null;
  state?: string | null;
  deliveryZone?: string | null;
  address?: string | null;
  notes?: string | null;
  payment?: string | null;
  status?: string;
  paymentStatus?: string;
  discount?: number | null;
  deliveryFee?: number | null;
  archived?: boolean;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  deliveryMapUrl?: string | null;
  deliveryLocationLabel?: string | null;
}

export async function updateOrder(
  id: string,
  patch: UpdateOrderInput,
  actor: string | null = null
): Promise<PlainOrder> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  const data: Record<string, unknown> = {};
  for (const field of [
    "customerName",
    "phone",
    "state",
    "deliveryZone",
    "address",
    "notes",
    "payment",
    "status",
    "paymentStatus",
    "discount",
    "deliveryFee",
    "archived",
    "deliveryLatitude",
    "deliveryLongitude",
    "deliveryMapUrl",
    "deliveryLocationLabel",
  ] as const) {
    if (field in patch) data[field] = patch[field];
  }
  const row = await prisma!.order.update({ where: { id }, data, include: ORDER_INCLUDE });

  if ("status" in patch) {
    await logOrderActivity(id, "status_changed", `Status changed to "${patch.status}".`, actor);
  }
  if ("paymentStatus" in patch) {
    await logOrderActivity(
      id,
      "payment_updated",
      `Payment status changed to "${patch.paymentStatus}".`,
      actor
    );
  }
  if ("archived" in patch) {
    await logOrderActivity(id, "note", patch.archived ? "Order archived." : "Order unarchived.", actor);
  }

  return toPlain(row);
}

export async function deleteOrder(id: string): Promise<true> {
  if (!isDbConfigured()) throw new Error("Database not configured.");
  await prisma!.order.delete({ where: { id } });
  return true;
}

export interface OrdersAdminFilters {
  q?: string;
  status?: string;
  payment?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
}

export type PlainOrderWithNumber = PlainOrder & { orderNumber: string };

// Paginated, filtered, searchable list for Admin → Orders. Order numbers
// aren't stored, so every order matching the non-text filters is fetched and
// numbered first, THEN the order-number/name/phone search and pagination
// are applied in memory — fine at this store's scale (same approach as
// findOrderByNumberAndPhone above).
export async function fetchOrdersForAdmin({
  q = "",
  status = "",
  payment = "",
  paymentStatus = "",
  dateFrom = "",
  dateTo = "",
  includeArchived = false,
  page = 1,
  pageSize = 20,
}: OrdersAdminFilters = {}): Promise<PaginatedResult<PlainOrderWithNumber>> {
  if (!isDbConfigured()) return { rows: [], total: 0, page, pageSize };

  const where: Record<string, unknown> = {};
  if (!includeArchived) where.archived = false;
  if (status) where.status = status;
  if (payment) where.payment = payment;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (dateFrom || dateTo) {
    const createdAt: { gte?: Date; lt?: Date } = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setDate(end.getDate() + 1);
      createdAt.lt = end;
    }
    where.createdAt = createdAt;
  }

  const allRows = await prisma!.order.findMany({
    where,
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  const orderNumbers = withOrderNumbers(allRows);
  let plain: PlainOrderWithNumber[] = allRows.map((row) => ({
    ...toPlain(row),
    orderNumber: orderNumbers.get(row.id) as string,
  }));

  const needle = q.trim().toLowerCase();
  if (needle) {
    plain = plain.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(needle) ||
        o.customerName.toLowerCase().includes(needle) ||
        (o.phone || "").toLowerCase().includes(needle)
    );
  }

  const total = plain.length;
  const start = (page - 1) * pageSize;
  const rows = plain.slice(start, start + pageSize);

  return { rows, total, page, pageSize };
}

// Same filters as fetchOrdersForAdmin but unpaginated — used by CSV export.
export async function fetchOrdersForExport(filters: OrdersAdminFilters = {}): Promise<PlainOrderWithNumber[]> {
  const { rows } = await fetchOrdersForAdmin({ ...filters, page: 1, pageSize: Number.MAX_SAFE_INTEGER });
  return rows;
}

export async function fetchOrderDetail(
  id: string
): Promise<(PlainOrder & { email: string | null; orderNumber: string; activities: PlainOrderActivity[] }) | null> {
  if (!isDbConfigured()) return null;
  const row = await prisma!.order.findUnique({
    where: { id },
    include: { ...ORDER_INCLUDE, customer: { select: { email: true } } },
  });
  if (!row) return null;

  const year = row.createdAt.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const sequence = await prisma!.order.count({
    where: { createdAt: { gte: yearStart, lte: row.createdAt } },
  });
  const orderNumber = `DIS-WEB-${year}-${String(sequence).padStart(4, "0")}`;

  const activities = await prisma!.orderActivity.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "desc" },
  });

  return {
    ...toPlain(row),
    email: row.customer?.email ?? null,
    orderNumber,
    activities: activities.map(activityToPlain),
  };
}

export interface OrderSummaryStats {
  newOrders: number;
  confirmed: number;
  preparing: number;
  outForDelivery: number;
  deliveredToday: number;
  totalSalesToday: number;
}

// Dashboard summary cards. "Delivered Today" and "Total Sales Today" use
// server-local midnight — good enough for a single-timezone shop. Legacy
// status strings ("Pending", "Shipped") are folded into their nearest
// new-vocabulary bucket so old orders still count somewhere sensible.
export async function fetchOrderSummaryStats(): Promise<OrderSummaryStats> {
  if (!isDbConfigured()) {
    return {
      newOrders: 0,
      confirmed: 0,
      preparing: 0,
      outForDelivery: 0,
      deliveredToday: 0,
      totalSalesToday: 0,
    };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [newOrders, confirmed, preparing, outForDelivery, deliveredToday, todaysOrders] =
    await Promise.all([
      prisma!.order.count({ where: { status: { in: ["Order Received", "Pending"] }, archived: false } }),
      prisma!.order.count({ where: { status: "Confirmed", archived: false } }),
      prisma!.order.count({ where: { status: "Preparing", archived: false } }),
      prisma!.order.count({
        where: { status: { in: ["Out for Delivery", "Shipped"] }, archived: false },
      }),
      prisma!.order.count({
        where: { status: "Delivered", updatedAt: { gte: todayStart }, archived: false },
      }),
      prisma!.order.findMany({
        where: { createdAt: { gte: todayStart }, archived: false },
        select: { total: true },
      }),
    ]);

  const totalSalesToday = todaysOrders.reduce((sum, o) => sum + o.total, 0);

  return { newOrders, confirmed, preparing, outForDelivery, deliveredToday, totalSalesToday };
}
