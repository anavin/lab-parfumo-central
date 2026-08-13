"use client";
import { useState } from "react";
import { Badge } from "@/components/ui";
import { num } from "@/lib/format";

type Row = { scent: string; size: string; remaining: number };

/** Low-stock ranking (lowest remaining first). Shows the top `initial` by default with a
 *  "ดูทั้งหมด" toggle to expand to the whole stock list. */
export function LowStockList({ data, initial = 8 }: { data: Row[]; initial?: number }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? data : data.slice(0, initial);
  return (
    <div className="flex flex-col h-full">
      <div className={"space-y-0.5 flex-1" + (expanded ? " max-h-[26rem] overflow-y-auto pr-1" : "")}>
        {shown.map((s, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 text-sm border-b border-line-soft last:border-0">
            <span className="font-medium text-ink truncate flex-1">{s.scent}</span>
            <span className="text-muted-soft text-[11px] shrink-0">{s.size}</span>
            <Badge tone={s.remaining <= 0 ? "danger" : s.remaining <= 3 ? "warn" : "success"}>{num(s.remaining)}</Badge>
          </div>
        ))}
      </div>
      {data.length > initial && (
        <button type="button" onClick={() => setExpanded((v) => !v)}
          className="mt-2.5 shrink-0 text-xs font-medium text-brand-dark hover:underline text-left">
          {expanded ? "▲ ย่อ" : `▾ ดูทั้งหมด (${data.length})`}
        </button>
      )}
    </div>
  );
}
