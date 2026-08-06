"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchProducts } from "@/lib/actions/lookups";
import { createSale, createCashEntry, createCustomerDay } from "@/lib/actions/entries";
import { Select } from "@/components/ui/Select";
import { PAYMENTS } from "@/lib/payments";

const inp = "w-full border border-line rounded-lg px-2.5 py-2 text-sm bg-surface text-ink focus:outline-none focus:border-brand";
const today = () => new Date().toISOString().slice(0, 10);

const SOURCE_OPTS = [{ value: "CTW", label: "Central World" }, { value: "EVENT_SCS", label: "Event" }];
const NATION_OPTS = [{ value: "Thai", label: "ไทย" }, { value: "Foreign", label: "ต่างชาติ" }];
const PAY_OPTS = PAYMENTS.map((p) => ({ value: p.v, label: p.label }));

// Presentational panel — no hooks. `open`/`onToggle` are owned by the parent so
// every Add* component keeps its hook order stable (Rules of Hooks).
function Panel({ open, onToggle, title, children }: { open: boolean; onToggle: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
          open ? "btn-ghost" : "bg-brand text-white hover:bg-brand-dark"}`}
      >
        {open ? "✕ ปิด" : title}
      </button>
      {open && <div className="card p-5 mt-3">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="text-xs text-muted mb-1 block">{label}</span>{children}</label>;
}

// ---------------------------------------------------------------- sale
export function AddSale() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ sale_date: today(), source: "CTW", ba: "", receipt_no: "", item: "", barcode: "", size: "", qty: 1, unit_price: 0, discount: 0, payment_channel: "Cash", nation: "" });
  const [res, setRes] = useState<any[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const s = (k: string, v: any) => setF((o: any) => ({ ...o, [k]: v }));

  const onItem = (v: string) => { s("item", v); if (v.trim()) searchProducts(v).then((r) => { setRes(r); setAcOpen(true); }); else setAcOpen(false); };
  const total = (Number(f.qty) || 0) * (Number(f.unit_price) || 0) - (Number(f.discount) || 0);
  const canSave = !!f.item.trim() && Number(f.qty) > 0 && Number(f.unit_price) > 0;
  const save = () => start(async () => {
    try { await createSale(f); setOpen(false); router.refresh(); } catch (e: any) { alert(e?.message ?? "บันทึกไม่สำเร็จ"); }
  });

  return (
    <Panel open={open} onToggle={() => setOpen((o) => !o)} title="+ เพิ่มรายการขาย">
      <div className="grid md:grid-cols-4 gap-3">
        <Field label="วันที่"><input type="date" className={inp} value={f.sale_date} onChange={(e) => s("sale_date", e.target.value)} /></Field>
        <Field label="ช่องทาง"><Select value={f.source} onValueChange={(v) => s("source", v)} options={SOURCE_OPTS} /></Field>
        <Field label="BA"><input className={inp} value={f.ba} onChange={(e) => s("ba", e.target.value)} /></Field>
        <Field label="เลขใบเสร็จ"><input className={inp} value={f.receipt_no} onChange={(e) => s("receipt_no", e.target.value)} /></Field>
        <div className="md:col-span-2 relative"><Field label="สินค้า">
          <input className={inp} value={f.item} onChange={(e) => onItem(e.target.value)} onBlur={() => setTimeout(() => setAcOpen(false), 150)} placeholder="ค้นหากลิ่น" /></Field>
          {acOpen && res.length > 0 && <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-surface border border-line rounded-lg shadow-lg text-sm">
            {res.map((p) => <button key={p.id} onMouseDown={() => { s("item", p.scent); s("barcode", p.barcode); s("size", p.size); s("unit_price", p.price); setAcOpen(false); }} className="block w-full text-left px-3 py-2.5 hover:bg-brand/10"><b className="text-ink">{p.scent}</b> <span className="text-muted">{p.size} · {p.barcode}</span></button>)}
          </div>}
        </div>
        <Field label="ขนาด"><input className={inp} value={f.size} onChange={(e) => s("size", e.target.value)} /></Field>
        <Field label="สัญชาติ"><Select value={f.nation || undefined} onValueChange={(v) => s("nation", v)} options={NATION_OPTS} placeholder="— เลือก —" /></Field>
        <Field label="จำนวน"><input inputMode="numeric" className={inp} value={f.qty} onFocus={(e) => e.target.select()} onChange={(e) => s("qty", e.target.value.replace(/^0+(?=\d)/, ""))} /></Field>
        <Field label="ราคา/หน่วย"><input inputMode="numeric" className={inp} value={f.unit_price} onFocus={(e) => e.target.select()} onChange={(e) => s("unit_price", e.target.value.replace(/^0+(?=\d)/, ""))} /></Field>
        <Field label="ส่วนลด"><input inputMode="numeric" className={inp} value={f.discount} onFocus={(e) => e.target.select()} onChange={(e) => s("discount", e.target.value.replace(/^0+(?=\d)/, ""))} /></Field>
        <Field label="ช่องทางชำระ"><Select value={f.payment_channel} onValueChange={(v) => s("payment_channel", v)} options={PAY_OPTS} /></Field>
        <div className="md:col-span-4 flex items-center justify-between border-t border-line pt-3">
          <span className="text-sm text-ink">รวม: <b>฿{total.toLocaleString()}</b></span>
          <button onClick={save} disabled={pending || !canSave} title={canSave ? "" : "ต้องมีชื่อสินค้า จำนวน และราคามากกว่า 0"} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark disabled:opacity-50">บันทึกการขาย</button>
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- cash
export function AddCash() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ cash_date: today(), description: "เงินสดหน้าร้าน CTW", amount: 0, type: "เงินสดย่อย" });
  const s = (k: string, v: any) => setF((o: any) => ({ ...o, [k]: v }));
  const save = () => start(async () => {
    try { await createCashEntry(f); setOpen(false); router.refresh(); } catch (e: any) { alert(e?.message ?? "บันทึกไม่สำเร็จ"); }
  });

  return (
    <Panel open={open} onToggle={() => setOpen((o) => !o)} title="+ เพิ่มรายการเงินสด">
      <div className="grid md:grid-cols-4 gap-3">
        <Field label="วันที่"><input type="date" className={inp} value={f.cash_date} onChange={(e) => s("cash_date", e.target.value)} /></Field>
        <Field label="รายละเอียด"><input className={inp} value={f.description} onChange={(e) => s("description", e.target.value)} /></Field>
        <Field label="ประเภท"><input className={inp} value={f.type} onChange={(e) => s("type", e.target.value)} /></Field>
        <Field label="จำนวนเงิน"><input inputMode="numeric" className={inp} value={f.amount} onFocus={(e) => e.target.select()} onChange={(e) => s("amount", e.target.value.replace(/^0+(?=\d)/, ""))} /></Field>
        <div className="md:col-span-4 text-right"><button onClick={save} disabled={pending} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark disabled:opacity-50">บันทึก</button></div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------- customer day
export function AddCustomerDay() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ cust_date: today(), ba: "", customers: 0, sell_amount: 0, thai: 0, foreign: 0 });
  const s = (k: string, v: any) => setF((o: any) => ({ ...o, [k]: v }));
  const save = () => start(async () => {
    try { await createCustomerDay(f); setOpen(false); router.refresh(); } catch (e: any) { alert(e?.message ?? "บันทึกไม่สำเร็จ"); }
  });

  return (
    <Panel open={open} onToggle={() => setOpen((o) => !o)} title="+ บันทึกลูกค้ารายวัน">
      <div className="grid md:grid-cols-6 gap-3">
        <Field label="วันที่"><input type="date" className={inp} value={f.cust_date} onChange={(e) => s("cust_date", e.target.value)} /></Field>
        <Field label="BA"><input className={inp} value={f.ba} onChange={(e) => s("ba", e.target.value)} /></Field>
        <Field label="ลูกค้า"><input inputMode="numeric" className={inp} value={f.customers} onFocus={(e) => e.target.select()} onChange={(e) => s("customers", e.target.value.replace(/^0+(?=\d)/, ""))} /></Field>
        <Field label="ยอดขาย"><input inputMode="numeric" className={inp} value={f.sell_amount} onFocus={(e) => e.target.select()} onChange={(e) => s("sell_amount", e.target.value.replace(/^0+(?=\d)/, ""))} /></Field>
        <Field label="ไทย"><input inputMode="numeric" className={inp} value={f.thai} onFocus={(e) => e.target.select()} onChange={(e) => s("thai", e.target.value.replace(/^0+(?=\d)/, ""))} /></Field>
        <Field label="ต่างชาติ"><input inputMode="numeric" className={inp} value={f.foreign} onFocus={(e) => e.target.select()} onChange={(e) => s("foreign", e.target.value.replace(/^0+(?=\d)/, ""))} /></Field>
        <div className="md:col-span-6 text-right"><button onClick={save} disabled={pending} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark disabled:opacity-50">บันทึก</button></div>
      </div>
    </Panel>
  );
}
