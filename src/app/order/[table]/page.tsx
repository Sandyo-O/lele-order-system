import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrderClient from "./OrderClient";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;
  const tableNumber = Number(table);

  if (!Number.isFinite(tableNumber)) notFound();

  const [restaurantTable, categories, settings] = await Promise.all([
    prisma.restaurantTable.findUnique({ where: { number: tableNumber } }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          where: { isAvailable: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    prisma.setting.findMany(),
  ]);

  if (!restaurantTable) notFound();

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const visibleCategories = categories
    .filter((c) => c.items.length > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      items: c.items.map((item) => ({
        id: item.id,
        name: item.name,
        singlePrice: item.singlePrice,
        comboPrice: item.comboPrice,
        isMarketPrice: item.isMarketPrice,
        tags: item.tags,
        addOns: item.addOns,
        note: item.note,
      })),
    }));

  return (
    <OrderClient
      tableNumber={tableNumber}
      tableLabel={restaurantTable.label}
      storeName={settingsMap.storeName ?? "樂樂雞"}
      orderNote={settingsMap.orderNote ?? ""}
      categories={visibleCategories}
    />
  );
}
