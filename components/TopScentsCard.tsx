"use client";
import { useState, useEffect } from "react";
import { Maximize2, X } from "lucide-react";
import { BarList } from "./BarList";
import { baht, num } from "@/lib/format";

type Scent = { scent: string; revenue: number; qty: number };

export function TopScentsCard({ data, className = "" }: { data: Scent[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const top = data.slice(0, 15).map((s) => ({ label: s.scent, value: s.revenue }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) { document.addEventListener("keydown", onKey); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const max = Math.max(1, ...data.map((d) => d.revenue));

  return (
    <div className={`card flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-line-soft">
        <div>
          <h3 className="text-[14px] font-semibold text-ink">Top 15 กลิ่นขายดี</h3>
          <p className="text-[12px] text-muted mt-0.5">ตามรายได้</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand-dark hover:text-brand px-2 py-1 rounded-md hover:bg-brand-soft transition-colors">
          <Maximize2 className="w-3.5 h-3.5" /> ดูทั้งหมด ({data.length})
        </button>
      </div>
      <div className="flex-1 p-5">
        <BarList data={top} showRank labelWidth={150} theme="brand" fill />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-surface rounded-2xl shadow-pop w-full max-w-2xl max-h-[82vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-line">
              <div>
                <h3 className="text-[16px] font-bold text-ink">กลิ่นขายดีทั้งหมด</h3>
                <p className="text-[12.5px] text-muted mt-0.5">{data.length} กลิ่น · เรียงตามรายได้</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg hover:bg-line-soft flex items-center justify-center text-muted hover:text-ink">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="overflow-auto px-6 py-4">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface">
                  <tr className="th border-b border-line-soft">
                    <th className="pb-2 w-8">#</th>
                    <th className="pb-2">กลิ่น</th>
                    <th className="pb-2 w-40"></th>
                    <th className="pb-2 text-right w-16">ชิ้น</th>
                    <th className="pb-2 text-right w-20">รายได้</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((s, i) => (
                    <tr key={i} className="border-b border-line-soft last:border-0">
                      <td className="py-2 text-muted-soft tabular-nums">{i + 1}</td>
                      <td className="py-2 font-medium text-ink">{s.scent}</td>
                      <td className="py-2">
                        <div className="h-2 rounded-full bg-line-soft overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.max(2, (s.revenue / max) * 100)}%`, background: "linear-gradient(90deg,#c2a06a,#8a6d3f)" }} />
                        </div>
                      </td>
                      <td className="py-2 text-right text-muted tabular-nums">{num(s.qty)}</td>
                      <td className="py-2 text-right font-semibold text-ink tabular-nums">{baht(s.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
