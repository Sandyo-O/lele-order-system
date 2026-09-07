import Link from "next/link";
import { getReportStats } from "@/lib/stats";
import { DonutChart } from "./DonutChart";

export const dynamic = "force-dynamic";

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

const PRESETS: { key: string; label: string }[] = [
  { key: "today", label: "今天" },
  { key: "yesterday", label: "昨天" },
  { key: "7d", label: "近7天" },
  { key: "30d", label: "近30天" },
  { key: "month", label: "本月" },
];

function resolveRange(preset: string | undefined, from: string | undefined, to: string | undefined) {
  const now = new Date();

  if (from && to) {
    const start = startOfDay(new Date(from));
    const end = endOfDay(new Date(to));
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return { start, end, activePreset: null as string | null };
    }
  }

  switch (preset) {
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { start: startOfDay(y), end: endOfDay(y), activePreset: "yesterday" };
    }
    case "7d": {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { start: startOfDay(s), end: endOfDay(now), activePreset: "7d" };
    }
    case "30d": {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      return { start: startOfDay(s), end: endOfDay(now), activePreset: "30d" };
    }
    case "month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfDay(s), end: endOfDay(now), activePreset: "month" };
    }
    case "today":
    default:
      return { start: startOfDay(now), end: endOfDay(now), activePreset: "today" };
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const { preset, from, to } = await searchParams;
  const { start, end, activePreset } = resolveRange(preset, from, to);
  const stats = await getReportStats(start, end);

  const TOP_N = 6;
  const top = stats.items.slice(0, TOP_N);
  const rest = stats.items.slice(TOP_N);
  const otherRevenue = rest.reduce((s, i) => s + i.revenue, 0);
  const slices = [
    ...top.map((i) => ({ name: i.name, value: i.revenue, itemNames: [i.name] })),
    ...(otherRevenue > 0
      ? [
          {
            name: "其他",
            value: otherRevenue,
            isOther: true,
            itemNames: rest.map((i) => i.name),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold mb-1">營業報表</h1>
        <p className="text-sm text-neutral-500">
          {toDateInputValue(start)} ～ {toDateInputValue(end)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <Link
            key={p.key}
            href={`/admin/reports?preset=${p.key}`}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              activePreset === p.key
                ? "bg-amber-600 text-white border-amber-600"
                : "border-neutral-300 text-neutral-700"
            }`}
          >
            {p.label}
          </Link>
        ))}
        <form className="flex items-center gap-1.5 text-sm" action="/admin/reports">
          <input
            type="date"
            name="from"
            defaultValue={toDateInputValue(start)}
            className="border border-neutral-300 rounded px-2 py-1"
          />
          <span className="text-neutral-400">～</span>
          <input
            type="date"
            name="to"
            defaultValue={toDateInputValue(end)}
            className="border border-neutral-300 rounded px-2 py-1"
          />
          <button className="border border-neutral-300 rounded-full px-3 py-1">查詢</button>
        </form>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-500">總營收</div>
          <div className="text-2xl font-semibold text-green-700">${stats.revenue}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-500">訂單數</div>
          <div className="text-2xl font-semibold text-neutral-800">{stats.orderCount}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-500">來客數（桌次）</div>
          <div className="text-2xl font-semibold text-neutral-800">{stats.visitCount}</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-xs text-neutral-500">客單價</div>
          <div className="text-2xl font-semibold text-neutral-800">${stats.avgSpend}</div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="font-medium text-neutral-700 mb-3">品項銷售額佔比</h2>
        <DonutChart
          slices={slices}
          occurrences={stats.occurrences}
          centerLabel="總營收"
          centerValue={`$${stats.revenue}`}
        />
        <p className="text-xs text-neutral-400 mt-2">點一下圖表或旁邊的品項名稱，可以看該品項的訂單明細</p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 overflow-x-auto">
        <h2 className="font-medium text-neutral-700 mb-3">品項銷售明細</h2>
        {stats.items.length === 0 ? (
          <p className="text-sm text-neutral-400">這段期間還沒有資料</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500 border-b border-neutral-200">
                <th className="py-1.5 pr-2">品項</th>
                <th className="py-1.5 pr-2 text-right">數量</th>
                <th className="py-1.5 pr-2 text-right">銷售額</th>
                <th className="py-1.5 text-right">佔比</th>
              </tr>
            </thead>
            <tbody>
              {stats.items.map((i) => (
                <tr key={i.name} className="border-b border-neutral-100 last:border-0">
                  <td className="py-1.5 pr-2">{i.name}</td>
                  <td className="py-1.5 pr-2 text-right">{i.quantity}</td>
                  <td className="py-1.5 pr-2 text-right">${i.revenue}</td>
                  <td className="py-1.5 text-right text-neutral-500">
                    {stats.revenue > 0 ? Math.round((i.revenue / stats.revenue) * 1000) / 10 : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
