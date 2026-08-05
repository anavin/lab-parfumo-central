// Ranked horizontal bar list — pure HTML/CSS (server-safe). Better proportion
// control and single-line labels (ellipsis) than an SVG chart. Follows the
// dataviz guidance: single-hue magnitude, track behind each bar, value labels.

const baht = (v: number) =>
  Math.abs(v) >= 1e6 ? "฿" + (v / 1e6).toFixed(2) + "M"
  : Math.abs(v) >= 1e3 ? "฿" + (v / 1e3).toFixed(0) + "K" : "฿" + Math.round(v);
const plain = (v: number) => Math.round(v).toLocaleString("en-US");

type Row = { label: string; value: number };

const THEMES = {
  brand: { from: "#c2a06a", to: "#8a6d3f", rank: "bg-brand-soft text-brand-dark" },
  info: { from: "#5fa0e6", to: "#2a78d6", rank: "bg-info-soft text-info" },
} as const;

export function BarList({
  data, money = true, showRank = false, labelWidth = 128, theme = "brand", fill = false,
}: {
  data: Row[]; money?: boolean; showRank?: boolean; labelWidth?: number; theme?: keyof typeof THEMES; fill?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const fmt = money ? baht : plain;
  const th = THEMES[theme];

  return (
    <div className={`flex flex-col ${fill ? "h-full justify-between gap-2" : "gap-3"}`}>
      {data.map((d, i) => {
        const pct = Math.max(2, (d.value / max) * 100); // min 2% so tiny values show
        return (
          <div key={i} className="group flex items-center gap-3"
            title={`${d.label} — ${fmt(d.value)} · ${Math.round((d.value / total) * 100)}% ของยอดรวม`}>
            {showRank && (
              <span className={`shrink-0 w-6 h-6 rounded-md ${th.rank} text-[11px] font-bold flex items-center justify-center tabular-nums`}>
                {i + 1}
              </span>
            )}
            <span className="shrink-0 text-[13px] text-ink-soft truncate" style={{ width: labelWidth }} title={d.label}>
              {d.label}
            </span>
            <div className="flex-1 h-5 rounded-lg bg-line-soft overflow-hidden">
              <div
                className="h-full rounded-lg transition-[width] duration-500"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${th.from}, ${th.to})` }}
              />
            </div>
            <span className="shrink-0 w-14 text-right text-[13px] font-semibold text-ink tabular-nums">
              {fmt(d.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
