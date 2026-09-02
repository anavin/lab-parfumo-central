"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X, AlertTriangle, PackageX, List, LayoutGrid, Loader2, EyeOff, Eye, Pencil } from "lucide-react";
import { num } from "@/lib/format";
import { StockTable } from "@/components/StockTable";
import { setStockQty, setScentActive } from "@/lib/actions/stock";

type Row = { barcode: string; scent: string; size: string; shipped: number; sold: number; returned: number; remaining: number };

const sizeDigits = (s: string) => { const m = String(s || "").match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; };
const sizeLabel = (s: string) => String(s || "").replace(/\s+/g, " ").trim();
const cellTone = (r: number) => r <= 0 ? "bg-danger-soft text-danger font-bold" : r <= 3 ? "bg-warn-soft text-warn font-bold" : "text-ink font-semibold";

type Cell = { remaining: number; barcode: string; multi: boolean };
type Grp = { scent: string; cells: Map<string, Cell>; total: number; active: boolean };

export function StockMatrix({ rows, branch = null, canEdit = false, inactiveScents = [] }:
  { rows: Row[]; branch?: string | null; canEdit?: boolean; inactiveScents?: string[] }) {
  const router = useRouter();
  const [saving, start] = useTransition();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [qtext, setQtext] = useState("");
  const [only, setOnly] = useState<"all" | "low" | "out">("all");
  const [edit, setEdit] = useState<{ scent: string; size: string } | null>(null);
  const [val, setVal] = useState("");
  const inactive = useMemo(() => new Set(inactiveScents), [inactiveScents]);
  const editable = canEdit && !!branch;   // inline qty edit needs a specific branch (not all-branches)

  const sizes = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(sizeLabel(r.size) || "—");
    return [...set].sort((a, b) => {
      const na = sizeDigits(a), nb = sizeDigits(b);
      if (!isNaN(na) && !isNaN(nb)) return nb - na;
      if (!isNaN(na)) return -1; if (!isNaN(nb)) return 1;
      return a.localeCompare(b);
    });
  }, [rows]);

  const grid = useMemo(() => {
    const m = new Map<string, Grp>();
    for (const r of rows) {
      const g = m.get(r.scent) || { scent: r.scent, cells: new Map(), total: 0, active: !inactive.has(r.scent) };
      const l = sizeLabel(r.size) || "—";
      const cur = g.cells.get(l);
      if (cur) { cur.remaining += r.remaining; cur.multi = true; }   // >1 barcode in this cell → not inline-editable
      else g.cells.set(l, { remaining: r.remaining, barcode: r.barcode, multi: false });
      g.total += r.remaining;
      m.set(r.scent, g);
    }
    // active first (A→Z), then inactive (A→Z) at the bottom
    return [...m.values()].sort((a, b) => (a.active === b.active ? a.scent.localeCompare(b.scent, "en") : a.active ? -1 : 1));
  }, [rows, inactive]);

  const query = qtext.trim().toLowerCase();
  const filtered = useMemo(() => grid.filter((g) => {
    if (query && !g.scent.toLowerCase().includes(query)) return false;
    if (only === "out" && ![...g.cells.values()].some((v) => v.remaining <= 0)) return false;
    if (only === "low" && ![...g.cells.values()].some((v) => v.remaining > 0 && v.remaining <= 3)) return false;
    return true;
  }), [grid, query, only]);

  const outN = rows.filter((r) => r.remaining <= 0).length;
  const lowN = rows.filter((r) => r.remaining > 0 && r.remaining <= 3).length;

  const openEdit = (scent: string, size: string, cur: number) => { setEdit({ scent, size }); setVal(String(Math.round(cur))); };
  const saveEdit = (barcode: string) => start(async () => {
    const t = Math.max(0, Math.round(Number(val) || 0));
    const res = await setStockQty(branch!, barcode, t);
    setEdit(null);
    if (res.ok) router.refresh(); else alert(res.error ?? "บันทึกไม่สำเร็จ");
  });
  const toggleActive = (scent: string, active: boolean) => start(async () => {
    if (!confirm(active ? `เปิดกลิ่น "${scent}" ให้กลับมาใช้งาน?` : `ปิดกลิ่น "${scent}"?\n(จะย้ายไปท้ายตาราง — ไม่ลบข้อมูล)`)) return;
    const res = await setScentActive(scent, active);
    if (res.ok) router.refresh(); else alert(res.error ?? "ไม่สำเร็จ");
  });

  return (
    <div className="space-y-3">
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
          <button onClick={() => setView((x) => (x === "grid" ? "list" : "grid"))} title={view === "grid" ? "มุมมองรายการ" : "มุมมองตาราง"}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-line bg-surface text-muted hover:bg-canvas hover:text-ink">
            {view === "grid" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-danger-soft border border-danger/30" /> หมด (0)</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-warn-soft border border-warn/30" /> ใกล้หมด (1–3)</span>
        {canEdit && <span className="inline-flex items-center gap-1"><Pencil className="w-3 h-3" /> {editable ? "แตะตัวเลขเพื่อแก้จำนวน" : "เลือกสาขาก่อนจึงแก้จำนวนได้"}</span>}
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
                <th className="sticky left-0 z-10 bg-canvas px-3 py-2.5 text-left font-semibold min-w-[150px]">กลิ่น</th>
                {sizes.map((s) => <th key={s} className="px-2 py-2.5 text-center font-semibold whitespace-nowrap min-w-[60px]">{s}</th>)}
                <th className="px-3 py-2.5 text-right font-semibold">รวม</th>
                {canEdit && <th className="px-2 py-2.5 text-center font-semibold w-12"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.scent} className={`border-t border-line hover:bg-canvas/40 ${g.active ? "" : "opacity-45"}`}>
                  <td className="sticky left-0 z-10 bg-surface px-3 py-2 font-medium text-ink whitespace-nowrap">
                    {g.scent}{!g.active && <span className="ml-1.5 text-[10px] chip-muted">ปิด</span>}
                  </td>
                  {sizes.map((s) => {
                    const c = g.cells.get(s);
                    const isEditing = edit && edit.scent === g.scent && edit.size === s;
                    if (!c) return <td key={s} className="px-2 py-1.5 text-center"><span className="text-line">·</span></td>;
                    if (isEditing) return (
                      <td key={s} className="px-1 py-1 text-center">
                        <input autoFocus value={val} inputMode="numeric" disabled={saving}
                          onChange={(e) => setVal(e.target.value.replace(/[^\d]/g, ""))}
                          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(c.barcode); if (e.key === "Escape") setEdit(null); }}
                          onBlur={() => saveEdit(c.barcode)}
                          className="w-14 border border-brand rounded-md px-1 py-1 text-center text-sm tabular-nums bg-surface focus:outline-none" />
                      </td>
                    );
                    const canCell = editable && !c.multi;
                    return (
                      <td key={s} className="px-2 py-1.5 text-center">
                        <button type="button" disabled={!canCell} onClick={() => canCell && openEdit(g.scent, s, c.remaining)}
                          className={`inline-block min-w-[34px] rounded-md px-2 py-1 tabular-nums ${cellTone(c.remaining)} ${canCell ? "hover:ring-1 hover:ring-brand cursor-pointer" : "cursor-default"}`}
                          title={canCell ? "แตะเพื่อแก้จำนวน" : c.multi ? "มีหลายบาร์โค้ดในช่องนี้" : undefined}>
                          {num(c.remaining)}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-bold tabular-nums text-ink">{num(g.total)}</td>
                  {canEdit && (
                    <td className="px-2 py-2 text-center">
                      <button type="button" disabled={saving} onClick={() => toggleActive(g.scent, !g.active)}
                        title={g.active ? "ปิดกลิ่นนี้" : "เปิดกลิ่นนี้"}
                        className="text-muted hover:text-ink disabled:opacity-40">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : g.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
