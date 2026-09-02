"use client";
import { useMemo, useState } from "react";
import { Search, X, AlertTriangle, PackageX, List, LayoutGrid } from "lucide-react";
import { num } from "@/lib/format";
import { StockTable } from "@/components/StockTable";

type Row = { scent: string; size: string; shipped: number; sold: number; returned: number; remaining: number };

// canonical size ordering: biggest ml first (50 → 30 → 10 → 4), non-ml sizes after
const sizeDigits = (s: string) => { const m = String(s || "").match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; };
const sizeLabel = (s: string) => String(s || "").replace(/\s+/g, " ").trim();

const cellTone = (r: number) =>
  r <= 0 ? "bg-danger-soft text-danger font-bold"
  : r <= 3 ? "bg-warn-soft text-warn font-bold"
  : "text-ink font-semibold";

export function StockMatrix({ rows }: { rows: Row[] }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [qtext, setQtext] = useState("");
  const [only, setOnly] = useState<"all" | "low" | "out">("all");

  // distinct size columns present, ordered
  const sizes = useMemo(() => {
    const set = new Map<string, string>();   // label → label (dedupe by trimmed)
    for (const r of rows) { const l = sizeLabel(r.size) || "—"; set.set(l, l); }
    return [...set.keys()].sort((a, b) => {
      const na = sizeDigits(a), nb = sizeDigits(b);
      if (!isNaN(na) && !isNaN(nb)) return nb - na;      // 50,30,10,4
      if (!isNaN(na)) return -1; if (!isNaN(nb)) return 1;
      return a.localeCompare(b);
    });
  }, [rows]);

  // pivot: scent → { size → remaining }, plus per-scent total
  const grid = useMemo(() => {
    const m = new Map<string, { scent: string; cells: Map<string, number>; total: number; min: number }>();
    for (const r of rows) {
      const g = m.get(r.scent) || { scent: r.scent, cells: new Map(), total: 0, min: Infinity };
      const l = sizeLabel(r.size) || "—";
      g.cells.set(l, (g.cells.get(l) || 0) + r.remaining);
      g.total += r.remaining;
      m.set(r.scent, g);
    }
    for (const g of m.values()) g.min = Math.min(...[...g.cells.values()]);
    return [...m.values()].sort((a, b) => a.scent.localeCompare(b.scent, "en"));
  }, [rows]);

  const q = qtext.trim().toLowerCase();
  const filtered = useMemo(() => grid.filter((g) => {
    if (q && !g.scent.toLowerCase().includes(q)) return false;
    if (only === "out" && ![...g.cells.values()].some((v) => v <= 0)) return false;
    if (only === "low" && ![...g.cells.values()].some((v) => v > 0 && v <= 3)) return false;
    return true;
  }), [grid, q, only]);

  // headline counts (SKU-level, from the raw rows)
  const outN = rows.filter((r) => r.remaining <= 0).length;
  const lowN = rows.filter((r) => r.remaining > 0 && r.remaining <= 3).length;

  return (
    <div className="space-y-3">
      {/* toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-2.5">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input value={qtext} onChange={(e) => setQtext(e.target.value)} placeholder="ค้นหากลิ่น…"
            className="w-full border border-line rounded-lg pl-9 pr-9 h-10 text-sm bg-surface text-ink focus:outline-none focus:border-brand" />
          {qtext && <button onClick={() => setQtext("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex items-center gap-1.5">
          {([["all", "ทั้งหมด", null], ["low", "ใกล้หมด", lowN], ["out", "หมด", outN]] as const).map(([v, label, n]) => (
            <button key={v} onClick={() => setOnly(v)}
              className={`inline-flex items-center gap-1.5 px-3 h-10 rounded-lg text-sm font-medium border transition-colors ${only === v ? "bg-brand text-white border-brand" : "bg-surface text-ink border-line hover:bg-canvas"}`}>
              {v === "low" && <AlertTriangle className="w-3.5 h-3.5" />}{v === "out" && <PackageX className="w-3.5 h-3.5" />}
              {label}{n != null && <span className={`tabular-nums text-[11px] ${only === v ? "opacity-90" : "text-muted"}`}>{n}</span>}
            </button>
          ))}
          <button onClick={() => setView((x) => (x === "grid" ? "list" : "grid"))} title={view === "grid" ? "มุมมองรายการ (ละเอียด)" : "มุมมองตาราง"}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-line bg-surface text-muted hover:bg-canvas hover:text-ink">
            {view === "grid" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-danger-soft border border-danger/30" /> หมด (0)</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-warn-soft border border-warn/30" /> ใกล้หมด (1–3)</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-canvas border border-line" /> ปกติ</span>
        <span className="ml-auto">แสดง {filtered.length} กลิ่น</span>
      </div>

      {view === "list" ? (
        <StockTable rows={rows} />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface py-14 text-center text-sm text-muted">ไม่พบกลิ่นที่ตรงกับเงื่อนไข</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-canvas text-muted text-[12px]">
                <th className="sticky left-0 z-10 bg-canvas px-3 py-2.5 text-left font-semibold min-w-[160px]">กลิ่น</th>
                {sizes.map((s) => <th key={s} className="px-3 py-2.5 text-center font-semibold whitespace-nowrap min-w-[64px]">{s}</th>)}
                <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">รวม</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.scent} className="border-t border-line hover:bg-canvas/40">
                  <td className="sticky left-0 z-10 bg-surface px-3 py-2 font-medium text-ink whitespace-nowrap">{g.scent}</td>
                  {sizes.map((s) => {
                    const has = g.cells.has(s);
                    const v = g.cells.get(s) ?? 0;
                    return (
                      <td key={s} className="px-2 py-1.5 text-center">
                        {has ? <span className={`inline-block min-w-[34px] rounded-md px-2 py-1 tabular-nums ${cellTone(v)}`}>{num(v)}</span>
                             : <span className="text-line">·</span>}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-bold tabular-nums text-ink">{num(g.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
