import { prisma } from "@/lib/prisma";
import CounterClient from "./CounterClient";

export const dynamic = "force-dynamic";

export default async function CounterPage() {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["pending", "paid"] } },
    include: { table: true, items: true },
    orderBy: { createdAt: "asc" },
  });

  return <CounterClient initialOrders={JSON.parse(JSON.stringify(orders))} />;
}
