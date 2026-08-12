"use client";
import { useMemo, useState } from "react";
import { Boxes, ChevronDown, Search } from "lucide-react";
import { num } from "@/lib/format";

type Row = { barcode: string; scent: string; size: string; remaining: number };

const inp = "border border-line rounded-lg px-2 py-1.5 text-sm bg-surface text-ink focus:outline-none focus:border-brand";

/** Read-only branch stock for the salesperson on /my — what's left at the branch
 *  they're working at today. Sorted low-stock-first so near-empty items stand out. */
export function BranchStockPanel({ rows, branchName, defaultOpen = false }: { rows: Row[]; branchName: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [term, setTerm] = useState("");

  // only what's actually in stock (received via requisition / adjusted in), by name —
  // hide the 0/phantom rows (items sold but never received into this branch)
  const stocked = useMemo(
    () => rows.filter((r) => (Number(r.remaining) || 0) > 0).sort((a, b) => (a.scent || "").localeCompare(b.scent || "")),
    [rows]);
  const list = useMemo(() => {
    const t = term.trim().toLowerCase();
    return stocked.filter((r) => !t || r.scent?.toLowerCase().includes(t) || r.barcode?.toLowerCase().includes(t));
  }, [stocked, term]);
  const totalUnits = useMemo(() => stocked.reduce((s, r) => s + (Number(r.remaining) || 0), 0), [stocked]);

  return (
    <div className="mb-5">
      <div className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden">
        <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 hover:bg-canvas/60 text-left">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Boxes className="w-4 h-4 text-brand-dark" /> สตอกสาขา {branchName}
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand text-white text-[11px] font-bold">{stocked.length}</span>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-muted">คงเหลือ {num(totalUnits)} ชิ้น</span>
            <ChevronDown className={`w-4 h-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
          </span>
        </button>
        {open && (
          <div className="px-3.5 pb-3.5 border-t border-line-soft pt-2.5">
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-muted-soft absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="ค้นหากลิ่น / บาร์โค้ด…" className={inp + " w-full pl-8"} />
            </div>
            {list.length === 0 ? (
              <div className="py-5 text-center text-sm text-muted">{stocked.length ? "ไม่พบสินค้าที่ค้นหา" : "ยังไม่มีสตอกในสาขานี้ (ยังไม่ได้รับของเข้า)"}</div>
            ) : (
              <div className="max-h-[60vh] overflow-auto -mx-1 px-1">
                {list.map((r) => {
                  const q = Number(r.remaining) || 0;
                  const tone = q <= 0 ? "text-danger" : q <= 3 ? "text-warn-dark" : "text-ink";
                  return (
                    <div key={r.barcode + r.size} className="flex items-center gap-2 py-1.5 border-b border-line-soft last:border-0 text-sm">
                      <span className="flex-1 min-w-0 truncate text-ink">{r.scent} <span className="text-muted text-xs">{r.size}</span></span>
                      <span className={`tabular-nums font-semibold shrink-0 ${tone}`}>{num(q)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
