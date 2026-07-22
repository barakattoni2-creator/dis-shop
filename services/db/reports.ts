import { prisma, isDbConfigured } from "@/lib/db";

export interface ReportTotals {
  revenue: number;
  orders: number;
  avgOrderValue: number;
  customers: number;
  products: number;
}

export interface DailySales {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string | null;
  name: string;
  qtySold: number;
  revenue: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface ReportsData {
  totals: ReportTotals;
  dailySales: DailySales[];
  topProducts: TopProduct[];
  statusBreakdown: StatusBreakdown[];
}

const EMPTY: ReportsData = {
  totals: { revenue: 0, orders: 0, avgOrderValue: 0, customers: 0, products: 0 },
  dailySales: [],
  topProducts: [],
  statusBreakdown: [],
};

// One aggregation pass over the last `days` of orders — small admin-facing
// report, not a high-traffic query, so pulling matching rows into memory
// and reducing here is simpler than several separate grouped SQL queries
// and plenty fast at this scale.
export async function fetchReportsData(days = 30): Promise<ReportsData> {
  if (!isDbConfigured()) return EMPTY;

  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const [orders, customerCount, productCount] = await Promise.all([
    prisma!.order.findMany({
      where: { createdAt: { gte: since }, archived: false },
      include: { items: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma!.customer.count(),
    prisma!.product.count(),
  ]);

  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totals: ReportTotals = {
    revenue,
    orders: orders.length,
    avgOrderValue: orders.length ? revenue / orders.length : 0,
    customers: customerCount,
    products: productCount,
  };

  const byDay = new Map<string, DailySales>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { date: key, revenue: 0, orders: 0 });
  }
  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.revenue += order.total;
      bucket.orders += 1;
    }
  }

  const productAgg = new Map<string, TopProduct>();
  for (const order of orders) {
    for (const item of order.items) {
      const key = item.productId || item.name;
      const existing = productAgg.get(key) || {
        productId: item.productId,
        name: item.name,
        qtySold: 0,
        revenue: 0,
      };
      existing.qtySold += item.qty;
      existing.revenue += item.price * item.qty;
      productAgg.set(key, existing);
    }
  }
  const topProducts = [...productAgg.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  const statusAgg = new Map<string, number>();
  for (const order of orders) {
    statusAgg.set(order.status, (statusAgg.get(order.status) || 0) + 1);
  }
  const statusBreakdown = [...statusAgg.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totals,
    dailySales: [...byDay.values()],
    topProducts,
    statusBreakdown,
  };
}
