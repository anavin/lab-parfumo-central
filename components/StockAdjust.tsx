"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Loader2, Trash2, Plus, Minus } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { branchOptions, branchName } from "@/lib/branches";
import { searchProducts } from "@/lib/actions/lookups";
import { addStockAdjustment, deleteStockAdjustment, type StockAdjustment } from "@/lib/actions/stock";

type Prod = { id: number; barcode: string; scent: string; grade: string; size: string; sku: string; price: number };
const inp = "border border-line rounded-lg px-3 py-2 text-sm bg-surface text-ink focus:outline-none focus:border-brand";

/** Admin manual stock adjustment — enter existing/opening stock or correct counts.
 *  qty is a signed delta (+ add / − remove) applied to one product at one branch. */
export function StockAdjust({ defaultBranch, adjustments }: { defaultBranch: string | null; adjustments: StockAdjustment[] }) {
  const router = useRouter();
  const opts = branchOptions();
  const [branch, setBranch] = useState(defaultBranch ?? opts[0]?.value ?? "");
  const [picked, setPicked] = useState<Prod | null>(null);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Prod[]>([]);
  const [openList, setOpenList] = useState(false);
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, start] = useTransition();

  const onSearch = (v: string) => {
    setTerm(v); setPicked(null);
    if (v.trim().length < 1) { setResults([]); setOpenList(false); return; }
    searchProducts(v).then((r) => { setResults(r as Prod[]); setOpenList(true); });
  };
  const pick = (p: Prod) => { setPicked(p); setTerm(`${p.scent} · ${p.size}`); setOpenList(false); };

  const submit = () => start(async () => {
    setErr(null);
    const n = Math.round(Number(qty) || 0);
    if (!picked) return setErr("กรุณาเลือกสินค้า");
    if (!n) return setErr("กรุณาระบุจำนวน (บวก = เพิ่ม, ลบ = ลด)");
    const res = await addStockAdjustment({ branch, barcode: picked.barcode, qty: n, note });
    if (res.ok) { setPicked(null); setTerm(""); setQty(""); setNote(""); router.refresh(); }
    else setErr(res.error ?? "บันทึกไม่สำเร็จ");
  });

  const del = (id: number) => start(async () => { await deleteStockAdjustment(id); router.refresh(); });
  const bump = (d: number) => setQty((v) => String((Math.round(Number(v) || 0)) + d));

  return (
    <div className="rounded-xl border border-line bg-surface shadow-sm p-4 mb-6">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink mb-3">
        <SlidersHorizontal className="w-4 h-4 text-brand-dark" /> ปรับสต๊อก (กรอกสต๊อกที่มีอยู่ / แก้ไขจำนวน)
      </h3>

      <div className="grid gap-2 md:grid-cols-[160px_1fr_150px_1fr_auto] md:items-start">
        <div>
          <label className="text-[11px] text-muted mb-1 block">สาขา</label>
          <Select value={branch} onValueChange={setBranch} options={opts} />
        </div>
        <div className="relative">
          <label className="text-[11px] text-muted mb-1 block">สินค้า</label>
          <input value={term} onChange={(e) => onSearch(e.target.value)} onBlur={() => setTimeout(() => setOpenList(false), 150)}
            placeholder="ค้นหากลิ่น / บาร์โค้ด" className={inp + " w-full"} />
          {openList && results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto bg-surface border border-line rounded-lg shadow-lg text-sm">
              {results.map((p) => (
                <button key={p.id} onMouseDown={() => pick(p)} className="block w-full text-left px-3 py-2 hover:bg-brand-soft">
                  <span className="font-medium">{p.scent}</span> <span className="text-muted">{p.size} · {p.grade} · {p.barcode}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="text-[11px] text-muted mb-1 block">จำนวน (+/−)</label>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => bump(-1)} className="p-2 rounded-lg border border-line text-muted hover:bg-canvas"><Minus className="w-4 h-4" /></button>
            <input value={qty} inputMode="numeric" onChange={(e) => setQty(e.target.value.replace(/[^\d-]/g, ""))}
              placeholder="0" className={inp + " w-full text-center tabular-nums"} />
            <button type="button" onClick={() => bump(1)} className="p-2 rounded-lg border border-line text-muted hover:bg-canvas"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
        <div>
          <label className="text-[11px] text-muted mb-1 block">หมายเหตุ</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น สต๊อกเปิดร้าน / นับสต๊อก" className={inp + " w-full"} />
        </div>
        <div className="flex items-end h-full">
          <button onClick={submit} disabled={saving}
            className="mt-[18px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50 whitespace-nowrap">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} บันทึก
          </button>
        </div>
      </div>
      {err && <div className="text-xs text-danger mt-2">{err}</div>}

      {adjustments.length > 0 && (
        <div className="mt-4 border-t border-line-soft pt-3">
          <div className="text-[11px] text-muted mb-1.5">รายการปรับล่าสุด</div>
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-sm">
              <tbody>
                {adjustments.map((a) => (
                  <tr key={a.id} className="border-b border-line-soft last:border-0">
                    <td className="py-1.5 pr-2 whitespace-nowrap text-muted text-xs">{a.created_at.slice(0, 10)}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap"><span className="inline-flex items-center rounded bg-canvas px-1.5 py-0.5 text-xs font-medium">{branchName(a.branch)}</span></td>
                    <td className="py-1.5 pr-2 truncate">{a.scent} <span className="text-muted text-xs">{a.size}</span></td>
                    <td className={`py-1.5 pr-2 text-right font-semibold tabular-nums whitespace-nowrap ${a.qty < 0 ? "text-danger" : "text-success"}`}>{a.qty > 0 ? "+" : ""}{a.qty}</td>
                    <td className="py-1.5 pr-2 text-muted text-xs truncate max-w-[160px]">{a.note ?? ""}</td>
                    <td className="py-1.5 text-right"><button onClick={() => del(a.id)} disabled={saving} className="text-muted hover:text-danger disabled:opacity-50" title="ลบ"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
