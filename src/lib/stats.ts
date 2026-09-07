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

export type ItemOccurrence = {
  itemName: string;
  quantity: number;
  amount: number;
  createdAt: string;
  tableNumber: number;
};

export type ReportStats = {
  revenue: number;
  orderCount: number;
  visitCount: number;
  avgSpend: number;
  items: ItemStat[];
  occurrences: ItemOccurrence[];
};

// A table can place several orders in one sitting (加點); those shouldn't count
// as separate guests. But the same table is also reused by a different party
// later the same day. So instead of grouping by calendar day, we cluster each
// table's orders by time gap: consecutive orders less than this far apart are
// treated as the same visit, a bigger gap starts a new one.
const VISIT_GAP_MS = 90 * 60 * 1000; // 90 minutes

function countVisits(orders: { tableNumber: number; createdAt: Date }[]): number {
  const byTable = new Map<number, number[]>();
  for (const o of orders) {
    const arr = byTable.get(o.tableNumber) ?? [];
    arr.push(o.createdAt.getTime());
    byTable.set(o.tableNumber, arr);
  }
  let visits = 0;
  for (const times of byTable.values()) {
    times.sort((a, b) => a - b);
    let last: number | null = null;
    for (const t of times) {
      if (last === null || t - last > VISIT_GAP_MS) visits += 1;
      last = t;
    }
  }
  return visits;
}

export async function getReportStats(start: Date, end: Date): Promise<ReportStats> {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end }, status: { not: "cancelled" } },
    include: { items: true, table: true },
  });

  const revenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  const visitCount = countVisits(orders.map((o) => ({ tableNumber: o.table.number, createdAt: o.createdAt })));
  const avgSpend = visitCount > 0 ? Math.round(revenue / visitCount) : 0;

  const itemMap = new Map<string, ItemStat>();
  const occurrences: ItemOccurrence[] = [];
  for (const order of orders) {
    for (const item of order.items) {
      const cur = itemMap.get(item.nameSnapshot) ?? { name: item.nameSnapshot, quantity: 0, revenue: 0 };
      const amount = item.priceSnapshot * item.quantity;
      cur.quantity += item.quantity;
      cur.revenue += amount;
      itemMap.set(item.nameSnapshot, cur);

      occurrences.push({
        itemName: item.nameSnapshot,
        quantity: item.quantity,
        amount,
        createdAt: order.createdAt.toISOString(),
        tableNumber: order.table.number,
      });
    }
  }
  const items = [...itemMap.values()].sort((a, b) => b.revenue - a.revenue);

  return { revenue, orderCount: orders.length, visitCount, avgSpend, items, occurrences };
}
