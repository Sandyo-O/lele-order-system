import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [storeName, tableCount] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "storeName" } }),
    prisma.restaurantTable.count(),
  ]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
      <h1 className="text-2xl font-semibold text-red-900">{storeName?.value ?? "樂樂雞"} 線上點餐系統</h1>
      <p className="text-stone-500 text-sm">
        客人請掃描桌上的 QR code 進入點餐頁面（共 {tableCount} 桌）。
      </p>
      <div className="flex gap-3">
        <Link href="/counter" className="bg-red-700 text-white px-5 py-2.5 rounded-full text-sm font-medium">
          櫃台訂單
        </Link>
        <Link href="/admin" className="border border-stone-300 px-5 py-2.5 rounded-full text-sm font-medium">
          後台管理
        </Link>
      </div>
    </div>
  );
}
