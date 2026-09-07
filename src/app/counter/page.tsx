import { prisma } from "@/lib/prisma";
import { getTodayStats } from "@/lib/stats";
import CounterClient from "./CounterClient";

export const dynamic = "force-dynamic";

export default async function CounterPage() {
  const [orders, stats] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ["pending", "paid"] } },
      include: { table: true, items: true },
      orderBy: { createdAt: "asc" },
    }),
    getTodayStats(),
  ]);

  return (
    <CounterClient initialOrders={JSON.parse(JSON.stringify(orders))} initialStats={stats} />
  );
}
