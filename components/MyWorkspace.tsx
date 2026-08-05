"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, Clock, XCircle, ScanLine, Minus } from "lucide-react";
import { searchProducts, findProductByBarcode } from "@/lib/actions/lookups";
import { submitBill, updateMySale, deleteMySubmission } from "@/lib/actions/submissions";
import { BarcodeScanner, type ScanResult } from "@/components/BarcodeScanner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { baht, num } from "@/lib/format";
import type { SubmissionRow } from "@/lib/queries";

const inp = "w-full border border-line rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-brand";
const nowHM = () => new Date().toTimeString().slice(0, 5);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs text-muted mb-1 block">{label}</span>{children}</label>;
}

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

// ---- bill (multi-item) types ----
// Per-item price is already discounted; discount_pct is an extra bill-level
// discount (e.g. negotiated when buying several), distributed to each line.
type BillItem = { key: number; item: string; barcode: string; size: string; qty: any; unit_price: any; discount: any };
type BillState = { sale_date: string; sale_time: string; source: string; receipt_no: string; payment_channel: string; nation: string; discount_pct: any; items: BillItem[] };
type BillItemPayload = { item: string; barcode: string; size: string; qty: number; unit_price: number; discount: number };
const DEFAULT_DISCOUNT_PCT = 5;
let itemKey = 0;
const newItem = (patch: Partial<BillItem> = {}): BillItem => ({ key: ++itemKey, item: "", barcode: "", size: "", qty: 1, unit_price: 0, discount: 0, ...patch });
const blankBill = (date: string, withItem: boolean): BillState => ({ sale_date: date, sale_time: nowHM(), source: "CTW", receipt_no: "", payment_channel: "", nation: "", discount_pct: DEFAULT_DISCOUNT_PCT, items: withItem ? [newItem()] : [] });

// ---- single-item edit type (for editing an existing bill line) ----
type SaleState = { id: number; sale_date: string; sale_time: string; source: string; receipt_no: string; item: string; barcode: string; size: string; qty: any; unit_price: any; discount: any; payment_channel: string; nation: string };

export function MyWorkspace({ date, fullName, rows }: { date: string; fullName: string; rows: SubmissionRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [bill, setBill] = useState<BillState | null>(null);
  const [autoScan, setAutoScan] = useState(false);
  const [edit, setEdit] = useState<SaleState | null>(null);
  const [del, setDel] = useState<SubmissionRow | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const refresh = () => router.refresh();

  const startScan = () => { setEdit(null); setAutoScan(true); setBill(blankBill(date, false)); };
  const startManual = () => { setEdit(null); setAutoScan(false); setBill(blankBill(date, true)); };

  // scroll to the form whenever it opens (new bill or edit)
  useEffect(() => {
    const open = bill !== null || edit !== null;
    if (open && !wasOpen.current) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    wasOpen.current = open;
  });

  const submitTheBill = (items: BillItemPayload[]) => start(async () => {
    if (!bill) return;
    try {
      await submitBill({
        sale_date: bill.sale_date, sale_time: bill.sale_time, source: bill.source,
        receipt_no: bill.receipt_no, payment_channel: bill.payment_channel, nation: bill.nation,
        items,
      });
      setBill(null); refresh();
    } catch (e: any) { alert(e?.message ?? "บันทึกไม่สำเร็จ"); }
  });

  const busy = bill !== null || edit !== null;

  return (
    <div className="mb-6">
      <div ref={formRef} className="scroll-mt-16" />

      {!busy && (
        <div className="flex gap-2.5 flex-wrap mb-4">
          <button onClick={startScan} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand text-white text-base font-semibold shadow-sm hover:bg-brand-dark active:scale-[.99] transition">
            <ScanLine className="w-5 h-5" /> สแกนบาร์โค้ด
          </button>
          <button onClick={startManual} className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-line bg-white text-sm font-medium hover:bg-canvas">
            <Plus className="w-4 h-4" /> เพิ่มเอง
          </button>
        </div>
      )}

      {bill && <BillForm state={bill} setState={setBill} pending={pending} fullName={fullName} autoScan={autoScan}
        onCancel={() => setBill(null)} onSubmit={submitTheBill} />}

      {edit && <SaleForm state={edit} setState={setEdit} pending={pending} fullName={fullName}
        onSave={() => start(async () => {
          try {
            await updateMySale(edit.id, { ...edit, qty: Number(edit.qty), unit_price: Number(edit.unit_price), discount: Number(edit.discount) });
            setEdit(null); refresh();
          } catch (e: any) { alert(e?.message ?? "บันทึกไม่สำเร็จ"); }
        })} />}

      {/* list */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">รายการที่กรอกวันนี้</span>
          <span className="text-xs text-muted">{rows.length} รายการ</span>
        </div>
        {rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted">ยังไม่มีรายการในวันนี้ — กด “สแกนบาร์โค้ด” เพื่อเริ่ม</div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <SubmissionItem key={r.id} r={r} pending={pending}
                onEdit={() => { setBill(null); setEdit({ id: r.id, sale_date: r.entry_date, sale_time: (r.sale_time || "").slice(0, 5) || nowHM(), source: r.source || "CTW", receipt_no: r.receipt_no || "", item: r.item || "", barcode: r.barcode || "", size: r.size || "", qty: r.qty ?? 1, unit_price: r.unit_price ?? 0, discount: r.discount ?? 0, payment_channel: r.payment_channel || "", nation: r.nation || "" }); }}
                onDelete={() => setDel(r)} />
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog open={!!del} title="ลบรายการนี้?" danger confirmLabel="ลบ" pending={pending}
        message={del ? `${del.item}${del.size ? ` ${del.size}` : ""}` : ""}
        onCancel={() => setDel(null)}
        onConfirm={() => { const id = del?.id; setDel(null); if (id != null) start(async () => { try { await deleteMySubmission(id); refresh(); } catch (e: any) { alert(e?.message ?? "ลบไม่สำเร็จ"); } }); }} />
    </div>
  );
}

// ---------------------------------------------------------------- bill builder
function BillForm({ state, setState, onSubmit, onCancel, pending, fullName, autoScan }: {
  state: BillState; setState: (s: BillState) => void; onSubmit: (items: BillItemPayload[]) => void; onCancel: () => void; pending: boolean; fullName: string; autoScan: boolean;
}) {
  const [scanning, setScanning] = useState(!!autoScan);
  const [missing, setMissing] = useState<string[]>([]);
  const set = (patch: Partial<BillState>) => setState({ ...state, ...patch });
  const updateItem = (key: number, patch: Partial<BillItem>) => setState({ ...state, items: state.items.map((it) => (it.key === key ? { ...it, ...patch } : it)) });
  const addItem = (patch: Partial<BillItem> = {}) => setState({ ...state, items: [...state.items, newItem(patch)] });
  const removeItem = (key: number) => setState({ ...state, items: state.items.filter((it) => it.key !== key) });
  const clearMiss = (f: string) => setMissing((m) => m.filter((x) => x !== f));

  const onScanned = async (code: string): Promise<ScanResult> => {
    const p = await findProductByBarcode(code);
    if (p) {
      addItem({ item: p.scent, barcode: p.barcode, size: p.size || "", unit_price: p.price ?? 0 });
      const sub = [p.size, p.price ? `฿${Number(p.price).toLocaleString()}` : ""].filter(Boolean).join(" · ");
      return { ok: true, label: p.scent, sub };
    }
    addItem({ barcode: code });
    return { ok: false, label: `บาร์โค้ด ${code}`, sub: "" };
  };

  // per-item discount (baht) + a bill-level extra discount (%) on top
  const pct = Math.min(100, Math.max(0, Number(state.discount_pct) || 0));
  const lines = state.items.map((it) => {
    const sub = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
    const itemDisc = Math.min(sub, Number(it.discount) || 0);
    const billDisc = Math.round(((sub - itemDisc) * pct) / 100);
    const discount = itemDisc + billDisc;   // total discount stored on this line
    return { it, sub, discount, total: sub - discount };
  });
  const subtotal = lines.reduce((s, l) => s + l.sub, 0);
  const discountTotal = lines.reduce((s, l) => s + l.discount, 0);
  const net = subtotal - discountTotal;
  const payKnown = PAYMENTS.some((p) => p.v === state.payment_channel);

  const submit = () => {
    const m: string[] = [];
    if (!String(state.payment_channel || "").trim()) m.push("ช่องทางชำระ");
    if (!String(state.nation || "").trim()) m.push("สัญชาติ");
    if (state.items.length === 0) m.push("สินค้า");
    else if (state.items.some((it) => !String(it.item || "").trim())) m.push("ชื่อสินค้าให้ครบ");
    setMissing(m);
    if (m.length === 0) onSubmit(lines.map((l) => ({ item: l.it.item, barcode: l.it.barcode, size: l.it.size, qty: Number(l.it.qty), unit_price: Number(l.it.unit_price), discount: l.discount })));
  };
  const errRing = (f: string) => (missing.includes(f) ? " ring-1 ring-red-400 border-red-400" : "");

  return (
    <div className="card p-4 sm:p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-ink">บิลใหม่ · ลูกค้า 1 คน</h3>
        <span className="text-xs text-muted">{fullName}</span>
      </div>

      {/* items */}
      <div className="space-y-2 mb-3">
        {state.items.map((it, i) => <ItemCard key={it.key} it={it} index={i} onChange={(p) => updateItem(it.key, p)} onRemove={() => removeItem(it.key)} />)}
        {state.items.length === 0 && <div className="text-center text-sm text-muted py-6 border border-dashed border-line rounded-xl">ยังไม่มีสินค้า — กด “สแกนเพิ่ม” หรือ “เพิ่มเอง”</div>}
      </div>

      {/* add item */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setScanning(true)} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark active:scale-[.99] transition"><ScanLine className="w-4 h-4" /> สแกนเพิ่ม</button>
        <button onClick={() => addItem()} className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-line bg-white text-sm font-medium hover:bg-canvas"><Plus className="w-4 h-4" /> เพิ่มเอง</button>
      </div>

      {/* nationality — big toggle */}
      <div className="mb-3">
        <div className="text-xs text-muted mb-1">สัญชาติลูกค้า *</div>
        <div className={"grid grid-cols-2 gap-2" + (missing.includes("สัญชาติ") ? " ring-1 ring-red-400 rounded-lg p-0.5" : "")}>
          {([["Thai", "🇹🇭 ไทย"], ["Foreign", "🌏 ต่างชาติ"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => { set({ nation: v }); clearMiss("สัญชาติ"); }} className={"py-3 rounded-lg text-sm font-medium border transition " + (state.nation === v ? "bg-brand text-white border-brand" : "bg-white border-line hover:bg-canvas")}>{l}</button>
          ))}
        </div>
      </div>

      {/* payment */}
      <div className="mb-3">
        <div className="text-xs text-muted mb-1">ช่องทางชำระ *</div>
        <select className={inp + errRing("ช่องทางชำระ")} value={state.payment_channel} onChange={(e) => { set({ payment_channel: e.target.value }); clearMiss("ช่องทางชำระ"); }}>
          <option value="">- เลือกช่องทางชำระ -</option>
          {!payKnown && state.payment_channel && <option value={state.payment_channel}>{state.payment_channel}</option>}
          {PAYMENTS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
        </select>
      </div>

      {/* extra options */}
      <details className="mb-3">
        <summary className="text-xs text-brand-dark cursor-pointer select-none">ตัวเลือกเพิ่มเติม (เลขใบเสร็จ · เวลา · ช่องทางขาย)</summary>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="col-span-2"><Field label="เลขใบเสร็จ (ถ้ามี)"><input className={inp} value={state.receipt_no} onChange={(e) => set({ receipt_no: e.target.value })} placeholder="ไม่มีก็เว้นได้" /></Field></div>
          <Field label="เวลา"><input type="time" className={inp} value={state.sale_time} onChange={(e) => set({ sale_time: e.target.value })} /></Field>
          <Field label="ช่องทางขาย"><select className={inp} value={state.source} onChange={(e) => set({ source: e.target.value })}><option value="CTW">Central World</option><option value="EVENT_SCS">Event</option></select></Field>
        </div>
      </details>

      {/* bill-level extra discount (%) — default 5%, adjustable */}
      <div className="mb-3">
        <div className="text-xs text-muted mb-1">ส่วนลดเพิ่มท้ายบิล (%) <span className="text-muted/70">— ราคาต่อชิ้นลดมาแล้ว อันนี้ลดเพิ่มตอนต่อรอง</span></div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-line overflow-hidden shrink-0">
            <button onClick={() => set({ discount_pct: Math.max(0, pct - 1) })} className="px-3 py-2 hover:bg-canvas" aria-label="ลด"><Minus className="w-4 h-4" /></button>
            <input inputMode="numeric" className="w-12 text-center py-2 text-sm outline-none" value={state.discount_pct} onChange={(e) => set({ discount_pct: e.target.value })} />
            <button onClick={() => set({ discount_pct: Math.min(100, pct + 1) })} className="px-3 py-2 hover:bg-canvas" aria-label="เพิ่ม"><Plus className="w-4 h-4" /></button>
          </div>
          <span className="text-sm text-muted">%</span>
          <div className="ml-auto flex gap-1.5">
            {[0, 5, 10].map((v) => <button key={v} onClick={() => set({ discount_pct: v })} className={"px-2.5 py-1.5 rounded-lg text-xs border " + (pct === v ? "bg-brand text-white border-brand" : "border-line hover:bg-canvas")}>{v}%</button>)}
          </div>
        </div>
      </div>

      {missing.length > 0 && <div className="mb-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">กรุณาเติมข้อมูลให้ครบ: <b>{missing.join(" · ")}</b></div>}

      <div className="border-t border-line pt-3">
        <div className="space-y-0.5 text-sm mb-3">
          <div className="flex justify-between text-muted"><span>ยอดรวม</span><span>{baht(subtotal)}</span></div>
          {discountTotal > 0 && <div className="flex justify-between text-muted"><span>ส่วนลด{pct > 0 ? ` (รวม ${pct}%)` : ""}</span><span>−{baht(discountTotal)}</span></div>}
          <div className="flex justify-between items-baseline font-semibold text-ink pt-0.5"><span>รวมสุทธิ</span><span className="text-brand-dark text-2xl">{baht(net)}</span></div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2.5 rounded-lg border border-line text-sm hover:bg-canvas">ยกเลิก</button>
          <button onClick={submit} disabled={pending} className="px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">ส่งให้ตรวจสอบ</button>
        </div>
      </div>

      {scanning && <BarcodeScanner continuous onDetected={onScanned} onClose={() => setScanning(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------- one bill item
function ItemCard({ it, index, onChange, onRemove }: { it: BillItem; index: number; onChange: (p: Partial<BillItem>) => void; onRemove: () => void }) {
  const [res, setRes] = useState<any[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const onName = (v: string) => { onChange({ item: v, barcode: "" }); if (v.trim()) searchProducts(v).then((r) => { setRes(r); setAcOpen(true); }); else setAcOpen(false); };
  const q = Number(it.qty) || 0, up = Number(it.unit_price) || 0, dc = Number(it.discount) || 0;
  const line = q * up - dc;
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      {/* name + size */}
      <div className="flex items-start gap-2">
        <span className="text-xs text-muted mt-2.5 w-4 shrink-0">{index + 1}</span>
        <div className="flex-1 relative min-w-0">
          <input className={inp} value={it.item} onChange={(e) => onName(e.target.value)} onBlur={() => setTimeout(() => setAcOpen(false), 150)} placeholder="สแกน หรือพิมพ์ค้นหากลิ่น" />
          {acOpen && res.length > 0 && <div className="absolute z-20 mt-1 w-full max-h-44 overflow-auto bg-white border border-line rounded-lg shadow-lg text-sm">
            {res.map((p) => <button key={p.id} onMouseDown={() => { onChange({ item: p.scent, barcode: p.barcode, size: p.size, unit_price: p.price }); setAcOpen(false); }} className="block w-full text-left px-3 py-2 hover:bg-brand-soft"><b>{p.scent}</b> <span className="text-muted">{p.size} · {p.barcode}</span></button>)}
          </div>}
        </div>
        <input className={inp + " w-[74px] shrink-0 text-center px-1"} value={it.size} onChange={(e) => onChange({ size: e.target.value })} placeholder="ขนาด" />
        <button onClick={onRemove} className="p-2 -mr-1 text-muted hover:text-red-600 shrink-0 self-start" aria-label="ลบ"><Trash2 className="w-4 h-4" /></button>
      </div>
      {/* qty + price + discount */}
      <div className="flex items-center gap-2 mt-2 pl-6">
        <div className="flex items-center rounded-lg border border-line overflow-hidden shrink-0">
          <button onClick={() => onChange({ qty: Math.max(0, q - 1) })} className="px-2.5 py-2 hover:bg-canvas" aria-label="ลด"><Minus className="w-4 h-4" /></button>
          <input inputMode="numeric" className="w-8 text-center py-2 text-sm outline-none" value={it.qty} onChange={(e) => onChange({ qty: e.target.value })} />
          <button onClick={() => onChange({ qty: q + 1 })} className="px-2.5 py-2 hover:bg-canvas" aria-label="เพิ่ม"><Plus className="w-4 h-4" /></button>
        </div>
        <input inputMode="numeric" className={inp + " text-right flex-1 min-w-0 px-2"} value={it.unit_price} onChange={(e) => onChange({ unit_price: e.target.value })} placeholder="ราคา" />
        <input inputMode="numeric" className={inp + " text-right flex-1 min-w-0 px-2"} value={it.discount} onChange={(e) => onChange({ discount: e.target.value })} placeholder="ส่วนลด" />
      </div>
      <div className="text-right text-sm mt-1.5 pl-6">รวม <b className="text-ink">{baht(line)}</b></div>
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
  const realReceipt = r.receipt_no && !/^B[0-9A-Z]+$/.test(r.receipt_no) ? r.receipt_no : null; // hide generated bill refs
  return (
    <li className="px-4 py-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink truncate">{r.item} <span className="text-muted font-normal">{r.size}</span></div>
        <div className="text-xs text-muted mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
          <span>{num(r.qty ?? 0)} ชิ้น · {baht(r.total ?? 0)}</span>
          {r.sale_time && <span>{r.sale_time.slice(0, 5)}</span>}
          {r.payment_channel && <span>{r.payment_channel}</span>}
          {r.nation && <span>{r.nation === "Foreign" ? "ต่างชาติ" : r.nation === "Thai" ? "ไทย" : r.nation}</span>}
          {realReceipt && <span>#{realReceipt}</span>}
        </div>
        {r.status === "rejected" && r.review_note && <div className="text-xs text-red-600 mt-1">เหตุผล: {r.review_note}</div>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusPill status={r.status} />
        {editable && (
          <>
            <button onClick={onEdit} disabled={pending} className="p-1.5 rounded-lg text-muted hover:bg-canvas hover:text-ink disabled:opacity-50" aria-label="แก้ไข"><Pencil className="w-4 h-4" /></button>
            <button onClick={onDelete} disabled={pending} className="p-1.5 rounded-lg text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50" aria-label="ลบ"><Trash2 className="w-4 h-4" /></button>
          </>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------- single-item edit
function SaleForm({ state, setState, onSave, pending, fullName }: { state: SaleState; setState: (s: SaleState | null) => void; onSave: () => void; pending: boolean; fullName: string }) {
  const [res, setRes] = useState<any[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const s = (k: keyof SaleState, v: any) => setState({ ...state, [k]: v });
  const onItem = (v: string) => { s("item", v); if (v.trim()) searchProducts(v).then((r) => { setRes(r); setAcOpen(true); }); else setAcOpen(false); };
  const onScanned = async (code: string) => {
    setScanning(false);
    const p = await findProductByBarcode(code);
    if (p) setState({ ...state, item: p.scent, barcode: p.barcode, size: p.size || state.size, unit_price: p.price ?? state.unit_price });
    else { setState({ ...state, barcode: code }); alert(`ไม่พบสินค้าบาร์โค้ดนี้ (${code}) — กรอกกลิ่นเองได้`); }
  };
  const total = (Number(state.qty) || 0) * (Number(state.unit_price) || 0) - (Number(state.discount) || 0);
  const payKnown = PAYMENTS.some((p) => p.v === state.payment_channel);
  const clearMiss = (f: string) => setMissing((m) => m.filter((x) => x !== f));
  const handleSave = () => {
    const m: string[] = [];
    if (!String(state.payment_channel || "").trim()) m.push("ช่องทางชำระ");
    if (!String(state.nation || "").trim()) m.push("สัญชาติลูกค้า");
    setMissing(m);
    if (m.length === 0) onSave();
  };
  const errRing = (f: string) => (missing.includes(f) ? " ring-1 ring-red-400 border-red-400" : "");

  return (
    <div className="card p-4 sm:p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-ink">แก้ไขรายการขาย</h3>
        <span className="text-xs text-muted">ผู้กรอก: {fullName}</span>
      </div>
      <button type="button" onClick={() => setScanning(true)} className="w-full mb-4 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand text-white text-base font-semibold hover:bg-brand-dark"><ScanLine className="w-5 h-5" /> สแกนบาร์โค้ดสินค้า</button>
      <div className="relative mb-3">
        <Field label="สินค้า"><input className={inp} value={state.item} onChange={(e) => onItem(e.target.value)} onBlur={() => setTimeout(() => setAcOpen(false), 150)} placeholder="สแกน หรือพิมพ์ค้นหากลิ่น" /></Field>
        {acOpen && res.length > 0 && <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border border-line rounded-lg shadow-lg text-sm">
          {res.map((p) => <button key={p.id} onMouseDown={() => { setState({ ...state, item: p.scent, barcode: p.barcode, size: p.size, unit_price: p.price }); setAcOpen(false); }} className="block w-full text-left px-3 py-2 hover:bg-brand-soft"><b>{p.scent}</b> <span className="text-muted">{p.size} · {p.barcode}</span></button>)}
        </div>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <Field label="จำนวน"><input type="number" min="0" inputMode="numeric" className={inp} value={state.qty} onChange={(e) => s("qty", e.target.value)} /></Field>
        <Field label="ราคา/หน่วย"><input type="number" min="0" inputMode="numeric" className={inp} value={state.unit_price} onChange={(e) => s("unit_price", e.target.value)} /></Field>
        <Field label="ส่วนลด"><input type="number" min="0" inputMode="numeric" className={inp} value={state.discount} onChange={(e) => s("discount", e.target.value)} /></Field>
        <Field label="ขนาด"><input className={inp} value={state.size} onChange={(e) => s("size", e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <Field label="ช่องทางชำระ *">
          <select className={inp + errRing("ช่องทางชำระ")} value={state.payment_channel} onChange={(e) => { s("payment_channel", e.target.value); clearMiss("ช่องทางชำระ"); }}>
            <option value="">- เลือกช่องทางชำระ -</option>
            {!payKnown && state.payment_channel && <option value={state.payment_channel}>{state.payment_channel}</option>}
            {PAYMENTS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="สัญชาติลูกค้า *"><select className={inp + errRing("สัญชาติลูกค้า")} value={state.nation} onChange={(e) => { s("nation", e.target.value); clearMiss("สัญชาติลูกค้า"); }}><option value="">- เลือกสัญชาติ -</option><option value="Thai">ไทย</option><option value="Foreign">ต่างชาติ</option></select></Field>
        <Field label="เลขใบเสร็จ"><input className={inp} value={state.receipt_no} onChange={(e) => s("receipt_no", e.target.value)} placeholder="ไม่มีก็เว้นได้" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Field label="เวลา"><input type="time" className={inp} value={state.sale_time} onChange={(e) => s("sale_time", e.target.value)} /></Field>
        <Field label="ช่องทางขาย"><select className={inp} value={state.source} onChange={(e) => s("source", e.target.value)}><option value="CTW">Central World</option><option value="EVENT_SCS">Event</option></select></Field>
      </div>
      {missing.length > 0 && <div className="mb-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">กรุณาเติมข้อมูลให้ครบ: <b>{missing.join(" · ")}</b></div>}
      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <div className="text-sm text-muted">รวม <span className="ml-1 text-2xl font-bold text-brand-dark align-middle">{baht(total)}</span></div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setState(null)} className="px-4 py-2.5 rounded-lg border border-line text-sm hover:bg-canvas">ยกเลิก</button>
          <button onClick={handleSave} disabled={pending || !state.item} className="px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">บันทึกการแก้ไข</button>
        </div>
      </div>
      {scanning && <BarcodeScanner onDetected={onScanned} onClose={() => setScanning(false)} />}
    </div>
  );
}
