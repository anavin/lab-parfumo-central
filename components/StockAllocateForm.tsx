"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check, Loader2, PackagePlus } from "lucide-react";
import { searchProducts } from "@/lib/actions/lookups";
import { allocateBranchStock, deleteAllocation, type AllocItem } from "@/lib/actions/stock-allocate";

type Line = { key: number; scent: string; barcode: string; size: string; qty: string; product_id?: number | null };
type Prod = { id: number; barcode: string; scent: string; size: string };
type Alloc = { id: number; po_number: string; order_date: string; units: number; items: { scent: string; size: string; qty: number }[] };

let seq = 1;
const blank = (): Line => ({ key: seq++, scent: "", barcode: "", size: "", qty: "1", product_id: null });
const inpBase = "border border-line rounded-lg px-2.5 py-2 text-sm bg-surface text-ink focus:outline-none focus:border-brand";
const inp = "w-full " + inpBase;

export function StockAllocateForm({ branch, branchName, allocations }: { branch: string; branchName: string; allocations: Alloc[] }) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([blank()]);
  const [saving, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const total = lines.reduce((s, l) => s + (Number(l.qty) || 0), 0);

  const save = () => {
    setErr(null);
    const items: AllocItem[] = lines
      .filter((l) => (l.scent || l.barcode) && Number(l.qty) > 0)
      .map((l) => ({ barcode: l.barcode, scent: l.scent, size: l.size, qty: Number(l.qty) || 0, product_id: l.product_id }));
    if (!items.length) { setErr("เลือกกลิ่น + ใส่จำนวนอย่างน้อย 1 รายการ"); return; }
    start(async () => {
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
      const res = await allocateBranchStock(branch, today, items);
      if (res?.ok) { setLines([blank()]); setSaved(true); setTimeout(() => setSaved(false), 2000); router.refresh(); }
      else setErr(res?.error ?? "บันทึกไม่สำเร็จ");
    });
  };
  const remove = (id: number) => start(async () => { await deleteAllocation(id); router.refresh(); });

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink mb-3"><PackagePlus size={16} /> จัดสต๊อกเข้า {branchName}</h2>
        <div className="space-y-2">
          {lines.map((l) => (
            <div key={l.key} className="flex items-start gap-2">
              <div className="flex-1"><ScentPicker line={l} onChange={(p) => set(l.key, p)} /></div>
              <input value={l.qty} inputMode="numeric" onChange={(e) => set(l.key, { qty: e.target.value.replace(/[^\d]/g, "") })}
                onFocus={(e) => e.target.select()} className={inpBase + " w-20 shrink-0 text-right tabular-nums"} placeholder="จำนวน" />
              <button type="button" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : ls))}
                className="p-2 text-muted hover:text-danger shrink-0" aria-label="ลบแถว"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button type="button" onClick={() => setLines((ls) => [...ls, blank()])}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-sm text-muted hover:bg-canvas">
            <Plus className="w-4 h-4" /> เพิ่มแถว
          </button>
          <span className="text-xs text-muted">รวม {total} ชิ้น</span>
        </div>
        {err && <div className="mt-2 text-xs text-danger">{err}</div>}
        <button onClick={save} disabled={saving}
          className="btn btn-brand mt-3 w-full rounded-xl">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <PackagePlus className="w-4 h-4" />}
          {saved ? "บันทึกแล้ว" : "บันทึกจัดเข้าสาขา"}
        </button>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-ink mb-3">รายการที่จัดเข้า {branchName} แล้ว</h2>
        {allocations.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">ยังไม่มีการจัดสต๊อกเข้าสาขานี้</p>
        ) : (
          <div className="space-y-3">
            {allocations.map((a) => (
              <div key={a.id} className="border border-line-soft rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted tabular-nums">{a.order_date} · {a.units} ชิ้น</span>
                  <button onClick={() => remove(a.id)} disabled={saving}
                    className="inline-flex items-center gap-1 text-xs text-danger hover:underline disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /> ลบ</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {a.items.map((it, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-canvas text-xs text-ink">
                      {it.scent} {it.size} <b className="tabular-nums">×{it.qty}</b>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Scent search box — prefix match via searchProducts, fills barcode/size on pick. */
function ScentPicker({ line, onChange }: { line: Line; onChange: (p: Partial<Line>) => void }) {
  const [results, setResults] = useState<Prod[]>([]);
  const [open, setOpen] = useState(false);
  const search = (term: string) => {
    onChange({ scent: term, barcode: "", product_id: null });
    if (!term.trim()) { setResults([]); setOpen(false); return; }
    searchProducts(term).then((r) => { setResults(r as Prod[]); setOpen(true); }).catch(() => setResults([]));
  };
  const pick = (p: Prod) => { onChange({ scent: p.scent, barcode: p.barcode, size: p.size, product_id: p.id }); setOpen(false); };
  return (
    <div className="relative w-full">
      <input value={line.scent} onChange={(e) => search(e.target.value)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="ค้นหากลิ่น…" className={inp} />
      {line.size && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-soft">{line.size}</span>}
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 left-0 right-0 max-h-56 overflow-auto rounded-lg border border-line bg-surface shadow-pop">
          {results.map((p) => (
            <button key={p.id} type="button" onMouseDown={(e) => { e.preventDefault(); pick(p); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-canvas flex items-center justify-between gap-2">
              <span className="text-ink">{p.scent}</span><span className="text-xs text-muted-soft shrink-0">{p.size}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
