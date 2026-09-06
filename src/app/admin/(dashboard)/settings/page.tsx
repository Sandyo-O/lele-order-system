import { prisma } from "@/lib/prisma";
import { parseDailyListOptions } from "@/lib/menu";
import { updateSettings } from "../../actions";

export const dynamic = "force-dynamic";

const FIELDS: { key: string; label: string }[] = [
  { key: "storeName", label: "店名" },
  { key: "phone", label: "電話" },
  { key: "address", label: "地址" },
  { key: "hours", label: "營業時間" },
  { key: "closedDays", label: "公休日" },
  { key: "orderNote", label: "點餐頁提示文字" },
];

const SOUP_CATEGORY_NAMES = ["我想喝補湯", "媽媽小孩最愛喝"];

export default async function SettingsPage() {
  const [settings, soupItems] = await Promise.all([
    prisma.setting.findMany(),
    prisma.menuItem.findMany({
      where: { category: { name: { in: SOUP_CATEGORY_NAMES } } },
      select: { name: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    }),
  ]);
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const selectedSoups = parseDailyListOptions(map.dailySoupOptions);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">店家設定</h1>
      <form action={updateSettings} className="space-y-3">
        {FIELDS.map((f) => (
          <label key={f.key} className="block text-sm">
            {f.label}
            <input
              name={f.key}
              defaultValue={map[f.key] ?? ""}
              className="w-full border border-neutral-300 rounded px-2 py-1.5 mt-0.5"
            />
          </label>
        ))}
        <div className="block text-sm">
          <span className="block mb-1">今日雞湯口味（勾選今天有供應的）</span>
          <div className="flex flex-wrap gap-3 border border-neutral-300 rounded px-2 py-2">
            {soupItems.length === 0 ? (
              <span className="text-xs text-neutral-400">
                「我想喝補湯」「媽媽小孩最愛喝」分類裡還沒有品項
              </span>
            ) : (
              soupItems.map((item) => (
                <label key={item.name} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    name="dailySoupOptions"
                    value={item.name}
                    defaultChecked={selectedSoups.includes(item.name)}
                  />
                  {item.name}
                </label>
              ))
            )}
          </div>
          <span className="text-xs text-neutral-400">
            這裡打勾的口味，會出現在「套餐加購限定雞湯」和「小雞湯特餐」給客人選
          </span>
        </div>
        <label className="block text-sm">
          今日蔬菜（每行一種，例如：炒高麗菜）
          <textarea
            name="dailyVegOptions"
            defaultValue={map.dailyVegOptions ?? ""}
            rows={3}
            className="w-full border border-neutral-300 rounded px-2 py-1.5 mt-0.5"
          />
          <span className="text-xs text-neutral-400">
            這裡設定的蔬菜，會出現在「現炒時蔬」給客人選
          </span>
        </label>
        <button className="bg-amber-600 text-white px-4 py-2 rounded-full text-sm">
          儲存設定
        </button>
      </form>
    </div>
  );
}
