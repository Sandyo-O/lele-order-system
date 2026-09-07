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
