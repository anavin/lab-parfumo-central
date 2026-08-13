"use client";
import { useState } from "react";
import { baht } from "@/lib/format";

/** Sales-by-BA ranking. Shows the top `initial` by default with a "ดูทั้งหมด" toggle
 *  to expand to every BA (and collapse again). */
export function BAList({ data, initial = 8 }: { data: { ba: string; revenue: number }[]; initial?: number }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? data : data.slice(0, initial);
  return (
    <div>
      <div className="space-y-1">
        {shown.map((b, i) => (
          <div key={b.ba} className="flex items-center gap-3 py-1.5">
            <span className="w-5 h-5 rounded-md bg-brand-soft text-brand-dark text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums">{i + 1}</span>
            <span className="text-sm font-medium truncate">{b.ba}</span>
            <span className="ml-auto text-sm font-semibold tabular-nums">{baht(b.revenue)}</span>
          </div>
        ))}
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
