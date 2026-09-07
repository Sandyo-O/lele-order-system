// Categorical palette slots 1-6 from the validated default palette (fixed order,
// never cycled/reassigned): blue, orange, aqua, yellow, magenta, green.
const SLICE_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];
const OTHER_COLOR = "#898781"; // muted ink, reserved for the non-focal "其他" bucket

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

export function DonutChart({
  slices,
  centerLabel,
  centerValue,
}: {
  slices: { name: string; value: number; isOther?: boolean }[];
  centerLabel: string;
  centerValue: string;
}) {
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

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 220 220" className="w-56 h-56 shrink-0">
        {paths.map((p) => (
          <path key={p.name} d={p.path} fill={p.color} stroke="#fcfcfb" strokeWidth={2} />
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
          <li key={p.name} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: p.color }}
            />
            <span className="flex-1 truncate">{p.name}</span>
            <span className="text-neutral-500 shrink-0">{p.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
