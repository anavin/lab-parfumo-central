"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { num } from "@/lib/format";

// การเคลื่อนไหวสต๊อก — heatmap กลิ่น×วัน: แต่ละวันขายกลิ่นไหนออกไปเท่าไหร่ + คงเหลือปัจจุบัน
// (ไม่มีคอลัมน์ "พอขายอีก" ตามที่เจ้าของสั่ง)
export type MovRow = { scent: string; size: string; remaining: number; sold: Record<string, number> };

const WD = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const dayHead = (iso: string) => { const d = new Date(iso + "T00:00:00"); return { wd: WD[d.getDay()], day: d.getDate() }; };
const inp = "border border-line rounded-lg pl-8 pr-2 py-1.5 text-sm bg-surface text-ink focus:outline-none focus:border-brand w-full";

export function StockMovement({ dates, rows }: { dates: string[]; rows: MovRow[] }) {
  const [win, setWin] = useState(7);           // 7 / 14 / 30 วัน
  const [term, setTerm] = useState("");
  const [movedOnly, setMovedOnly] = useState(false);

  const shownDates = useMemo(() => dates.slice(-win), [dates, win]);

  const list = useMemo(() => {
    const t = term.trim().toLowerCase();
    return rows
      .map((r) => {
        const cells = shownDates.map((d) => r.sold[d] || 0);
        return { ...r, cells, soldN: cells.reduce((a, b) => a + b, 0) };
      })
      .filter((r) => (!t || r.scent.toLowerCase().includes(t)))
      .filter((r) => (!movedOnly || r.soldN > 0));
  }, [rows, shownDates, term, movedOnly]);

  // heat scale relative to the busiest cell in view (so the map stays readable at any window)
  const maxCell = useMemo(() => Math.max(1, ...list.flatMap((r) => r.cells)), [list]);
  const heat = (v: number) => (v <= 0 ? "transparent" : `rgb(var(--brand) / ${(0.12 + (v / maxCell) * 0.5).toFixed(3)})`);

  return (
    <div>
      {/* controls */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="ค้นหากลิ่น…" className={inp} />
        </div>
        <div className="inline-flex rounded-lg border border-line overflow-hidden">
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => setWin(d)}
              className={"px-3 py-1.5 text-sm font-medium transition " + (win === d ? "bg-brand text-white" : "bg-surface text-muted hover:bg-canvas")}>
              {d} วัน
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-1.5 text-sm text-muted cursor-pointer select-none">
          <input type="checkbox" checked={movedOnly} onChange={(e) => setMovedOnly(e.target.checked)} className="accent-brand" />
          เฉพาะที่ขยับ
        </label>
      </div>

      {list.length === 0 ? (
        <div className="text-center text-sm text-muted py-10">ไม่มีข้อมูลการขายในช่วงนี้</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse" style={{ minWidth: 560 }}>
            <thead>
              <tr className="text-muted">
                <th className="text-left font-medium px-2 pb-2 sticky left-0 bg-surface z-10">กลิ่น</th>
                <th className="text-left font-medium px-2 pb-2">ขนาด</th>
                {shownDates.map((d) => {
                  const { wd, day } = dayHead(d);
                  return (
                    <th key={d} className="px-1 pb-2 text-center font-medium whitespace-nowrap">
                      <div className="text-[10px] leading-none text-muted-soft">{wd}</div>
                      <div className="text-[11px] leading-tight">{day}</div>
                    </th>
                  );
                })}
                <th className="text-right font-medium px-2 pb-2 whitespace-nowrap">ขาย {win} วัน</th>
                <th className="text-right font-medium px-2 pb-2">คงเหลือ</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.scent + r.size} className="border-t border-line-soft">
                  <td className="px-2 py-1.5 font-medium text-ink whitespace-nowrap sticky left-0 bg-surface z-10">{r.scent}</td>
                  <td className="px-2 py-1.5 text-muted whitespace-nowrap">{r.size}</td>
                  {r.cells.map((v, i) => (
                    <td key={i} className="px-0 py-0.5 text-center">
                      <div className="mx-auto tabular-nums text-ink rounded" style={{ width: 30, height: 24, lineHeight: "24px", background: heat(v) }}>
                        {v > 0 ? v : ""}
                      </div>
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right font-bold tabular-nums text-ink">{r.soldN || ""}</td>
                  <td className={"px-2 py-1.5 text-right tabular-nums " + (r.remaining <= 3 ? "text-danger font-bold" : "text-ink")}>
                    {r.remaining > 0 ? num(r.remaining) : <span className="text-muted-soft">0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* legend */}
      <div className="flex items-center gap-2 mt-3 text-[11px] text-muted flex-wrap">
        <span>ขายน้อย</span>
        <span className="inline-flex gap-0.5">
          {[0.12, 0.25, 0.4, 0.6].map((a) => (
            <i key={a} className="rounded-sm" style={{ width: 16, height: 12, background: `rgb(var(--brand) / ${a})` }} />
          ))}
        </span>
        <span>ขายเยอะ</span>
        <span className="ml-2">· ช่องว่าง = ไม่ขาย</span>
      </div>
    </div>
  );
}
