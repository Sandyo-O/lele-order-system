import { prisma } from "@/lib/prisma";
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

export default async function SettingsPage() {
  const settings = await prisma.setting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

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
        <label className="block text-sm">
          今日雞湯口味（每行一個，例如：剝皮辣椒雞湯，有兩種就打兩行）
          <textarea
            name="dailySoupOptions"
            defaultValue={map.dailySoupOptions ?? ""}
            rows={3}
            className="w-full border border-neutral-300 rounded px-2 py-1.5 mt-0.5"
          />
          <span className="text-xs text-neutral-400">
            這裡設定的口味，會出現在「套餐加購限定雞湯」和「小雞湯特餐」給客人選
          </span>
        </label>
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
