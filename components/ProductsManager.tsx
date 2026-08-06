"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, ScanLine, Search } from "lucide-react";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { baht, num } from "@/lib/format";

const inp = "w-full border border-line rounded-lg px-2.5 py-2 text-sm bg-surface focus:outline-none focus:border-brand";

export type ProductRow = { id: number; barcode: string; scent: string; grade: string; size: string; sku: string; price: number; sold: number };
type FormState = { id?: number; barcode: string; scent: string; grade: string; size: string; sku: string; price: any };

const blank = (): FormState => ({ barcode: "", scent: "", grade: "", size: "", sku: "", price: 0 });

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs text-muted mb-1 block">{label}</span>{children}</label>;
}

export function ProductsManager({ rows }: { rows: ProductRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<FormState | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => [r.scent, r.barcode, r.sku, r.grade].some((v) => (v || "").toLowerCase().includes(t)));
  }, [rows, query]);

  const save = () => start(async () => {
    if (!form) return;
    try {
      const payload = { ...form, price: Number(form.price) || 0 };
      if (form.id) await updateProduct(form.id, payload); else await createProduct(payload);
      setForm(null); router.refresh();
    } catch (e: any) { alert(e?.message ?? "บันทึกไม่สำเร็จ"); }
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหากลิ่น / บาร์โค้ด / SKU"
            className="w-full border border-line rounded-lg pl-9 pr-3 py-2 text-sm bg-surface focus:outline-none focus:border-brand" />
        </div>
        {!form && (
          <button onClick={() => setForm(blank())} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark shrink-0">
            <Plus className="w-4 h-4" /> เพิ่มสินค้า
          </button>
        )}
      </div>

      {form && <ProductForm state={form} setState={setForm} onSave={save} pending={pending} />}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="text-muted text-xs text-left sticky top-0 bg-surface z-10">
              <tr className="border-b border-line">
                <th className="px-3 py-2.5">Barcode</th><th className="px-3 py-2.5">กลิ่น</th>
                <th className="px-3 py-2.5">Grade</th><th className="px-3 py-2.5">ขนาด</th>
                <th className="px-3 py-2.5 text-right">ราคา</th><th className="px-3 py-2.5 text-right">ขายแล้ว</th>
                <th className="px-3 py-2.5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-canvas/50">
                  <td className="px-3 py-2 font-mono text-xs text-muted">{r.barcode}</td>
                  <td className="px-3 py-2 font-medium text-ink">{r.scent}</td>
                  <td className="px-3 py-2 text-muted">{r.grade}</td>
                  <td className="px-3 py-2 text-muted">{r.size}</td>
                  <td className="px-3 py-2 text-right">{r.price ? baht(r.price) : "-"}</td>
                  <td className="px-3 py-2 text-right font-medium">{num(r.sold)}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => setForm({ id: r.id, barcode: r.barcode, scent: r.scent, grade: r.grade || "", size: r.size || "", sku: r.sku || "", price: r.price ?? 0 })}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink" aria-label="แก้ไข"><Pencil className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-3 py-10 text-center text-muted">ไม่พบสินค้า</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductForm({ state, setState, onSave, pending }: { state: FormState; setState: (s: FormState | null) => void; onSave: () => void; pending: boolean }) {
  const [scanning, setScanning] = useState(false);
  const s = (k: keyof FormState, v: any) => setState({ ...state, [k]: v });
  return (
    <div className="card p-5 mb-4">
      <h3 className="text-sm font-semibold text-ink mb-3">{state.id ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h3>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-1"><Field label="บาร์โค้ด">
          <div className="flex gap-2">
            <input className={inp} value={state.barcode} onChange={(e) => s("barcode", e.target.value)} placeholder="เลขบาร์โค้ด" />
            <button type="button" onClick={() => setScanning(true)} title="สแกนบาร์โค้ด"
              className="shrink-0 inline-flex items-center gap-1.5 px-3 rounded-lg border border-line bg-surface text-sm font-medium hover:bg-canvas">
              <ScanLine className="w-4 h-4" /> สแกน
            </button>
          </div></Field>
        </div>
        <div className="md:col-span-2"><Field label="ชื่อกลิ่น"><input className={inp} value={state.scent} onChange={(e) => s("scent", e.target.value)} /></Field></div>
        <Field label="Grade"><input className={inp} value={state.grade} onChange={(e) => s("grade", e.target.value)} placeholder="EDP / PARFUM ..." /></Field>
        <Field label="ขนาด"><input className={inp} value={state.size} onChange={(e) => s("size", e.target.value)} placeholder="50 ml." /></Field>
        <Field label="SKU"><input className={inp} value={state.sku} onChange={(e) => s("sku", e.target.value)} /></Field>
        <Field label="ราคา"><input inputMode="numeric" className={inp} value={state.price} onFocus={(e) => e.target.select()} onChange={(e) => s("price", e.target.value.replace(/^0+(?=\d)/, ""))} /></Field>
        <div className="md:col-span-3 flex justify-end gap-2 border-t border-line pt-3">
          <button onClick={() => setState(null)} className="px-4 py-2 rounded-lg border border-line text-sm hover:bg-canvas">ยกเลิก</button>
          <button onClick={onSave} disabled={pending || !state.barcode || !state.scent} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark disabled:opacity-50">{state.id ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}</button>
        </div>
      </div>
      {scanning && <BarcodeScanner onDetected={(code) => { setState({ ...state, barcode: code }); setScanning(false); }} onClose={() => setScanning(false)} />}
    </div>
  );
}
