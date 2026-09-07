"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkAdminPassword, createSessionToken, ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!checkAdminPassword(password)) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  redirect(next.startsWith("/") ? next : "/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}

function parseAddOnsText(text: string): string {
  const lines = String(text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const addOns = lines
    .map((line) => {
      const [name, priceStr] = line.split("=").map((s) => s.trim());
      const price = Number(priceStr);
      if (!name || !Number.isFinite(price)) return null;
      return { name, price };
    })
    .filter((a): a is { name: string; price: number } => a !== null);
  return JSON.stringify(addOns);
}

function numOrNull(value: FormDataEntryValue | null): number | null {
  const str = String(value ?? "").trim();
  if (str === "") return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

function dailyChoiceTypeOrNull(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "");
  return str === "soup" || str === "vegetable" ? str : null;
}

export type ActionResult = { ok: boolean; message?: string } | null;

export async function createCategory(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "請輸入分類名稱" };
  const count = await prisma.category.count();
  await prisma.category.create({ data: { name, sortOrder: count + 1 } });
  revalidatePath("/admin");
  return { ok: true, message: "已新增分類" };
}

export async function deleteCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function createMenuItem(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const categoryId = String(formData.get("categoryId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!categoryId || !name) return { ok: false, message: "請輸入品名" };

  const tags = formData.getAll("tags").map(String).join(",");
  const count = await prisma.menuItem.count({ where: { categoryId } });

  await prisma.menuItem.create({
    data: {
      categoryId,
      name,
      singlePrice: numOrNull(formData.get("singlePrice")),
      comboPrice: numOrNull(formData.get("comboPrice")),
      isMarketPrice: formData.get("isMarketPrice") === "on",
      tags: tags || null,
      addOns: parseAddOnsText(String(formData.get("addOnsText") ?? "")),
      note: String(formData.get("note") ?? "").trim() || null,
      dailyChoiceType: dailyChoiceTypeOrNull(formData.get("dailyChoiceType")),
      singleVariantStyle: String(formData.get("singleVariantStyle") ?? "toggle"),
      sortOrder: count + 1,
    },
  });
  revalidatePath("/admin");
  return { ok: true, message: "已新增品項" };
}

export async function updateMenuItem(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return { ok: false, message: "請輸入品名" };

  const tags = formData.getAll("tags").map(String).join(",");

  await prisma.menuItem.update({
    where: { id },
    data: {
      name,
      singlePrice: numOrNull(formData.get("singlePrice")),
      comboPrice: numOrNull(formData.get("comboPrice")),
      isMarketPrice: formData.get("isMarketPrice") === "on",
      tags: tags || null,
      addOns: parseAddOnsText(String(formData.get("addOnsText") ?? "")),
      note: String(formData.get("note") ?? "").trim() || null,
      dailyChoiceType: dailyChoiceTypeOrNull(formData.get("dailyChoiceType")),
      singleVariantStyle: String(formData.get("singleVariantStyle") ?? "toggle"),
      isAvailable: formData.get("isAvailable") === "on",
    },
  });
  revalidatePath("/admin");
  return { ok: true, message: "已儲存" };
}

export async function deleteMenuItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.menuItem.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function moveMenuItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) return;

  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) return;

  const siblings = await prisma.menuItem.findMany({
    where: { categoryId: item.categoryId },
    orderBy: { sortOrder: "asc" },
  });
  const index = siblings.findIndex((s) => s.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return;

  const neighbor = siblings[swapIndex];
  await prisma.$transaction([
    prisma.menuItem.update({ where: { id: item.id }, data: { sortOrder: neighbor.sortOrder } }),
    prisma.menuItem.update({ where: { id: neighbor.id }, data: { sortOrder: item.sortOrder } }),
  ]);
  revalidatePath("/admin");
}

export async function createTable(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const number = Number(formData.get("number"));
  const label = String(formData.get("label") ?? "").trim() || null;
  if (!Number.isFinite(number)) return { ok: false, message: "請輸入桌號" };
  await prisma.restaurantTable.create({ data: { number, label } });
  revalidatePath("/admin/tables");
  return { ok: true, message: "已新增桌號" };
}

export async function deleteTable(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.restaurantTable.delete({ where: { id } });
  revalidatePath("/admin/tables");
}

export async function updateSettings(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const keys = ["storeName", "phone", "address", "hours", "closedDays", "orderNote", "dailyVegOptions"];
  const dailySoupOptions = formData.getAll("dailySoupOptions").map(String).join("\n");

  await Promise.all([
    ...keys.map((key) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(formData.get(key) ?? "") },
        create: { key, value: String(formData.get(key) ?? "") },
      })
    ),
    prisma.setting.upsert({
      where: { key: "dailySoupOptions" },
      update: { value: dailySoupOptions },
      create: { key: "dailySoupOptions", value: dailySoupOptions },
    }),
  ]);
  revalidatePath("/admin/settings");
  return { ok: true, message: "已儲存" };
}
