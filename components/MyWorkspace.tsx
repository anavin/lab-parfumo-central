"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, XCircle, ScanLine, Minus } from "lucide-react";
import { searchProducts, findProductByBarcode } from "@/lib/actions/lookups";
import { submitBill, updateMySale, deleteMySubmission, addBillAttachments, deleteBillAttachment } from "@/lib/actions/submissions";
import { BarcodeScanner, type ScanResult } from "@/components/BarcodeScanner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PromptPayButton } from "@/components/PromptPayButton";
import { PhotoPicker, PhotoStrip } from "@/components/BillPhotos";
import { Select } from "@/components/ui/Select";
import { compressImage } from "@/lib/img";
import { PAYMENTS } from "@/lib/payments";
import { baht, num } from "@/lib/format";
import type { SubmissionRow, BillAttachment } from "@/lib/queries";

const inp = "w-full min-w-0 border border-line rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-brand";
const nowHM = () => new Date().toTimeString().slice(0, 5);
// payment options for the app's own dropdown (tap = apply, no OS "Done" button);
// includes the current value if it isn't a known channel (e.g. legacy data)
const payOptions = (cur?: string) => {
  const base = PAYMENTS.map((p) => ({ value: p.v, label: p.label }));
  if (cur && !PAYMENTS.some((p) => p.v === cur)) base.unshift({ value: cur, label: cur });
  return base;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  // min-w-0 lets the field shrink inside a grid/flex cell — without it iOS native
  // <input type="time"/date"> keep their intrinsic width and overflow onto the neighbour.
  return <label className="block min-w-0"><span className="text-xs text-muted mb-1 block">{label}</span>{children}</label>;
}

// ---- bill (multi-item) types ----
// Per-item price is already discounted; discount_pct is an extra bill-level
// discount (e.g. negotiated when buying several), distributed to each line.
type BillItem = { key: number; item: string; barcode: string; size: string; qty: any; unit_price: any; discount: any; payment_channel?: string };
type BillState = { sale_date: string; sale_time: string; source: string; receipt_no: string; payment_channel: string; nation: string; discount_pct: any; items: BillItem[]; attachments: string[]; splitPay: boolean };
type BillItemPayload = { item: string; barcode: string; size: string; qty: number; unit_price: number; discount: number; payment_channel: string };
const DEFAULT_DISCOUNT_PCT = 0;
let itemKey = 0;
const newItem = (patch: Partial<BillItem> = {}): BillItem => ({ key: ++itemKey, item: "", barcode: "", size: "", qty: 1, unit_price: 0, discount: 0, ...patch });
const blankBill = (date: string, withItem: boolean): BillState => ({ sale_date: date, sale_time: nowHM(), source: "CTW", receipt_no: "", payment_channel: "", nation: "", discount_pct: DEFAULT_DISCOUNT_PCT, items: withItem ? [newItem()] : [], attachments: [], splitPay: false });

// ---- single-item edit type (for editing an existing bill line) ----
type SaleState = { id: number; sale_date: string; sale_time: string; source: string; receipt_no: string; item: string; barcode: string; size: string; qty: any; unit_price: any; discount: any; payment_channel: string; nation: string };

export function MyWorkspace({ date, fullName, rows, attachments = {} }:
  { date: string; fullName: string; rows: SubmissionRow[]; attachments?: Record<string, BillAttachment[]> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [bill, setBill] = useState<BillState | null>(null);
  const [autoScan, setAutoScan] = useState(false);
  const [edit, setEdit] = useState<SaleState | null>(null);
  const [del, setDel] = useState<SubmissionRow | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const refresh = () => router.refresh();
  // In production a server action's error is a generic "Server Components render"
  // message with a digest — usually a transient revalidation/render blip AFTER
  // the write already succeeded. Recover quietly (close + refresh) instead of a
  // scary alert; only show real (client-visible) messages.
  const onActionError = (e: any, close?: () => void) => {
    console.error("[action]", e?.digest, e?.message, e);
    if (e?.digest || /Server Components render/i.test(String(e?.message || ""))) { close?.(); refresh(); }
    else alert(e?.message ?? "ทำรายการไม่สำเร็จ");
  };

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
        items, attachments: bill.attachments,
      });
      setBill(null); refresh();
    } catch (e: any) { onActionError(e, () => setBill(null)); }
  });

  const editRow = (r: SubmissionRow) => {
    setBill(null);
    setEdit({ id: r.id, sale_date: r.entry_date, sale_time: (r.sale_time || "").slice(0, 5) || nowHM(), source: r.source || "CTW", receipt_no: r.receipt_no || "", item: r.item || "", barcode: r.barcode || "", size: r.size || "", qty: r.qty ?? 1, unit_price: r.unit_price ?? 0, discount: r.discount ?? 0, payment_channel: r.payment_channel || "", nation: r.nation || "" });
    // jump up to the edit form once it has rendered (reliable on mobile)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  // group today's entries into bills (items that share a receipt/bill ref)
  const bills: { key: string; rows: SubmissionRow[] }[] = [];
  for (const r of rows) {
    const key = r.receipt_no || `id:${r.id}`;
    let g = bills.find((b) => b.key === key);
    if (!g) { g = { key, rows: [] }; bills.push(g); }
    g.rows.push(r);
  }
  // count only bills that aren't fully rejected, to match the daily-summary KPI
  const activeBillCount = bills.filter((b) => b.rows.some((r) => r.status !== "rejected")).length;

  const addPhotos = (ref: string, imgs: string[]) => start(async () => {
    try { await addBillAttachments(ref, imgs); refresh(); } catch (e: any) { onActionError(e); }
  });
  const delPhoto = (id: number) => start(async () => {
    try { await deleteBillAttachment(id); refresh(); } catch (e: any) { onActionError(e); }
  });

  const busy = bill !== null || edit !== null;

  return (
    <div className="mb-6">
      <div ref={formRef} className="scroll-mt-16" />

      {!busy && (
        <div className="flex gap-2.5 mb-4">
          <button onClick={startScan} className="flex-[2] inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-brand text-white text-base font-semibold shadow-sm hover:bg-brand-dark active:scale-[.99] transition">
            <ScanLine className="w-5 h-5" /> สแกนบาร์โค้ด
          </button>
          <button onClick={startManual} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl border border-line bg-white text-sm font-medium hover:bg-canvas active:scale-[.99] transition">
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
          } catch (e: any) { onActionError(e, () => setEdit(null)); }
        })} />}

      {/* list */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">บิลวันนี้</span>
          <span className="text-xs text-muted">{activeBillCount} บิล</span>
        </div>
        {bills.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted">ยังไม่มีรายการในวันนี้ — กด “สแกนบาร์โค้ด” เพื่อเริ่ม</div>
        ) : (
          <div className="divide-y divide-line">
            {bills.map((b, i) => <BillGroupCard key={b.key} index={bills.length - i} rows={b.rows} pending={pending}
              onEdit={editRow} onDelete={setDel} photos={attachments[b.rows[0].receipt_no || ""] || []}
              onAddPhotos={addPhotos} onDeletePhoto={delPhoto} />)}
          </div>
        )}
      </div>

      <ConfirmDialog open={!!del} title="ลบรายการนี้?" danger confirmLabel="ลบ" pending={pending}
        message={del ? `${del.item}${del.size ? ` ${del.size}` : ""}` : ""}
        onCancel={() => setDel(null)}
        onConfirm={() => { const id = del?.id; setDel(null); if (id != null) start(async () => { try { await deleteMySubmission(id); refresh(); } catch (e: any) { onActionError(e); } }); }} />
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

  // effective payment channel for an item: its own override when split (falling
  // back to the bill default), else the bill default for everyone
  const effChannel = (it: BillItem) => (state.splitPay ? (it.payment_channel || state.payment_channel) : state.payment_channel);

  // per-item discount (baht) + a bill-level extra discount (%) on top
  const pct = Math.min(100, Math.max(0, Number(state.discount_pct) || 0));
  const lines = state.items.map((it) => {
    const sub = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
    const itemDisc = Math.min(sub, Number(it.discount) || 0);
    const billDisc = Math.round(((sub - itemDisc) * pct) / 100);
    const discount = itemDisc + billDisc;   // total discount stored on this line
    return { it, sub, discount, total: sub - discount, channel: effChannel(it) };
  });
  const subtotal = lines.reduce((s, l) => s + l.sub, 0);
  const discountTotal = lines.reduce((s, l) => s + l.discount, 0);
  const itemDiscTotal = lines.reduce((s, l) => s + Math.min(l.sub, Number(l.it.discount) || 0), 0);
  const billDiscTotal = discountTotal - itemDiscTotal;   // baht from the bill-level %
  const net = subtotal - discountTotal;
  const payKnown = PAYMENTS.some((p) => p.v === state.payment_channel);
  // the PromptPay portion of the bill (what the QR should charge)
  const promptpayNet = lines.filter((l) => l.channel === "PromptPay").reduce((s, l) => s + l.total, 0);
  // net grouped by channel — shown when payment is split, so saving isn't confusing
  const payBreakdown = state.splitPay
    ? Object.entries(lines.reduce<Record<string, number>>((m, l) => { const k = l.channel || "?"; m[k] = (m[k] || 0) + l.total; return m; }, {}))
    : [];
  const chLabel = (v: string) => PAYMENTS.find((p) => p.v === v)?.label || (v === "?" ? "ยังไม่เลือก" : v);

  const submit = () => {
    const m: string[] = [];
    if (state.splitPay) {
      if (lines.some((l) => !String(l.channel || "").trim())) m.push("ช่องทางชำระให้ครบทุกชิ้น");
    } else if (!String(state.payment_channel || "").trim()) m.push("ช่องทางชำระ");
    if (!String(state.nation || "").trim()) m.push("สัญชาติ");
    if (state.items.length === 0) m.push("สินค้า");
    else if (state.items.some((it) => !String(it.item || "").trim())) m.push("ชื่อสินค้าให้ครบ");
    setMissing(m);
    if (m.length === 0) onSubmit(lines.map((l) => ({ item: l.it.item, barcode: l.it.barcode, size: l.it.size, qty: Number(l.it.qty), unit_price: Number(l.it.unit_price), discount: l.discount, payment_channel: l.channel })));
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
        {state.items.map((it, i) => <ItemCard key={it.key} it={it} index={i} onChange={(p) => updateItem(it.key, p)} onRemove={() => removeItem(it.key)} showPayment={state.splitPay} paymentDefault={state.payment_channel} />)}
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
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted">ช่องทางชำระ *{state.splitPay ? " (ค่าเริ่มต้นทุกชิ้น)" : ""}</span>
          <label className="inline-flex items-center gap-1.5 text-xs text-muted cursor-pointer select-none">
            <input type="checkbox" checked={state.splitPay} onChange={(e) => set({ splitPay: e.target.checked })} className="accent-brand w-3.5 h-3.5" />
            แยกจ่ายรายชิ้น
          </label>
        </div>
        <Select value={state.payment_channel} onValueChange={(v) => { set({ payment_channel: v }); clearMiss("ช่องทางชำระ"); }}
          options={payOptions(state.payment_channel)} placeholder="- เลือกช่องทางชำระ -"
          className={"py-2.5" + (state.splitPay ? "" : errRing("ช่องทางชำระ"))} />
        {state.splitPay && <div className="mt-1.5 text-[11px] text-muted">เลือกช่องทางของแต่ละชิ้นที่การ์ดสินค้าด้านบน (ไม่เลือก = ใช้ค่าเริ่มต้นนี้)</div>}
        {payBreakdown.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
            {payBreakdown.map(([v, amt]) => <span key={v} className={v === "?" ? "text-danger" : "text-muted"}>{chLabel(v)}: <b className="text-ink tabular-nums">{baht(amt)}</b></span>)}
          </div>
        )}
      </div>

      {/* extra options */}
      <details className="mb-4 border-t border-line/60 pt-3">
        <summary className="text-sm text-brand-dark cursor-pointer select-none list-none">▾ ตัวเลือกเพิ่มเติม <span className="text-muted text-xs">(เลขใบเสร็จ · เวลา · ช่องทางขาย)</span></summary>
        <div className="mt-3 space-y-3">
          <Field label="เลขใบเสร็จ (ถ้ามี)"><input className={inp} value={state.receipt_no} onChange={(e) => set({ receipt_no: e.target.value })} placeholder="เว้นว่างได้ · ระบบตั้งให้ เช่น CTW-260806-001" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="เวลา"><input type="time" className={inp} value={state.sale_time} onChange={(e) => set({ sale_time: e.target.value })} /></Field>
            <Field label="ช่องทางขาย"><select className={inp} value={state.source} onChange={(e) => set({ source: e.target.value })}><option value="CTW">Central World</option><option value="EVENT_SCS">Event</option></select></Field>
          </div>
        </div>
      </details>

      {/* bill-level extra discount (%) — default 0%, adjustable */}
      <div className="mb-4 border-t border-line/60 pt-3">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <span className="text-sm font-medium text-ink">ส่วนลดเพิ่มท้ายบิล</span>
          {pct > 0
            ? <span className="text-sm font-semibold text-brand-dark shrink-0">{pct}% · −{baht(billDiscTotal)}</span>
            : <span className="text-xs text-muted shrink-0">ไม่มีส่วนลด</span>}
        </div>
        <div className="flex items-stretch gap-2">
          {[0, 5, 10].map((v) => (
            <button key={v} onClick={() => set({ discount_pct: v })}
              className={"flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors " +
                (pct === v ? "bg-brand text-white border-brand" : "border-line text-muted hover:bg-canvas")}>
              {v}%
            </button>
          ))}
          <div className={"flex items-center rounded-lg border overflow-hidden shrink-0 " + (![0, 5, 10].includes(pct) ? "border-brand" : "border-line")}>
            <button onClick={() => set({ discount_pct: Math.max(0, pct - 1) })} className="px-2.5 py-2 text-muted hover:bg-canvas" aria-label="ลด"><Minus className="w-4 h-4" /></button>
            <input inputMode="numeric" className="w-9 text-center py-2 text-sm outline-none tabular-nums" value={state.discount_pct} onChange={(e) => set({ discount_pct: e.target.value.replace(/^0+(?=\d)/, "") })} onFocus={(e) => e.target.select()} />
            <button onClick={() => set({ discount_pct: Math.min(100, pct + 1) })} className="px-2.5 py-2 text-muted hover:bg-canvas" aria-label="เพิ่ม"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="text-[11px] text-muted mt-1.5">ราคาต่อชิ้นลดมาแล้ว — ช่องนี้ไว้ลดเพิ่มตอนต่อรอง (กรอกเองได้ในช่อง %)</div>
      </div>

      {/* photo evidence for this bill */}
      <div className="mb-4 border-t border-line/60 pt-3">
        <PhotoPicker value={state.attachments} onChange={(a) => set({ attachments: a })} />
      </div>

      {missing.length > 0 && <div className="mb-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">กรุณาเติมข้อมูลให้ครบ: <b>{missing.join(" · ")}</b></div>}

      <div className="border-t border-line pt-3">
        <div className="space-y-0.5 text-sm mb-3">
          <div className="flex justify-between text-muted"><span>ยอดรวม</span><span>{baht(subtotal)}</span></div>
          {discountTotal > 0 && <div className="flex justify-between text-muted"><span>ส่วนลด{pct > 0 ? ` (รวม ${pct}%)` : ""}</span><span>−{baht(discountTotal)}</span></div>}
          <div className="flex justify-between items-baseline font-semibold text-ink pt-0.5"><span>รวมสุทธิ</span><span className="text-brand-dark text-2xl">{baht(net)}</span></div>
        </div>
        {promptpayNet > 0 && <div className="mb-3"><PromptPayButton amount={promptpayNet} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-brand text-brand-dark text-sm font-semibold hover:bg-brand-soft disabled:opacity-50" /></div>}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2.5 rounded-lg border border-line text-sm hover:bg-canvas">ยกเลิก</button>
          <button onClick={submit} disabled={pending} className="px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">บันทึกข้อมูล</button>
        </div>
      </div>

      {scanning && <BarcodeScanner continuous onDetected={onScanned} onClose={() => setScanning(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------- one bill item
function ItemCard({ it, index, onChange, onRemove, showPayment, paymentDefault = "" }: { it: BillItem; index: number; onChange: (p: Partial<BillItem>) => void; onRemove: () => void; showPayment?: boolean; paymentDefault?: string }) {
  const [res, setRes] = useState<any[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const onName = (v: string) => { onChange({ item: v, barcode: "" }); if (v.trim()) searchProducts(v).then((r) => { setRes(r); setAcOpen(true); }); else setAcOpen(false); };
  const q = Number(it.qty) || 0, up = Number(it.unit_price) || 0;
  // clamp per-item discount to the line subtotal so the card never shows a
  // misleading negative total (mirrors the authoritative BillForm math).
  const dc = Math.min(q * up, Number(it.discount) || 0);
  const line = q * up - dc;
  const fld = "w-full border border-line rounded-lg px-1.5 py-1.5 text-sm text-center tabular-nums focus:outline-none focus:border-brand";
  // numeric field: select-all on focus + strip leading zeros so a leading 0 disappears when typing
  const numAttrs = (k: "qty" | "unit_price" | "discount") => ({
    value: it[k] as any,
    inputMode: "numeric" as const,
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ [k]: e.target.value.replace(/^0+(?=\d)/, "") }),
  });
  const Cell = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><span className="block text-[10px] text-muted text-center mb-0.5">{label}</span>{children}</div>
  );
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      {/* name + size */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-5 text-center text-xs font-medium text-muted shrink-0">{index + 1}</span>
        <div className="flex-1 relative min-w-0">
          <input className="w-full border border-line rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-brand" value={it.item} onChange={(e) => onName(e.target.value)} onBlur={() => setTimeout(() => setAcOpen(false), 150)} placeholder="สแกน หรือพิมพ์ค้นหากลิ่น" />
          {acOpen && res.length > 0 && <div className="absolute z-20 mt-1 w-full max-h-44 overflow-auto bg-white border border-line rounded-lg shadow-lg text-sm">
            {res.map((p) => <button key={p.id} onMouseDown={() => { onChange({ item: p.scent, barcode: p.barcode, size: p.size, unit_price: p.price }); setAcOpen(false); }} className="block w-full text-left px-3 py-2 hover:bg-brand-soft"><b>{p.scent}</b> <span className="text-muted">{p.size} · {p.barcode}</span></button>)}
          </div>}
        </div>
        <input className="w-[70px] shrink-0 border border-line rounded-lg px-1.5 py-2 text-sm text-center text-muted focus:outline-none focus:border-brand" value={it.size} onChange={(e) => onChange({ size: e.target.value })} placeholder="ขนาด" />
        <button onClick={onRemove} className="p-1.5 rounded-lg text-muted hover:bg-red-50 hover:text-red-600 shrink-0" aria-label="ลบ"><Trash2 className="w-4 h-4" /></button>
      </div>
      {/* qty · price · discount — wider now that size moved up */}
      <div className="grid grid-cols-3 gap-2.5 pl-7">
        <Cell label="จำนวน">
          <div className="flex items-stretch rounded-lg border border-line overflow-hidden">
            <button onClick={() => onChange({ qty: Math.max(0, q - 1) })} className="w-7 flex items-center justify-center text-muted hover:bg-canvas" aria-label="ลด"><Minus className="w-4 h-4" /></button>
            <input {...numAttrs("qty")} className="w-full min-w-0 text-center text-sm py-1.5 tabular-nums outline-none" />
            <button onClick={() => onChange({ qty: q + 1 })} className="w-7 flex items-center justify-center text-muted hover:bg-canvas" aria-label="เพิ่ม"><Plus className="w-4 h-4" /></button>
          </div>
        </Cell>
        <Cell label="ราคา"><input {...numAttrs("unit_price")} className={fld} /></Cell>
        <Cell label="ส่วนลด"><input {...numAttrs("discount")} className={fld} /></Cell>
      </div>
      {showPayment && (
        <div className="mt-2.5 pl-7">
          <span className="block text-[10px] text-muted mb-0.5">ช่องทางชำระชิ้นนี้</span>
          <Select value={it.payment_channel || paymentDefault}
            onValueChange={(v) => onChange({ payment_channel: v })}
            options={payOptions(it.payment_channel || paymentDefault)} placeholder="- เลือกช่องทาง -" />
        </div>
      )}
      <div className="text-right text-sm mt-2.5 pt-2 border-t border-line/70">รวม <b className="text-ink text-base">{baht(line)}</b></div>
    </div>
  );
}

// ---------------------------------------------------------------- list item
function StatusPill({ status }: { status: string }) {
  if (status === "approved") return <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700"><Check className="w-3 h-3" /> เข้าระบบแล้ว</span>;
  if (status === "rejected") return <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> ตีกลับ</span>;
  return null; // pending — not shown
}

// one bill = the item lines a customer bought together
function BillGroupCard({ index, rows, onEdit, onDelete, pending, photos = [], onAddPhotos, onDeletePhoto }: {
  index: number; rows: SubmissionRow[]; onEdit: (r: SubmissionRow) => void; onDelete: (r: SubmissionRow) => void; pending: boolean;
  photos?: BillAttachment[]; onAddPhotos?: (ref: string, imgs: string[]) => void; onDeletePhoto?: (id: number) => void;
}) {
  const first = rows[0];
  const total = rows.reduce((s, r) => s + (r.total ?? 0), 0);
  const status = rows.every((r) => r.status === "approved") ? "approved" : rows.some((r) => r.status === "rejected") ? "rejected" : "pending";
  const note = rows.find((r) => r.status === "rejected" && r.review_note)?.review_note;
  const ref = first.receipt_no || "";
  const canEditPhotos = status === "pending" && !!ref;
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-xs text-muted flex flex-wrap items-center gap-x-2">
          <span className="font-semibold text-ink/70">บิล #{index}</span>
          {first.sale_time && <span>· {first.sale_time.slice(0, 5)}</span>}
          {first.payment_channel && <span>· {first.payment_channel}</span>}
          {first.nation && <span>· {first.nation === "Foreign" ? "ต่างชาติ" : "ไทย"}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusPill status={status} />
          <span className="text-sm font-bold text-ink">{baht(total)}</span>
        </div>
      </div>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-2 text-sm">
            <span className="text-muted text-xs w-7 shrink-0 text-right">{num(r.qty ?? 0)}×</span>
            {r.status === "pending" ? (
              <button onClick={() => onEdit(r)} disabled={pending}
                className="group flex-1 min-w-0 flex items-center gap-1.5 text-left disabled:opacity-50" aria-label="แก้ไขรายการนี้">
                <span className="truncate text-ink group-active:text-brand-dark">{r.item} <span className="text-muted text-xs">{r.size}</span></span>
                <Pencil className="w-3 h-3 shrink-0 text-muted/60 group-hover:text-brand-dark" />
              </button>
            ) : (
              <span className="flex-1 min-w-0 truncate text-ink">{r.item} <span className="text-muted text-xs">{r.size}</span></span>
            )}
            <span className="text-ink whitespace-nowrap tabular-nums">{baht(r.total ?? 0)}</span>
            {r.status !== "approved" && (
              <button onClick={() => onDelete(r)} disabled={pending} className="p-1 rounded text-muted hover:text-red-600 disabled:opacity-50 shrink-0" aria-label="ลบ"><Trash2 className="w-3.5 h-3.5" /></button>
            )}
          </li>
        ))}
      </ul>
      {(photos.length > 0 || canEditPhotos) && (
        <div className="mt-2 pt-2 border-t border-line/60">
          <PhotoStrip photos={photos} onDelete={canEditPhotos ? onDeletePhoto : undefined} size={52} />
          {canEditPhotos && onAddPhotos && <AddPhotoInline refId={ref} count={photos.length} pending={pending} onAdd={onAddPhotos} />}
        </div>
      )}
      {note && <div className="text-xs text-red-600 mt-1.5">เหตุผลที่ตีกลับ: {note}</div>}
    </div>
  );
}

// small "add photo" control for a pending bill in the list
function AddPhotoInline({ refId, count, pending, onAdd }: { refId: string; count: number; pending: boolean; onAdd: (ref: string, imgs: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const max = 6 - count;
  if (max <= 0) return null;
  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const out: string[] = [];
      for (const f of Array.from(files).slice(0, max)) { try { out.push(await compressImage(f)); } catch {} }
      if (out.length) onAdd(refId, out);
    } finally { setBusy(false); if (ref.current) ref.current.value = ""; }
  };
  return (
    <>
      <button type="button" onClick={() => ref.current?.click()} disabled={pending || busy}
        className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-brand-dark hover:underline disabled:opacity-50">
        <Plus className="w-3 h-3" /> {busy ? "กำลังแนบ…" : "แนบรูป"}
      </button>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
    </>
  );
}

// ---------------------------------------------------------------- single-item edit
function SaleForm({ state, setState, onSave, pending, fullName }: { state: SaleState; setState: (s: SaleState | null) => void; onSave: () => void; pending: boolean; fullName: string }) {
  const [res, setRes] = useState<any[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const s = (k: keyof SaleState, v: any) => setState({ ...state, [k]: v });
  // numeric field: select-all on focus + strip leading zeros so a default 0 disappears when typing
  const numFld = (k: "qty" | "unit_price" | "discount") => ({
    inputMode: "numeric" as const,
    value: state[k] as any,
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => s(k, e.target.value.replace(/^0+(?=\d)/, "")),
  });
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
        <Field label="จำนวน"><input {...numFld("qty")} className={inp} /></Field>
        <Field label="ราคา/หน่วย"><input {...numFld("unit_price")} className={inp} /></Field>
        <Field label="ส่วนลด"><input {...numFld("discount")} className={inp} /></Field>
        <Field label="ขนาด"><input className={inp} value={state.size} onChange={(e) => s("size", e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <Field label="ช่องทางชำระ *">
          <Select value={state.payment_channel} onValueChange={(v) => { s("payment_channel", v); clearMiss("ช่องทางชำระ"); }}
            options={payOptions(state.payment_channel)} placeholder="- เลือกช่องทางชำระ -"
            className={"py-2.5" + errRing("ช่องทางชำระ")} />
        </Field>
        <Field label="สัญชาติลูกค้า *"><select className={inp + errRing("สัญชาติลูกค้า")} value={state.nation} onChange={(e) => { s("nation", e.target.value); clearMiss("สัญชาติลูกค้า"); }}><option value="">- เลือกสัญชาติ -</option><option value="Thai">ไทย</option><option value="Foreign">ต่างชาติ</option></select></Field>
        <Field label="เลขใบเสร็จ"><input className={inp} value={state.receipt_no} onChange={(e) => s("receipt_no", e.target.value)} placeholder="ไม่มีก็เว้นได้" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Field label="เวลา"><input type="time" className={inp} value={state.sale_time} onChange={(e) => s("sale_time", e.target.value)} /></Field>
        <Field label="ช่องทางขาย"><select className={inp} value={state.source} onChange={(e) => s("source", e.target.value)}><option value="CTW">Central World</option><option value="EVENT_SCS">Event</option></select></Field>
      </div>
      {missing.length > 0 && <div className="mb-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">กรุณาเติมข้อมูลให้ครบ: <b>{missing.join(" · ")}</b></div>}
      {total > 0 && state.payment_channel === "PromptPay" && <div className="mb-3"><PromptPayButton amount={total} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-brand text-brand-dark text-sm font-semibold hover:bg-brand-soft disabled:opacity-50" /></div>}
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
