import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, ADMIN_COOKIE_NAME } from "@/lib/auth";

const VALID_STATUSES = ["pending", "paid", "done", "cancelled"];

export async function PATCH(request: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!(await verifySessionToken(token))) {
    return Response.json({ error: "未登入" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();
  const status = body.status;

  if (!VALID_STATUSES.includes(status)) {
    return Response.json({ error: "狀態不正確" }, { status: 400 });
  }

  const order = await prisma.order.update({ where: { id }, data: { status } });
  return Response.json({ order });
}
