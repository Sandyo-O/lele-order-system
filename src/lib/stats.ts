import { prisma } from "@/lib/prisma";

export type TodayStats = {
  revenue: number;
  orderCount: number;
  topItems: { name: string; quantity: number }[];
};

export async function getTodayStats(): Promise<TodayStats> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: startOfDay }, status: { not: "cancelled" } },
    include: { items: true },
  });

  const revenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  const itemCounts = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      itemCounts.set(item.nameSnapshot, (itemCounts.get(item.nameSnapshot) ?? 0) + item.quantity);
    }
  }
  const topItems = [...itemCounts.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  return { revenue, orderCount: orders.length, topItems };
}

export type ItemStat = { name: string; quantity: number; revenue: number };

export type ReportStats = {
  revenue: number;
  orderCount: number;
  visitCount: number;
  avgSpend: number;
  items: ItemStat[];
};

export async function getReportStats(start: Date, end: Date): Promise<ReportStats> {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end }, status: { not: "cancelled" } },
    include: { items: true, table: true },
  });

  const revenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  // "來客數" = distinct table visits (table + calendar day), since one table
  // can place several orders (加點) that shouldn't be counted as separate guests.
  const visitKeys = new Set(orders.map((o) => `${o.table.number}|${o.createdAt.toDateString()}`));
  const visitCount = visitKeys.size;
  const avgSpend = visitCount > 0 ? Math.round(revenue / visitCount) : 0;

  const itemMap = new Map<string, ItemStat>();
  for (const order of orders) {
    for (const item of order.items) {
      const cur = itemMap.get(item.nameSnapshot) ?? { name: item.nameSnapshot, quantity: 0, revenue: 0 };
      cur.quantity += item.quantity;
      cur.revenue += item.priceSnapshot * item.quantity;
      itemMap.set(item.nameSnapshot, cur);
    }
  }
  const items = [...itemMap.values()].sort((a, b) => b.revenue - a.revenue);

  return { revenue, orderCount: orders.length, visitCount, avgSpend, items };
}
