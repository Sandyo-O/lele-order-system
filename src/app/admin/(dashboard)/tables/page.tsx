import { headers } from "next/headers";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { createTable, deleteTable } from "../../actions";
import { SavableForm } from "../../SavableForm";

export const dynamic = "force-dynamic";

async function getOrigin() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function TablesPage() {
  const [tables, origin] = await Promise.all([
    prisma.restaurantTable.findMany({ orderBy: { number: "asc" } }),
    getOrigin(),
  ]);

  const tablesWithQr = await Promise.all(
    tables.map(async (t) => {
      const url = `${origin}/order/${t.number}`;
      const qr = await QRCode.toDataURL(url, { margin: 1, width: 240 });
      return { ...t, url, qr };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold mb-1">桌號 / QR code</h1>
        <p className="text-sm text-neutral-500">
          每張圖都是該桌專屬的點餐連結，列印下來護貝貼在桌上即可。若之後網域改變，重新整理這頁就會自動用新網址產生 QR code。
        </p>
      </div>

      <SavableForm action={createTable} className="flex gap-2 items-end">
        <label className="text-sm">
          桌號
          <input
            type="number"
            name="number"
            required
            className="block border border-neutral-300 rounded px-2 py-1.5 w-24"
          />
        </label>
        <label className="text-sm">
          備註（選填，例如：窗邊）
          <input
            name="label"
            className="block border border-neutral-300 rounded px-2 py-1.5"
          />
        </label>
        <button className="bg-amber-600 text-white px-3 py-1.5 rounded-full text-sm">
          新增桌號
        </button>
      </SavableForm>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {tablesWithQr.map((t) => (
          <div key={t.id} className="border border-neutral-200 rounded-xl p-4 text-center bg-white">
            <div className="font-semibold mb-1">
              桌號 {t.number} {t.label ? `（${t.label}）` : ""}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.qr} alt={`桌號 ${t.number} QR code`} className="mx-auto" />
            <p className="text-xs text-neutral-500 mt-2 break-all">{t.url}</p>
            <form action={deleteTable} className="mt-2">
              <input type="hidden" name="id" value={t.id} />
              <button className="text-xs text-red-500 underline">刪除此桌號</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
