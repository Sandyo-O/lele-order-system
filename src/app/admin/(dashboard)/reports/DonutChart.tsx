"use client";

import { useState } from "react";

// Categorical palette slots 1-6 from the validated default palette (fixed order,
// never cycled/reassigned): blue, orange, aqua, yellow, magenta, green.
const SLICE_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];
const OTHER_COLOR = "#898781"; // muted ink, reserved for the non-focal "其他" bucket

type Occurrence = {
  itemName: string;
  quantity: number;
  amount: number;
  createdAt: string;
  tableNumber: number;
};

type Slice = { name: string; value: number; isOther?: boolean; itemNames: string[] };

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlicePath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number
) {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const startOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const startInner = polarToCartesian(cx, cy, rInner, startAngle);
  const endInner = polarToCartesian(cx, cy, rInner, endAngle);
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MAX_ROWS = 30;

export function DonutChart({
  slices,
  occurrences,
  centerLabel,
  centerValue,
}: {
  slices: Slice[];
  occurrences: Occurrence[];
  centerLabel: string;
  centerValue: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const cx = 110;
  const cy = 110;
  const rOuter = 100;
  const rInner = 62;

  if (total <= 0) {
    return <p className="text-sm text-neutral-400">這段期間還沒有資料</p>;
  }

  // Precompute each slice's [startAngle, endAngle) immutably (no running-total
  // mutation) by summing all preceding slices' share of the circle.
  const angleRanges = slices.map((s, i) => {
    const before = slices.slice(0, i).reduce((sum, x) => sum + x.value, 0);
    const startAngle = (before / total) * 360;
    const endAngle = ((before + s.value) / total) * 360;
    return { startAngle, endAngle };
  });

  const paths = slices.map((s, i) => {
    const { startAngle, endAngle } = angleRanges[i];
    const color = s.isOther ? OTHER_COLOR : SLICE_COLORS[i % SLICE_COLORS.length];
    return {
      ...s,
      color,
      path: donutSlicePath(cx, cy, rOuter, rInner, startAngle, endAngle),
      pct: Math.round((s.value / total) * 1000) / 10,
    };
  });

  const selectedSlice = paths.find((p) => p.name === selected) ?? null;
  const matches = selectedSlice
    ? occurrences
        .filter((o) => selectedSlice.itemNames.includes(o.itemName))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <svg viewBox="0 0 220 220" className="w-56 h-56 shrink-0">
          {paths.map((p) => (
            <path
              key={p.name}
              d={p.path}
              fill={p.color}
              stroke="#fcfcfb"
              strokeWidth={2}
              className="cursor-pointer transition-opacity"
              opacity={selected && selected !== p.name ? 0.35 : 1}
              onClick={() => setSelected((cur) => (cur === p.name ? null : p.name))}
            />
          ))}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            className="fill-neutral-800"
            style={{ fontSize: 20, fontWeight: 600 }}
          >
            {centerValue}
          </text>
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            className="fill-neutral-500"
            style={{ fontSize: 11 }}
          >
            {centerLabel}
          </text>
        </svg>

        <ul className="w-full space-y-1.5 text-sm">
          {paths.map((p) => (
            <li key={p.name}>
              <button
                type="button"
                onClick={() => setSelected((cur) => (cur === p.name ? null : p.name))}
                className={`w-full flex items-center gap-2 rounded px-1.5 py-1 text-left ${
                  selected === p.name ? "bg-neutral-100" : ""
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span className="flex-1 truncate">{p.name}</span>
                <span className="text-neutral-500 shrink-0">{p.pct}%</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selectedSlice && (
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-neutral-700">
              {selectedSlice.name} 的訂單紀錄（共 {matches.length} 筆）
            </h3>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-neutral-400"
            >
              關閉 ×
            </button>
          </div>
          {matches.length === 0 ? (
            <p className="text-xs text-neutral-400">沒有找到紀錄</p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-neutral-400 border-b border-neutral-100">
                    <th className="py-1 pr-2 font-normal">時間</th>
                    {selectedSlice.isOther && <th className="py-1 pr-2 font-normal">品項</th>}
                    <th className="py-1 pr-2 font-normal">桌號</th>
                    <th className="py-1 pr-2 font-normal text-right">數量</th>
                    <th className="py-1 font-normal text-right">金額</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.slice(0, MAX_ROWS).map((o, i) => (
                    <tr key={i} className="border-b border-neutral-50 last:border-0">
                      <td className="py-1 pr-2 whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
                      {selectedSlice.isOther && <td className="py-1 pr-2">{o.itemName}</td>}
                      <td className="py-1 pr-2">{o.tableNumber}</td>
                      <td className="py-1 pr-2 text-right">{o.quantity}</td>
                      <td className="py-1 text-right">${o.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {matches.length > MAX_ROWS && (
                <p className="text-xs text-neutral-400 mt-1.5">
                  僅顯示最近 {MAX_ROWS} 筆，共 {matches.length} 筆
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
