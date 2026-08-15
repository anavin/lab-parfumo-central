"use client";
import { useState } from "react";
import { baht } from "@/lib/format";

/** Sales-by-BA ranking — revenue, bill count, and avg/bill per person. Shows the top
 *  `initial` by default with a "ดูทั้งหมด" toggle to expand to every BA (and collapse again). */
export function BAList({ data, initial = 8 }: { data: { ba: string; revenue: number; receipts?: number }[]; initial?: number }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? data : data.slice(0, initial);
  return (
    <div>
      <div className="space-y-1">
        {shown.map((b, i) => {
          const bills = b.receipts ?? 0;
          const avg = bills ? b.revenue / bills : 0;
          return (
            <div key={b.ba} className="flex items-center gap-3 py-1.5">
              <span className="w-5 h-5 rounded-md bg-brand-soft text-brand-dark text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{b.ba}</div>
                {bills > 0 && <div className="text-[11px] text-muted tabular-nums">{bills} บิล · เฉลี่ย {baht(avg)}/บิล</div>}
              </div>
              <span className="ml-auto text-sm font-semibold tabular-nums shrink-0">{baht(b.revenue)}</span>
            </div>
          );
        })}
      </div>
      {data.length > initial && (
        <button type="button" onClick={() => setExpanded((v) => !v)}
          className="mt-2.5 text-xs font-medium text-brand-dark hover:underline">
          {expanded ? "▲ ย่อ" : `▾ ดูทั้งหมด (${data.length})`}
        </button>
      )}
    </div>
  );
}
