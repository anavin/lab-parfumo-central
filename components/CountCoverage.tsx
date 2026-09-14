"use client";
import { useState } from "react";
import { ClipboardCheck, ChevronDown } from "lucide-react";
import Link from "next/link";
import { num } from "@/lib/format";

// ตารางนับตามรอบ — ทำการนับให้เป็นระบบ: บอก % ที่นับครบใน 30 วัน + แนะกลิ่นที่ "ควรนับก่อน"
// (ไม่เคยนับ / ค้างนาน / ของเยอะ / ขายเร็ว) เพื่อจับของหายได้เร็วโดยไม่ต้องนับทั้งร้านทุกครั้ง
export type CoverageRow = { scent: string; size: string; remaining: number; velocity: number; countedAt: string | null; daysSince: number | null };
export type Coverage = { total: number; countedRecent: number; neverN: number; staleN: number; suggest: CoverageRow[] };

const seen = (r: CoverageRow) =>
  r.countedAt == null ? "ไม่เคยนับ" : r.daysSince! <= 0 ? "วันนี้" : r.daysSince === 1 ? "เมื่อวาน" : `${r.daysSince} วันก่อน`;

export function CountCoverage({ coverage }: { coverage: Coverage }) {
  const [open, setOpen] = useState(false);
  const { total, countedRecent, neverN, staleN, suggest } = coverage;
  if (total === 0) return null;
  const pct = Math.round((countedRecent / total) * 100);
  const tone = pct >= 80 ? "text-success" : pct >= 50 ? "text-warn" : "text-danger";

  return (
    <div className="rounded-lg border border-line bg-surface mb-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-ink hover:bg-canvas/60 rounded-lg">
        <ClipboardCheck className="w-4 h-4 text-brand" />
        นับตามรอบ — นับครบ <span className={"font-bold " + tone}>{pct}%</span> ใน 30 วัน
        <span className="text-xs font-normal text-muted">({countedRecent}/{total} รายการ · ควรนับ {suggest.length})</span>
        <ChevronDown className={"w-4 h-4 text-muted ml-auto transition-transform " + (open ? "rotate-180" : "")} />
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-line-soft">
          {/* progress bar */}
          <div className="h-1.5 w-full rounded-full bg-line-soft overflow-hidden my-2">
            <div className={"h-full rounded-full " + (pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warn" : "bg-danger")} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted mb-3">
            <span>ไม่เคยนับ <b className="text-danger">{neverN}</b></span>
            <span>· ค้าง &gt;14 วัน <b className="text-warn">{staleN}</b></span>
            <Link href="/my/count" className="ml-auto text-brand hover:underline font-medium">เริ่มนับ (ควรนับก่อน) →</Link>
          </div>

          {suggest.length === 0 ? (
            <div className="text-sm text-success py-2">✓ นับครบทุกกลิ่นในรอบแล้ว</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px] min-w-[460px]">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="font-medium px-2 py-1.5">ควรนับก่อน</th>
                    <th className="font-medium px-2 py-1.5">ขนาด</th>
                    <th className="font-medium px-2 py-1.5 text-right">คงเหลือ</th>
                    <th className="font-medium px-2 py-1.5 text-right">ขาย 30 วัน</th>
                    <th className="font-medium px-2 py-1.5 text-right whitespace-nowrap">นับล่าสุด</th>
                  </tr>
                </thead>
                <tbody>
                  {suggest.map((r) => (
                    <tr key={r.scent + r.size} className="border-t border-line-soft">
                      <td className="px-2 py-1.5 font-medium text-ink whitespace-nowrap">{r.scent}</td>
                      <td className="px-2 py-1.5 text-muted whitespace-nowrap">{r.size}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{num(r.remaining)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-muted">{r.velocity || ""}</td>
                      <td className={"px-2 py-1.5 text-right whitespace-nowrap " + (r.countedAt == null ? "text-danger font-medium" : "text-warn")}>{seen(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[11px] text-muted mt-2">แนะนำนับ “ของเยอะ + ขายเร็ว + ค้างนาน” ก่อน — นับถี่เฉพาะจุดเสี่ยง ไม่ต้องนับทั้งร้านทุกครั้ง</p>
        </div>
      )}
    </div>
  );
}
