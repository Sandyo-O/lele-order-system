import { prisma } from "@/lib/prisma";
import { parseAddOns, type AddOn } from "@/lib/menu";
import { getTodayStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

type CartItemInput = {
  menuItemId: string;
  quantity: number;
  variant: "single" | "combo" | null;
  selectedAddOns: AddOn[];
  note?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const [orders, stats] = await Promise.all([
    prisma.order.findMany({
      where: status ? { status } : { status: { in: ["pending", "paid"] } },
      include: { table: true, items: true },
      orderBy: { createdAt: "asc" },
    }),
    getTodayStats(),
  ]);

  return Response.json({ orders, stats });
}

export async function POST(request: Request) {
  const body = await request.json();
  const tableNumber = Number(body.tableNumber);
  const cartItems: CartItemInput[] = Array.isArray(body.items) ? body.items : [];
  const note = typeof body.note === "string" ? body.note.slice(0, 500) : null;

  if (!Number.isFinite(tableNumber) || cartItems.length === 0) {
    return Response.json({ error: "訂單資料不完整" }, { status: 400 });
  }

  const table = await prisma.restaurantTable.findUnique({ where: { number: tableNumber } });
  if (!table) {
    return Response.json({ error: "找不到這個桌號" }, { status: 400 });
  }

  const menuItemIds = [...new Set(cartItems.map((i) => i.menuItemId))];
  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } });
  const menuItemById = new Map(menuItems.map((m) => [m.id, m]));

  let totalPrice = 0;
  const orderItemsData: {
    menuItemId: string;
    nameSnapshot: string;
    priceSnapshot: number;
    quantity: number;
    selectedAddOns: string;
    variant: string | null;
    note: string | null;
  }[] = [];

  for (const cartItem of cartItems) {
    const menuItem = menuItemById.get(cartItem.menuItemId);
    if (!menuItem || !menuItem.isAvailable) {
      return Response.json({ error: `品項「${menuItem?.name ?? "未知"}」目前無法點選` }, { status: 400 });
    }

    const quantity = Math.max(1, Math.min(20, Math.floor(cartItem.quantity) || 1));

    const basePrice = cartItem.variant === "combo" ? menuItem.comboPrice : menuItem.singlePrice;
    if (basePrice === null || basePrice === undefined) {
      return Response.json({ error: `品項「${menuItem.name}」為時價，請至櫃台點選` }, { status: 400 });
    }

    const availableAddOns = parseAddOns(menuItem.addOns);
    const selectedAddOns = (cartItem.selectedAddOns ?? []).filter((sel) =>
      availableAddOns.some((a) => a.name === sel.name && a.price === sel.price)
    );
    const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);

    const lineTotal = (basePrice + addOnsTotal) * quantity;
    totalPrice += lineTotal;

    orderItemsData.push({
      menuItemId: menuItem.id,
      nameSnapshot: menuItem.name,
      priceSnapshot: basePrice + addOnsTotal,
      quantity,
      selectedAddOns: JSON.stringify(selectedAddOns),
      variant: cartItem.variant,
      note: cartItem.note?.slice(0, 200) || null,
    });
  }

  const order = await prisma.order.create({
    data: {
      tableId: table.id,
      totalPrice,
      note,
      items: { create: orderItemsData },
    },
    include: { table: true, items: true },
  });

  return Response.json({ order });
}
