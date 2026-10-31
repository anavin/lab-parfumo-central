"use client";
import { useMemo, useState } from "react";
import { Boxes, ChevronDown, Search, Barcode, AlertTriangle } from "lucide-react";
import { num } from "@/lib/format";
import { isPackaging, isNonStock } from "@/lib/product-class";

type Row = { barcode: string; scent: string; size: string; remaining: number };

const inp = "border border-line rounded-lg px-2 py-1.5 text-sm bg-surface text-ink focus:outline-none focus:border-brand";

// ดึงจำนวน ml จากข้อความขนาด ("10 ml." → 10) เพื่อเรียงขนาดเล็ก→ใหญ่
const mlOf = (s?: string) => { const m = String(s || "").match(/(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : 0; };
// ถุงกระดาษ = ของบรรจุภัณฑ์ ไม่ใช่น้ำหอม → ดันไปท้ายลิสต์เสมอ
const isBag = isPackaging;

/** Read-only branch stock for the salesperson on /my — what's left at the branch
 *  they're working at today. Sorted by scent (Thai collation), then size small→large. */
export function BranchStockPanel({ rows, branchName, skusByBc = {}, defaultOpen = false }: { rows: Row[]; branchName: string; skusByBc?: Record<string, string[]>; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [term, setTerm] = useState("");

  // only what's actually in stock (received via requisition / adjusted in), by name —
  // โชว์เมื่อมีคงเหลือ > 0 "หรือ" ยังมี SKU ค้างในระบบ (ขายหมดแต่ SKU ไม่ตัด = ต้องติด Flag ให้เห็น)
  // ซ่อนเทสเตอร์ + ถุง (ไม่ใช่สต๊อกสินค้า)
  const stocked = useMemo(
    () => rows.filter((r) => ((Number(r.remaining) || 0) > 0 || (skusByBc[r.barcode] || []).length > 0)
        && !isNonStock(r.scent))
      .sort((a, b) =>
        (isBag(a.scent) ? 1 : 0) - (isBag(b.scent) ? 1 : 0)         // ถุงกระดาษไว้ท้ายสุด
        || (a.scent || "").localeCompare(b.scent || "", "th")       // แล้วเรียงตามกลิ่น
        || mlOf(a.size) - mlOf(b.size)),                            // ในกลิ่นเดียวกันเรียงเล็ก→ใหญ่
    [rows, skusByBc]);
  const list = useMemo(() => {
    const t = term.trim().toLowerCase();
    return stocked.filter((r) => !t || r.scent?.toLowerCase().includes(t) || r.barcode?.toLowerCase().includes(t)
      || (skusByBc[r.barcode] || []).some((s) => s.toLowerCase().includes(t)));
  }, [stocked, term, skusByBc]);
  const totalUnits = useMemo(() => stocked.reduce((s, r) => s + (Number(r.remaining) || 0), 0), [stocked]);

  return (
    <div className="mb-5">
      <div className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden">
        <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 hover:bg-canvas/60 text-left">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Boxes className="w-4 h-4 text-brand-dark" /> สต๊อกสาขา {branchName}
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
              <div className="py-5 text-center text-sm text-muted">{stocked.length ? "ไม่พบสินค้าที่ค้นหา" : "ยังไม่มีสต๊อกในสาขานี้ (ยังไม่ได้รับของเข้า)"}</div>
            ) : (
              <div className="-mx-1 px-1">   {/* ขยายเต็ม เห็นทุกกลิ่น (เลื่อนหน้าแทนเลื่อนในกล่อง) */}
                {list.map((r) => {
                  const q = Number(r.remaining) || 0;
                  const tone = q <= 0 ? "text-danger" : q <= 3 ? "text-warn-dark" : "text-ink";
                  const skuList = skusByBc[r.barcode] || [];
                  const over = skuList.length > q;   // SKU มากกว่ายอดคงเหลือ = ไม่ตรง (ขายแล้วแต่ SKU ยังไม่ตัด ฯลฯ)
                  return (
                    <div key={r.barcode + r.size} className={"border-b border-line-soft last:border-0 py-1.5 " + (over ? "bg-warn-soft/40 -mx-1 px-1 rounded" : "")}>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="flex-1 min-w-0 truncate text-ink">{r.scent} <span className="text-muted text-xs">{r.size}</span></span>
                        {skuList.length > 0 && (
                          <span className={"shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium rounded px-1.5 py-0.5 " + (over ? "bg-warn text-white" : "text-brand-dark bg-brand-soft")}>
                            {over ? <AlertTriangle className="w-3 h-3" /> : <Barcode className="w-3 h-3" />}SKU {num(skuList.length)}
                          </span>
                        )}
                        <span className={`tabular-nums font-semibold shrink-0 w-7 text-right ${tone}`}>{num(q)}</span>
                      </div>
                      {skuList.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 pl-1">
                          {over && <span className="text-[10px] text-warn-dark font-medium w-full">⚠ SKU เกินยอด {num(skuList.length - q)} (ขายแล้วยังไม่ตัด SKU?)</span>}
                          {skuList.map((s) => <span key={s} className="font-mono text-[11px] bg-canvas border border-line rounded px-1.5 py-0.5 text-ink">{s}</span>)}
                        </div>
                      )}
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
