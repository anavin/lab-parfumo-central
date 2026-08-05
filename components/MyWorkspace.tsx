"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, Clock, XCircle, Users, ScanLine } from "lucide-react";
import { searchProducts, findProductByBarcode } from "@/lib/actions/lookups";
import { submitSale, submitCustomerDay, updateMySale, updateMyCustomerDay, deleteMySubmission } from "@/lib/actions/submissions";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { baht, num } from "@/lib/format";
import type { SubmissionRow } from "@/lib/queries";

const inp = "w-full border border-line rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-brand";
const nowHM = () => new Date().toTimeString().slice(0, 5);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs text-muted mb-1 block">{label}</span>{children}</label>;
}

type SaleState = { id?: number; sale_date: string; sale_time: string; source: string; receipt_no: string; item: string; barcode: string; size: string; qty: any; unit_price: any; discount: any; payment_channel: string; nation: string };
type CustState = { id?: number; cust_date: string; customers: any; thai: any; foreign: any; sell_amount: any };

const blankSale = (date: string): SaleState => ({ sale_date: date, sale_time: nowHM(), source: "CTW", receipt_no: "", item: "", barcode: "", size: "", qty: 1, unit_price: 0, discount: 0, payment_channel: "Cash", nation: "" });
const blankCust = (date: string): CustState => ({ cust_date: date, customers: 0, thai: 0, foreign: 0, sell_amount: 0 });

// payment channels — values match the existing sales data so the dashboard groups correctly
const PAYMENTS = [
  { v: "Cash", label: "เงินสด" },
  { v: "EDC Credit Card", label: "บัตรเครดิต (EDC)" },
  { v: "K Shop", label: "K SHOP" },
  { v: "K Shop Credit Card", label: "K SHOP บัตรเครดิต" },
  { v: "EDC Alipay/WeChat", label: "Alipay / WeChat" },
  { v: "EDC Thai QR Payment", label: "Thai QR" },
  { v: "EDC PromptCard", label: "PromptCard" },
];

export function MyWorkspace({ date, fullName, rows }: { date: string; fullName: string; rows: SubmissionRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sale, setSale] = useState<SaleState | null>(null);
  const [cust, setCust] = useState<CustState | null>(null);

  const refresh = () => router.refresh();

  return (
    <div className="mb-6">
      {/* action buttons */}
      {!sale && !cust && (
        <div className="flex gap-2.5 flex-wrap mb-4">
          <button onClick={() => setSale(blankSale(date))} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark">
            <Plus className="w-4 h-4" /> เพิ่มรายการขาย
          </button>
          <button onClick={() => setCust(blankCust(date))} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-line bg-white text-sm font-medium hover:bg-canvas">
            <Users className="w-4 h-4" /> บันทึกจำนวนลูกค้า
          </button>
        </div>
      )}

      {sale && <SaleForm state={sale} setState={setSale} pending={pending} fullName={fullName}
        onSave={() => start(async () => {
          try {
            const payload = { ...sale, qty: Number(sale.qty), unit_price: Number(sale.unit_price), discount: Number(sale.discount) };
            if (sale.id) await updateMySale(sale.id, payload); else await submitSale(payload);
            setSale(null); refresh();
          } catch (e: any) { alert(e?.message ?? "บันทึกไม่สำเร็จ"); }
        })} />}

      {cust && <CustForm state={cust} setState={setCust} pending={pending} fullName={fullName}
        onSave={() => start(async () => {
          try {
            const payload = { cust_date: cust.cust_date, customers: Number(cust.customers), thai: Number(cust.thai), foreign: Number(cust.foreign), sell_amount: Number(cust.sell_amount) };
            if (cust.id) await updateMyCustomerDay(cust.id, payload); else await submitCustomerDay(payload);
            setCust(null); refresh();
          } catch (e: any) { alert(e?.message ?? "บันทึกไม่สำเร็จ"); }
        })} />}

      {/* list */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">รายการที่กรอกวันนี้</span>
          <span className="text-xs text-muted">{rows.length} รายการ</span>
        </div>
        {rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted">ยังไม่มีรายการในวันนี้ — กด “เพิ่มรายการขาย” เพื่อเริ่ม</div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <SubmissionItem key={r.id} r={r} pending={pending}
                onEdit={() => {
                  if (r.kind === "sale") setSale({ id: r.id, sale_date: r.entry_date, sale_time: (r.sale_time || "").slice(0, 5) || nowHM(), source: r.source || "CTW", receipt_no: r.receipt_no || "", item: r.item || "", barcode: r.barcode || "", size: r.size || "", qty: r.qty ?? 1, unit_price: r.unit_price ?? 0, discount: r.discount ?? 0, payment_channel: r.payment_channel || "เงินสด", nation: r.nation || "" });
                  else setCust({ id: r.id, cust_date: r.entry_date, customers: r.customers ?? 0, thai: r.thai ?? 0, foreign: r.foreign_cnt ?? 0, sell_amount: r.sell_amount ?? 0 });
                }}
                onDelete={() => start(async () => { try { await deleteMySubmission(r.id); refresh(); } catch (e: any) { alert(e?.message ?? "ลบไม่สำเร็จ"); } })} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- list item
function StatusPill({ status }: { status: string }) {
  if (status === "approved") return <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700"><Check className="w-3 h-3" /> เข้าระบบแล้ว</span>;
  if (status === "rejected") return <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> ตีกลับ</span>;
  return <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><Clock className="w-3 h-3" /> รอตรวจ</span>;
}

function SubmissionItem({ r, onEdit, onDelete, pending }: { r: SubmissionRow; onEdit: () => void; onDelete: () => void; pending: boolean }) {
  const editable = r.status === "pending";
  return (
    <li className="px-4 py-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        {r.kind === "sale" ? (
          <div>
            <div className="text-sm font-medium text-ink truncate">{r.item} <span className="text-muted font-normal">{r.size}</span></div>
            <div className="text-xs text-muted mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
              <span>{num(r.qty ?? 0)} ชิ้น · {baht(r.total ?? 0)}</span>
              {r.sale_time && <span>{r.sale_time.slice(0, 5)}</span>}
              {r.payment_channel && <span>{r.payment_channel}</span>}
              {r.nation && <span>{r.nation === "Foreign" ? "ต่างชาติ" : r.nation === "Thai" ? "ไทย" : r.nation}</span>}
              {r.receipt_no && <span>#{r.receipt_no}</span>}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-sm font-medium text-ink">ลูกค้า {num(r.customers ?? 0)} ราย</div>
            <div className="text-xs text-muted mt-0.5">ไทย {num(r.thai ?? 0)} · ต่างชาติ {num(r.foreign_cnt ?? 0)}{r.sell_amount ? ` · ยอด ${baht(r.sell_amount)}` : ""}</div>
          </div>
        )}
        {r.status === "rejected" && r.review_note && <div className="text-xs text-red-600 mt-1">เหตุผล: {r.review_note}</div>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusPill status={r.status} />
        {editable && (
          <>
            <button onClick={onEdit} disabled={pending} className="p-1.5 rounded-lg text-muted hover:bg-canvas hover:text-ink disabled:opacity-50" aria-label="แก้ไข"><Pencil className="w-4 h-4" /></button>
            <button onClick={() => { if (confirm("ลบรายการนี้?")) onDelete(); }} disabled={pending} className="p-1.5 rounded-lg text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50" aria-label="ลบ"><Trash2 className="w-4 h-4" /></button>
          </>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------- sale form
function SaleForm({ state, setState, onSave, pending, fullName }: { state: SaleState; setState: (s: SaleState | null) => void; onSave: () => void; pending: boolean; fullName: string }) {
  const [res, setRes] = useState<any[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const s = (k: keyof SaleState, v: any) => setState({ ...state, [k]: v });
  const onItem = (v: string) => { s("item", v); if (v.trim()) searchProducts(v).then((r) => { setRes(r); setAcOpen(true); }); else setAcOpen(false); };
  const total = (Number(state.qty) || 0) * (Number(state.unit_price) || 0) - (Number(state.discount) || 0);

  const onScanned = async (code: string) => {
    setScanning(false);
    const p = await findProductByBarcode(code);
    if (p) setState({ ...state, item: p.scent, barcode: p.barcode, size: p.size || state.size, unit_price: p.price ?? state.unit_price });
    else { setState({ ...state, barcode: code }); alert(`ไม่พบสินค้าบาร์โค้ดนี้ในระบบ (${code}) — กรอกกลิ่นเองได้`); }
  };

  const payKnown = PAYMENTS.some((p) => p.v === state.payment_channel);

  return (
    <div className="card p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-ink">{state.id ? "แก้ไขรายการขาย" : "เพิ่มรายการขาย"}</h3>
        <span className="text-xs text-muted">ผู้กรอก: {fullName}</span>
      </div>

      {/* 1 — scan first (big, on top) */}
      <button type="button" onClick={() => setScanning(true)}
        className="w-full mb-4 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-brand text-white text-base font-semibold shadow-sm hover:bg-brand-dark active:scale-[.99] transition">
        <ScanLine className="w-5 h-5" /> สแกนบาร์โค้ดสินค้า
      </button>

      {/* 2 — product (auto-filled by scan) */}
      <div className="relative mb-3">
        <Field label="สินค้า">
          <input className={inp} value={state.item} onChange={(e) => onItem(e.target.value)} onBlur={() => setTimeout(() => setAcOpen(false), 150)} placeholder="สแกน หรือพิมพ์ค้นหากลิ่น" />
        </Field>
        {acOpen && res.length > 0 && <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border border-line rounded-lg shadow-lg text-sm">
          {res.map((p) => <button key={p.id} onMouseDown={() => { setState({ ...state, item: p.scent, barcode: p.barcode, size: p.size, unit_price: p.price }); setAcOpen(false); }} className="block w-full text-left px-3 py-2 hover:bg-brand-soft"><b>{p.scent}</b> <span className="text-muted">{p.size} · {p.barcode}</span></button>)}
        </div>}
      </div>

      {/* 3 — the numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <Field label="จำนวน"><input type="number" min="0" inputMode="numeric" className={inp} value={state.qty} onChange={(e) => s("qty", e.target.value)} /></Field>
        <Field label="ราคา/หน่วย"><input type="number" min="0" inputMode="numeric" className={inp} value={state.unit_price} onChange={(e) => s("unit_price", e.target.value)} /></Field>
        <Field label="ส่วนลด"><input type="number" min="0" inputMode="numeric" className={inp} value={state.discount} onChange={(e) => s("discount", e.target.value)} /></Field>
        <Field label="ขนาด"><input className={inp} value={state.size} onChange={(e) => s("size", e.target.value)} /></Field>
      </div>

      {/* 4 — payment (dropdown) + customer + receipt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <Field label="ช่องทางชำระ">
          <select className={inp} value={state.payment_channel} onChange={(e) => s("payment_channel", e.target.value)}>
            {!payKnown && state.payment_channel && <option value={state.payment_channel}>{state.payment_channel}</option>}
            {PAYMENTS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="สัญชาติลูกค้า"><select className={inp} value={state.nation} onChange={(e) => s("nation", e.target.value)}><option value="">- ไม่ระบุ -</option><option value="Thai">ไทย</option><option value="Foreign">ต่างชาติ</option></select></Field>
        <Field label="เลขใบเสร็จ"><input className={inp} value={state.receipt_no} onChange={(e) => s("receipt_no", e.target.value)} placeholder="ไม่มีก็เว้นได้" /></Field>
      </div>

      {/* 5 — rarely-changed defaults, tucked lower */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Field label="วันที่"><input type="date" className={inp} value={state.sale_date} onChange={(e) => s("sale_date", e.target.value)} /></Field>
        <Field label="เวลา"><input type="time" className={inp} value={state.sale_time} onChange={(e) => s("sale_time", e.target.value)} /></Field>
        <Field label="ช่องทางขาย"><select className={inp} value={state.source} onChange={(e) => s("source", e.target.value)}><option value="CTW">Central World</option><option value="EVENT_SCS">Event</option></select></Field>
      </div>

      {/* 6 — summary + actions, at the very bottom */}
      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <div className="text-sm text-muted">รวมทั้งสิ้น <span className="ml-1 text-2xl font-bold text-brand-dark align-middle">{baht(total)}</span></div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setState(null)} className="px-4 py-2.5 rounded-lg border border-line text-sm hover:bg-canvas">ยกเลิก</button>
          <button onClick={onSave} disabled={pending || !state.item} className="px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">{state.id ? "บันทึกการแก้ไข" : "ส่งให้ตรวจสอบ"}</button>
        </div>
      </div>

      {scanning && <BarcodeScanner onDetected={onScanned} onClose={() => setScanning(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------- customer form
function CustForm({ state, setState, onSave, pending, fullName }: { state: CustState; setState: (s: CustState | null) => void; onSave: () => void; pending: boolean; fullName: string }) {
  const s = (k: keyof CustState, v: any) => setState({ ...state, [k]: v });
  return (
    <div className="card p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink">{state.id ? "แก้ไขจำนวนลูกค้า" : "บันทึกจำนวนลูกค้า"}</h3>
        <span className="text-xs text-muted">ผู้กรอก: {fullName}</span>
      </div>
      <div className="grid md:grid-cols-5 gap-3">
        <Field label="วันที่"><input type="date" className={inp} value={state.cust_date} onChange={(e) => s("cust_date", e.target.value)} /></Field>
        <Field label="ลูกค้าทั้งหมด"><input type="number" min="0" className={inp} value={state.customers} onChange={(e) => s("customers", e.target.value)} /></Field>
        <Field label="ไทย"><input type="number" min="0" className={inp} value={state.thai} onChange={(e) => s("thai", e.target.value)} /></Field>
        <Field label="ต่างชาติ"><input type="number" min="0" className={inp} value={state.foreign} onChange={(e) => s("foreign", e.target.value)} /></Field>
        <Field label="ยอดขาย (ถ้ามี)"><input type="number" min="0" className={inp} value={state.sell_amount} onChange={(e) => s("sell_amount", e.target.value)} /></Field>
        <div className="md:col-span-5 flex justify-end gap-2 border-t border-line pt-3">
          <button onClick={() => setState(null)} className="px-4 py-2 rounded-lg border border-line text-sm hover:bg-canvas">ยกเลิก</button>
          <button onClick={onSave} disabled={pending} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark disabled:opacity-50">{state.id ? "บันทึกการแก้ไข" : "ส่งให้ตรวจสอบ"}</button>
        </div>
      </div>
    </div>
  );
}
