"use client";
import { useMemo } from "react";
import { num } from "@/lib/format";

// แนวโน้มสต๊อกรวมคงเหลือรายวัน (จาก snapshot รายวัน) — เห็นสต๊อกไหลลง/ขึ้นข้ามวัน
export function StockTrend({ data }: { data: { d: string; remaining: number }[] }) {
  const pts = useMemo(() => data.map((r) => ({ d: r.d, v: Number(r.remaining) || 0 })), [data]);

  if (pts.length < 2) {
    return (
      <div className="rounded-xl border border-line bg-surface p-3 mb-3">
        <div className="text-sm font-medium text-ink mb-1">แนวโน้มสต๊อกรวม</div>
        <p className="text-xs text-muted">
          {pts.length === 0 ? "ยังไม่มีข้อมูลย้อนหลัง" : `เก็บวันแรกแล้ว (คงเหลือ ${num(pts[0].v)})`} — ระบบเก็บ snapshot ทุกคืน กราฟจะขึ้นเมื่อมีข้อมูลตั้งแต่ 2 วัน
        </p>
      </div>
    );
  }

  const W = 600, H = 120, PAD = 8;
  const vs = pts.map((p) => p.v);
  const min = Math.min(...vs), max = Math.max(...vs);
  const span = max - min || 1;
  const x = (i: number) => PAD + (i / (pts.length - 1)) * (W - 2 * PAD);
  const y = (v: number) => PAD + (1 - (v - min) / span) * (H - 2 * PAD);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z`;
  const first = pts[0].v, last = pts[pts.length - 1].v, delta = last - first;
  const fmtD = (iso: string) => { const dt = new Date(iso + "T00:00:00"); return `${dt.getDate()}/${dt.getMonth() + 1}`; };

  return (
    <div className="rounded-xl border border-line bg-surface p-3 mb-3">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-sm font-medium text-ink">แนวโน้มสต๊อกรวม · {pts.length} วัน</div>
        <div className="text-xs">
          <span className="tabular-nums font-semibold text-ink">{num(last)}</span>
          <span className={"ml-1.5 tabular-nums " + (delta < 0 ? "text-danger" : delta > 0 ? "text-success" : "text-muted")}>
            {delta > 0 ? "▲" : delta < 0 ? "▼" : ""}{delta !== 0 ? num(Math.abs(delta)) : "—"}
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }} preserveAspectRatio="none">
        <path d={area} fill="rgb(var(--brand) / 0.10)" />
        <path d={line} fill="none" stroke="rgb(var(--brand))" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <circle cx={x(pts.length - 1)} cy={y(last)} r={3} fill="rgb(var(--brand))" />
      </svg>
      <div className="flex justify-between text-[10px] text-muted-soft mt-1">
        <span>{fmtD(pts[0].d)}</span><span>{fmtD(pts[pts.length - 1].d)}</span>
      </div>
    </div>
  );
}
