"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check, XCircle, ScanLine, Minus } from "lucide-react";
import { searchProducts, findProductByBarcode } from "@/lib/actions/lookups";
import { submitBill, updateMySale, deleteMySubmission, addBillAttachments, deleteBillAttachment } from "@/lib/actions/submissions";
import { BarcodeScanner, type ScanResult } from "@/components/BarcodeScanner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { KShopQr } from "@/components/KShopQr";
import { PhotoPicker, PhotoStrip } from "@/components/BillPhotos";
import { Select } from "@/components/ui/Select";
import { compressImage } from "@/lib/img";
import { PAYMENTS, SPLIT2, isSplit, splitOk, resolveTenders } from "@/lib/payments";
import { SplitTenders } from "@/components/SplitTenders";
import { baht, num } from "@/lib/format";
import type { SubmissionRow, BillAttachment, BillTender } from "@/lib/queries";

const inp = "w-full min-w-0 border border-line rounded-lg px-2.5 py-2 text-sm bg-surface focus:outline-none focus:border-brand";
const nowHM = () => new Date().toTimeString().slice(0, 5);
// payment options for the app's own dropdown (tap = apply, no OS "Done" button);
// includes the current value if it isn't a known channel (e.g. legacy data)
const payOptions = (cur?: string) => {
  const base = PAYMENTS.map((p) => ({ value: p.v, label: p.label }));
  if (cur && !PAYMENTS.some((p) => p.v === cur)) base.unshift({ value: cur, label: cur });
  return base;
};
// quantity picker — 1–20 covers virtually every perfume line; a value outside that
// range (e.g. legacy data) is prepended so it stays selectable.
const QTY_OPTS = Array.from({ length: 20 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const qtyOptions = (cur?: any) => {
  const c = Number(cur) || 0;
  return c > 20 ? [{ value: String(c), label: String(c) }, ...QTY_OPTS] : QTY_OPTS;
};
const SOURCE_OPTIONS = [{ value: "CTW", label: "Central World" }, { value: "EVENT_SCS", label: "Event" }];
const NATION_OPTIONS = [{ value: "Thai", label: "ไทย" }, { value: "Foreign", label: "ต่างชาติ" }];
// K Shop channels share the shop's static QR (shown for the customer to scan)
const isKShop = (v?: string) => v === "K Shop" || v === "K Shop Credit Card";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  // min-w-0 lets the field shrink inside a grid/flex cell — without it iOS native
  // <input type="time"/date"> keep their intrinsic width and overflow onto the neighbour.
  return <label className="block min-w-0"><span className="text-xs text-muted mb-1 block">{label}</span>{children}</label>;
}

// ---- bill (multi-item) types ----
// Per-item price is already discounted; discount_pct is an extra bill-level
// discount (e.g. negotiated when buying several), distributed to each line.
type BillItem = { key: number; item: string; barcode: string; size: string; qty: any; unit_price: any; discount: any; payment_channel?: string };
type Tender = { channel: string; amount: any };
type BillState = { sale_date: string; sale_time: string; source: string; receipt_no: string; payment_channel: string; nation: string; discount_pct: any; items: BillItem[]; attachments: string[]; splitPay: boolean; tenders: Tender[] };
type BillItemPayload = { item: string; barcode: string; size: string; qty: number; unit_price: number; discount: number; payment_channel: string };
const DEFAULT_DISCOUNT_PCT = 0;
let itemKey = 0;
const newItem = (patch: Partial<BillItem> = {}): BillItem => ({ key: ++itemKey, item: "", barcode: "", size: "", qty: 1, unit_price: 0, discount: 0, ...patch });
const blankBill = (date: string, withItem: boolean): BillState => ({ sale_date: date, sale_time: nowHM(), source: "CTW", receipt_no: "", payment_channel: "", nation: "", discount_pct: DEFAULT_DISCOUNT_PCT, items: withItem ? [newItem()] : [], attachments: [], splitPay: false, tenders: [] });

// ---- single-item edit type (for editing an existing bill line) ----
type SaleState = { id: number; sale_date: string; sale_time: string; source: string; receipt_no: string; item: string; barcode: string; size: string; qty: any; unit_price: any; discount: any; payment_channel: string; nation: string; tenders: Tender[] };

export function MyWorkspace({ date, today, fullName, rows, attachments = {}, payments = {} }:
  { date: string; today: string; fullName: string; rows: SubmissionRow[]; attachments?: Record<string, BillAttachment[]>; payments?: Record<string, BillTender[]> }) {
  const router = useRouter();
  const viewingPast = date !== today;   // browsing an older day; new sales still go to today
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

  // new sales are always recorded for TODAY (not the day being reviewed)
  const startScan = () => { setEdit(null); setAutoScan(true); setBill(blankBill(today, false)); };
  const startManual = () => { setEdit(null); setAutoScan(false); setBill(blankBill(today, true)); };

  // scroll to the form whenever it opens (new bill or edit)
  useEffect(() => {
    const open = bill !== null || edit !== null;
    if (open && !wasOpen.current) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    wasOpen.current = open;
  });

  const submitTheBill = (items: BillItemPayload[], tenders?: { channel: string; amount: number }[]) => start(async () => {
    if (!bill) return;
    try {
      await submitBill({
        sale_date: bill.sale_date, sale_time: bill.sale_time, source: bill.source,
        receipt_no: bill.receipt_no, payment_channel: bill.payment_channel, nation: bill.nation,
        items, attachments: bill.attachments, tenders,
      });
      setBill(null);
      // the sale is recorded for today — jump to today's view so it's visible
      if (viewingPast) router.push("/my"); else refresh();
    } catch (e: any) { onActionError(e, () => setBill(null)); }
  });

  const editRow = (r: SubmissionRow) => {
    setBill(null);
    // pre-fill the split rows from what was saved (bill_payments), so editing a
    // 2-channel bill shows the original channels + amounts instead of blanks
    const saved = (payments[r.receipt_no || ""] || []).map((t) => ({ channel: t.channel, amount: String(Math.round(t.amount)) }));
    const tenders = isSplit(r.payment_channel) ? (saved.length >= 2 ? saved : [{ channel: "", amount: "" }, { channel: "", amount: "" }]) : [];
    setEdit({ id: r.id, sale_date: r.entry_date, sale_time: (r.sale_time || "").slice(0, 5) || nowHM(), source: r.source || "CTW", receipt_no: r.receipt_no || "", item: r.item || "", barcode: r.barcode || "", size: r.size || "", qty: r.qty ?? 1, unit_price: r.unit_price ?? 0, discount: r.discount ?? 0, payment_channel: r.payment_channel || "", nation: r.nation || "", tenders });
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
          <button onClick={startManual} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl border border-line bg-surface text-sm font-medium hover:bg-canvas active:scale-[.99] transition">
            <Plus className="w-4 h-4" /> เพิ่มเอง
          </button>
        </div>
      )}

      {bill && viewingPast && (
        <div className="mb-3 text-sm bg-warn-soft border border-warn/30 text-warn rounded-lg px-4 py-2.5">
          คุณกำลังดูวันย้อนหลัง — บิลนี้จะบันทึกลง <b>วันนี้</b> ตามปกติ
        </div>
      )}
      {bill && <BillForm state={bill} setState={setBill} pending={pending} fullName={fullName} autoScan={autoScan}
        onCancel={() => setBill(null)} onSubmit={submitTheBill} />}

      {edit && <SaleForm state={edit} setState={setEdit} pending={pending} fullName={fullName}
        onSave={() => start(async () => {
          try {
            const lineTotal = (Number(edit.qty) || 0) * (Number(edit.unit_price) || 0) - (Number(edit.discount) || 0);
            const tenders = isSplit(edit.payment_channel) ? resolveTenders(edit.tenders, lineTotal) : undefined;
            await updateMySale(edit.id, { ...edit, qty: Number(edit.qty), unit_price: Number(edit.unit_price), discount: Number(edit.discount), tenders });
            setEdit(null); refresh();
          } catch (e: any) { onActionError(e, () => setEdit(null)); }
        })} />}

      {/* list */}
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-sm font-semibold text-ink">บิลวันนี้</span>
        <span className="text-xs text-muted">{activeBillCount} บิล</span>
      </div>
      {bills.length === 0 ? (
        <div className="card px-4 py-10 text-center text-sm text-muted">ยังไม่มีรายการในวันนี้ — กด “สแกนบาร์โค้ด” เพื่อเริ่ม</div>
      ) : (
        <div className="space-y-3">
          {bills.map((b, i) => <BillGroupCard key={b.key} index={bills.length - i} rows={b.rows} pending={pending}
            onEdit={editRow} onDelete={setDel} photos={attachments[b.rows[0].receipt_no || ""] || []}
            onAddPhotos={addPhotos} onDeletePhoto={delPhoto} />)}
        </div>
      )}

      <ConfirmDialog open={!!del} title="ลบรายการนี้?" danger confirmLabel="ลบ" pending={pending}
        message={del ? `${del.item}${del.size ? ` ${del.size}` : ""}` : ""}
        onCancel={() => setDel(null)}
        onConfirm={() => { const id = del?.id; setDel(null); if (id != null) start(async () => { try { await deleteMySubmission(id); refresh(); } catch (e: any) { onActionError(e); } }); }} />
    </div>
  );
}

// ---------------------------------------------------------------- bill builder
function BillForm({ state, setState, onSubmit, onCancel, pending, fullName, autoScan }: {
  state: BillState; setState: (s: BillState) => void; onSubmit: (items: BillItemPayload[], tenders?: { channel: string; amount: number }[]) => void; onCancel: () => void; pending: boolean; fullName: string; autoScan: boolean;
}) {
  const [scanning, setScanning] = useState(!!autoScan);
  const [missing, setMissing] = useState<string[]>([]);
  const [qrKey, setQrKey] = useState(0);   // bump to re-pop the K Shop QR (even on same-value pick)
  const bumpQr = (v: string) => { if (isKShop(v)) setQrKey((k) => k + 1); };
  const set = (patch: Partial<BillState>) => setState({ ...state, ...patch });
  const [focusKey, setFocusKey] = useState<number | null>(null);   // newest "เพิ่มเอง" card → scroll + focus its search
  const updateItem = (key: number, patch: Partial<BillItem>) => setState({ ...state, items: state.items.map((it) => (it.key === key ? { ...it, ...patch } : it)) });
  const addItem = (patch: Partial<BillItem> = {}) => setState({ ...state, items: [...state.items, newItem(patch)] });
  // manual add: append an empty row and mark it so its card scrolls up + focuses the search box
  const addManual = () => { const it = newItem(); setFocusKey(it.key); setState({ ...state, items: [...state.items, it] }); };
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

  // ---- split tender: one bill paid across 2+ channels by amount ----
  const split = isSplit(state.payment_channel);
  const tenders: Tender[] = state.tenders ?? [];
  const othersSum = tenders.slice(0, -1).reduce((s, t) => s + (Number(t.amount) || 0), 0);
  // the last row is auto-filled with whatever is left of the bill total
  const tenderAmount = (i: number) => (i < tenders.length - 1 ? Number(tenders[i].amount) || 0 : Math.max(0, net - othersSum));
  const tenderSum = tenders.reduce((s, _t, i) => s + tenderAmount(i), 0);
  const tenderMatches = net > 0 && Math.round(tenderSum) === Math.round(net);
  const setTender = (i: number, patch: Partial<Tender>) => set({ tenders: tenders.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) });
  const addTender = () => set({ tenders: [...tenders, { channel: "", amount: "" }] });
  const removeTender = (i: number) => set({ tenders: tenders.filter((_, idx) => idx !== i) });
  const paymentPick = (v: string) => {
    const patch: Partial<BillState> = { payment_channel: v };
    if (isSplit(v)) { patch.splitPay = false; if ((state.tenders?.length ?? 0) < 2) patch.tenders = [{ channel: "", amount: "" }, { channel: "", amount: "" }]; }
    set(patch); clearMiss("ช่องทางชำระ");
  };

  // net grouped by channel — shown when payment is split, so saving isn't confusing
  const payBreakdown = state.splitPay
    ? Object.entries(lines.reduce<Record<string, number>>((m, l) => { const k = l.channel || "?"; m[k] = (m[k] || 0) + l.total; return m; }, {}))
    : [];
  const chLabel = (v: string) => PAYMENTS.find((p) => p.v === v)?.label || (v === "?" ? "ยังไม่เลือก" : v);

  const submit = () => {
    const m: string[] = [];
    if (split) {
      if (tenders.some((t) => !String(t.channel || "").trim())) m.push("ช่องทางชำระ");
      else if (!tenderMatches) m.push("ยอดชำระให้ตรงกับยอดบิล");
    } else if (state.splitPay) {
      if (lines.some((l) => !String(l.channel || "").trim())) m.push("ช่องทางชำระให้ครบทุกชิ้น");
    } else if (!String(state.payment_channel || "").trim()) m.push("ช่องทางชำระ");
    if (!String(state.nation || "").trim()) m.push("สัญชาติ");
    if (state.items.length === 0) m.push("สินค้า");
    else if (state.items.some((it) => !String(it.item || "").trim())) m.push("ชื่อสินค้าให้ครบ");
    setMissing(m);
    if (m.length > 0) return;
    const items = lines.map((l) => ({ item: l.it.item, barcode: l.it.barcode, size: l.it.size, qty: Number(l.it.qty), unit_price: Number(l.it.unit_price), discount: l.discount, payment_channel: l.channel }));
    const outTenders = split ? tenders.map((t, i) => ({ channel: t.channel, amount: tenderAmount(i) })) : undefined;
    onSubmit(items, outTenders);
  };
  const errRing = (f: string) => (missing.includes(f) ? " ring-1 ring-danger border-danger" : "");

  return (
    <div className="card p-4 sm:p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-ink">บิลใหม่ · ลูกค้า 1 คน</h3>
        <span className="text-xs text-muted">{fullName}</span>
      </div>

      {/* items */}
      <div className="space-y-2 mb-3">
        {state.items.map((it, i) => <ItemCard key={it.key} it={it} index={i} autoFocus={it.key === focusKey} onChange={(p) => updateItem(it.key, p)} onRemove={() => removeItem(it.key)} showPayment={state.splitPay} paymentDefault={state.payment_channel} />)}
        {state.items.length === 0 && <div className="text-center text-sm text-muted py-6 border border-dashed border-line rounded-xl">ยังไม่มีสินค้า — กด “สแกนเพิ่ม” หรือ “เพิ่มเอง”</div>}
      </div>

      {/* add item */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setScanning(true)} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark active:scale-[.99] transition"><ScanLine className="w-4 h-4" /> สแกนเพิ่ม</button>
        <button onClick={addManual} className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-line bg-surface text-sm font-medium hover:bg-canvas"><Plus className="w-4 h-4" /> เพิ่มเอง</button>
      </div>

      {/* nationality — big toggle */}
      <div className="mb-3">
        <div className="text-xs text-muted mb-1">สัญชาติลูกค้า *</div>
        <div className={"grid grid-cols-2 gap-2" + (missing.includes("สัญชาติ") ? " ring-1 ring-danger rounded-lg p-0.5" : "")}>
          {([["Thai", "🇹🇭 ไทย"], ["Foreign", "🌏 ต่างชาติ"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => { set({ nation: v }); clearMiss("สัญชาติ"); }} className={"py-3 rounded-lg text-sm font-medium border transition " + (state.nation === v ? "bg-brand text-white border-brand" : "bg-surface border-line hover:bg-canvas")}>{l}</button>
          ))}
        </div>
      </div>

      {/* bill-level extra discount (%) — default 0%, adjustable. Comes before payment
          so the net total is final when choosing how it's paid (esp. split tenders). */}
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

      {/* payment — last major step, once items + discount give a final net total */}
      <div className="mb-4 border-t border-line/60 pt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted">ช่องทางชำระ *{state.splitPay ? " (ค่าเริ่มต้นทุกชิ้น)" : ""}</span>
          {!split && (
            <label className="inline-flex items-center gap-1.5 text-xs text-muted cursor-pointer select-none">
              <input type="checkbox" checked={state.splitPay} onChange={(e) => set({ splitPay: e.target.checked })} className="accent-brand w-3.5 h-3.5" />
              แยกจ่ายรายชิ้น
            </label>
          )}
        </div>
        <Select value={state.payment_channel} onValueChange={paymentPick} onPick={bumpQr}
          options={[...payOptions(split ? "" : state.payment_channel), { value: SPLIT2, label: "จ่าย 2 ช่องทาง (แยกยอด)" }]}
          placeholder="- เลือกช่องทางชำระ -"
          className={"py-2.5" + (state.splitPay || split ? "" : errRing("ช่องทางชำระ"))} />
        {state.splitPay && <div className="mt-1.5 text-[11px] text-muted">เลือกช่องทางของแต่ละชิ้นที่การ์ดสินค้าด้านบน (ไม่เลือก = ใช้ค่าเริ่มต้นนี้)</div>}

        {/* split tender rows: pick each channel + amount; last row auto-fills the remainder */}
        {split && (
          <div className="mt-2 space-y-2">
            {tenders.map((t, i) => {
              const last = i === tenders.length - 1;
              return (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex-1 min-w-0">
                    <Select value={t.channel} onValueChange={(v) => { setTender(i, { channel: v }); clearMiss("ช่องทางชำระ"); }} onPick={bumpQr}
                      options={payOptions(t.channel)} placeholder="- เลือกช่องทาง -"
                      className={"py-2" + (missing.includes("ช่องทางชำระ") && !t.channel ? " ring-1 ring-danger border-danger" : "")} />
                  </div>
                  <div className="relative w-28 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-sm">฿</span>
                    <input inputMode="numeric" value={last ? String(Math.round(tenderAmount(i))) : (t.amount ?? "")} readOnly={last}
                      onChange={(e) => setTender(i, { amount: e.target.value.replace(/[^\d]/g, "") })} onFocus={(e) => e.target.select()}
                      className={"w-full border border-line rounded-lg pl-6 pr-2 py-2 text-sm text-right tabular-nums focus:outline-none focus:border-brand " + (last ? "bg-canvas text-muted" : "bg-surface")} />
                  </div>
                  {tenders.length > 2 && !last && (
                    <button type="button" onClick={() => removeTender(i)} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger shrink-0" aria-label="ลบช่องทาง"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              );
            })}
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={addTender} disabled={tenders.length >= 3}
                className="text-xs text-brand-dark hover:underline disabled:opacity-40 disabled:no-underline inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> เพิ่มช่องทาง</button>
              <span className={"text-xs font-medium " + (tenderMatches ? "text-success" : "text-danger")}>
                รวมชำระ {baht(tenderSum)}{tenderMatches ? " · ตรงกับยอดบิล" : (tenderSum < net ? ` · ขาด ${baht(net - tenderSum)}` : ` · เกิน ${baht(tenderSum - net)}`)}
              </span>
            </div>
          </div>
        )}

        {payBreakdown.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
            {payBreakdown.map(([v, amt]) => <span key={v} className={v === "?" ? "text-danger" : "text-muted"}>{chLabel(v)}: <b className="text-ink tabular-nums">{baht(amt)}</b></span>)}
          </div>
        )}
      </div>

      {/* photo evidence for this bill — after payment so the slip can be attached */}
      <div className="mb-4 border-t border-line/60 pt-3">
        <PhotoPicker value={state.attachments} onChange={(a) => set({ attachments: a })} />
      </div>

      {/* extra options — least-used, kept collapsed near the end */}
      <details className="mb-4 border-t border-line/60 pt-3">
        <summary className="text-sm text-brand-dark cursor-pointer select-none list-none">▾ ตัวเลือกเพิ่มเติม <span className="text-muted text-xs">(เลขใบเสร็จ · เวลา · ช่องทางขาย)</span></summary>
        <div className="mt-3 space-y-3">
          <Field label="เลขใบเสร็จ (ถ้ามี)"><input className={inp} value={state.receipt_no} onChange={(e) => set({ receipt_no: e.target.value })} placeholder="เว้นว่างได้ · ระบบตั้งให้ เช่น CTW-260806-001" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="เวลา"><input type="time" className={inp} value={state.sale_time} onChange={(e) => set({ sale_time: e.target.value })} /></Field>
            <Field label="ช่องทางขาย"><Select value={state.source} onValueChange={(v) => set({ source: v })} options={SOURCE_OPTIONS} className="py-2.5" /></Field>
          </div>
        </div>
      </details>

      {missing.length > 0 && <div className="mb-3 text-sm bg-danger-soft border border-danger/30 text-danger rounded-lg px-3 py-2">กรุณาเติมข้อมูลให้ครบ: <b>{missing.join(" · ")}</b></div>}

      <div className="border-t border-line pt-3">
        <div className="space-y-0.5 text-sm">
          <div className="flex justify-between text-muted"><span>ยอดรวม</span><span>{baht(subtotal)}</span></div>
          {discountTotal > 0 && <div className="flex justify-between text-muted"><span>ส่วนลด{pct > 0 ? ` (รวม ${pct}%)` : ""}</span><span>−{baht(discountTotal)}</span></div>}
        </div>
        {(split ? tenders.some((t) => isKShop(t.channel)) : isKShop(state.payment_channel)) && <div className="mt-3"><KShopQr key={qrKey} /></div>}
      </div>

      {/* sticky action bar — net total + save stay reachable no matter how long the
          bill gets on a phone; pins to the viewport bottom while scrolling the form */}
      <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-5 mt-3 px-4 sm:px-5 pt-3 bg-surface/95 backdrop-blur border-t border-line flex items-center justify-between gap-3 shadow-[0_-4px_14px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="min-w-0 leading-tight">
          <div className="text-[11px] text-muted">รวมสุทธิ</div>
          <div className="text-brand-dark text-xl font-bold tabular-nums truncate">{baht(net)}</div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={onCancel} className="px-4 min-h-[48px] rounded-lg border border-line text-sm font-medium hover:bg-canvas">ยกเลิก</button>
          <button onClick={submit} disabled={pending || (split && !tenderMatches)} className="px-6 min-h-[48px] rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">บันทึกข้อมูล</button>
        </div>
      </div>

      {scanning && <BarcodeScanner continuous onDetected={onScanned} onClose={() => setScanning(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------- one bill item
// Module-level so it keeps a stable component identity — defining it inside
// ItemCard made React remount the inputs on every keystroke (couldn't type
// more than one digit at a time).
const Cell = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><span className="block text-[10px] text-muted text-center mb-0.5">{label}</span>{children}</div>
);

function ItemCard({ it, index, onChange, onRemove, showPayment, paymentDefault = "", autoFocus = false }: { it: BillItem; index: number; onChange: (p: Partial<BillItem>) => void; onRemove: () => void; showPayment?: boolean; paymentDefault?: string; autoFocus?: boolean }) {
  const [res, setRes] = useState<any[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  // when this card was just added via "เพิ่มเอง", bring it into view and focus the
  // search box so the user can start typing the next item immediately
  useEffect(() => {
    if (!autoFocus) return;
    nameRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 120);
  }, [autoFocus]);
  // qty is a dropdown now (no keyboard) — just fill the product and close the list
  const pick = (p: any) => { onChange({ item: p.scent, barcode: p.barcode, size: p.size, unit_price: p.price }); setAcOpen(false); };
  const onName = (v: string) => { onChange({ item: v, barcode: "" }); if (v.trim()) searchProducts(v).then((r) => { setRes(r); setAcOpen(true); }); else setAcOpen(false); };
  const q = Number(it.qty) || 0, up = Number(it.unit_price) || 0;
  // clamp per-item discount to the line subtotal so the card never shows a
  // misleading negative total (mirrors the authoritative BillForm math).
  const dc = Math.min(q * up, Number(it.discount) || 0);
  const line = q * up - dc;
  const fld = "w-full border border-line rounded-lg px-1.5 py-1.5 text-sm text-center tabular-nums focus:outline-none focus:border-brand";
  // numeric field: select-all on focus + strip leading zeros so a leading 0 disappears when typing
  const numAttrs = (k: "unit_price" | "discount") => ({
    value: it[k] as any,
    inputMode: "numeric" as const,
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ [k]: e.target.value.replace(/^0+(?=\d)/, "") }),
  });
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      {/* name + size */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-5 text-center text-xs font-medium text-muted shrink-0">{index + 1}</span>
        <div className="flex-1 relative min-w-0">
          <input ref={nameRef} className="w-full border border-line rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-brand" value={it.item} onChange={(e) => onName(e.target.value)} onBlur={() => setTimeout(() => setAcOpen(false), 150)} placeholder="สแกน หรือพิมพ์ค้นหากลิ่น" />
          {acOpen && res.length > 0 && <div className="absolute z-20 mt-1 w-full max-h-44 overflow-auto bg-surface border border-line rounded-lg shadow-lg text-sm">
            {res.map((p) => <button key={p.id} onMouseDown={() => pick(p)} className="block w-full text-left px-3 py-2 hover:bg-brand-soft"><b>{p.scent}</b> <span className="text-muted">{p.size} · {p.barcode}</span></button>)}
          </div>}
        </div>
        {/* size stays hidden WHILE searching (dropdown open) so the search field stays
            full-width & easy to read; it appears only after a product is chosen or the
            name is committed (dropdown closed on pick/blur) — editable for manual items. */}
        {it.item.trim() !== "" && !acOpen && (
          <input className="w-[76px] shrink-0 border border-line rounded-lg px-1.5 py-2 text-sm text-center text-ink focus:outline-none focus:border-brand" value={it.size} onChange={(e) => onChange({ size: e.target.value })} placeholder="ขนาด" />
        )}
        <button onClick={onRemove} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger shrink-0" aria-label="ลบ"><Trash2 className="w-4 h-4" /></button>
      </div>
      {/* qty · price · discount — wider now that size moved up */}
      <div className="grid grid-cols-3 gap-2.5 pl-7">
        <Cell label="จำนวน">
          <Select value={String(q || 1)} onValueChange={(v) => onChange({ qty: Number(v) })} options={qtyOptions(it.qty)} className="py-2.5 justify-center min-h-[44px]" />
        </Cell>
        <Cell label="ราคา"><input {...numAttrs("unit_price")} className={fld} /></Cell>
        <Cell label="ส่วนลด"><input {...numAttrs("discount")} className={fld} /></Cell>
      </div>
      {/* quick per-item discount — the shop's standard amounts; tap to apply, tap
          again to clear. Hidden for free / complimentary items (price 0). */}
      {up > 0 && (
        <div className="mt-2 pl-7 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted mr-0.5">ลดเร็ว</span>
          {[200, 100, 50].map((v) => {
            const active = Number(it.discount) === v;
            return (
              <button key={v} type="button" onClick={() => onChange({ discount: active ? 0 : v })}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums border transition ${active ? "bg-brand text-white border-brand" : "border-line text-ink hover:bg-canvas"}`}>
                −฿{v}
              </button>
            );
          })}
          {Number(it.discount) > 0 && (
            <button type="button" onClick={() => onChange({ discount: 0 })} className="px-2 py-1 rounded-full text-xs text-muted hover:bg-canvas">ล้าง</button>
          )}
        </div>
      )}
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
  if (status === "approved") return <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-success-soft text-success"><Check className="w-3 h-3" /> เข้าระบบแล้ว</span>;
  if (status === "rejected") return <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-danger-soft text-danger"><XCircle className="w-3 h-3" /> ตีกลับ</span>;
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
    <div className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden">
      {/* header bar — makes each bill clearly its own card */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-canvas/70 border-b border-line">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center h-6 min-w-[30px] px-1.5 rounded-md bg-brand text-white text-xs font-bold shrink-0">#{index}</span>
          <div className="text-[11px] text-muted flex flex-wrap items-center gap-x-2 min-w-0">
            {first.sale_time && <span>{first.sale_time.slice(0, 5)}</span>}
            {first.payment_channel && <span>· {first.payment_channel}</span>}
            {first.nation && <span>· {first.nation === "Foreign" ? "ต่างชาติ" : "ไทย"}</span>}
            <span>· {rows.length} รายการ</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusPill status={status} />
          <span className="text-sm font-bold text-ink tabular-nums">{baht(total)}</span>
        </div>
      </div>
      <div className="px-3.5 py-2.5">
      <ul className="space-y-1">
        {rows.map((r, i) => (
          <li key={r.id} className="flex items-center gap-2 text-sm">
            <span className="w-4 h-4 shrink-0 rounded-full bg-canvas text-muted text-[10px] font-semibold tabular-nums flex items-center justify-center">{i + 1}</span>
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
              <button onClick={() => onDelete(r)} disabled={pending} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-50 shrink-0" aria-label="ลบ"><Trash2 className="w-4 h-4" /></button>
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
      {note && <div className="text-xs text-danger mt-1.5">เหตุผลที่ตีกลับ: {note}</div>}
      </div>
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
      let failed = 0;
      for (const f of Array.from(files).slice(0, max)) { try { out.push(await compressImage(f)); } catch { failed++; } }
      if (out.length) onAdd(refId, out);
      if (failed) alert(`แนบไม่สำเร็จ ${failed} รูป — รองรับ JPG/PNG (รูป HEIC จาก iPhone บางเครื่องแปลงไม่ได้ ลอง “ถ่ายรูป” แทน)`);
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
  const [qrKey, setQrKey] = useState(0);
  const bumpQr = (v: string) => { if (isKShop(v)) setQrKey((k) => k + 1); };
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
  const split = isSplit(state.payment_channel);
  const tendersOk = splitOk(state.tenders ?? [], total);
  const paymentPick = (v: string) => {
    s("payment_channel", v); clearMiss("ช่องทางชำระ");
    if (isSplit(v) && (state.tenders?.length ?? 0) < 2) setState({ ...state, payment_channel: v, tenders: [{ channel: "", amount: "" }, { channel: "", amount: "" }] });
  };
  const clearMiss = (f: string) => setMissing((m) => m.filter((x) => x !== f));
  const handleSave = () => {
    const m: string[] = [];
    if (split) { if (!tendersOk) m.push("ยอดชำระ 2 ช่องทางให้ครบและตรงกับยอดบิล"); }
    else if (!String(state.payment_channel || "").trim()) m.push("ช่องทางชำระ");
    if (!String(state.nation || "").trim()) m.push("สัญชาติลูกค้า");
    setMissing(m);
    if (m.length === 0) onSave();
  };
  const errRing = (f: string) => (missing.includes(f) ? " ring-1 ring-danger border-danger" : "");

  return (
    <div className="card p-4 sm:p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-ink">แก้ไขรายการขาย</h3>
        <span className="text-xs text-muted">ผู้กรอก: {fullName}</span>
      </div>
      <button type="button" onClick={() => setScanning(true)} className="w-full mb-4 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand text-white text-base font-semibold hover:bg-brand-dark"><ScanLine className="w-5 h-5" /> สแกนบาร์โค้ดสินค้า</button>
      <div className="relative mb-3">
        <Field label="สินค้า"><input className={inp} value={state.item} onChange={(e) => onItem(e.target.value)} onBlur={() => setTimeout(() => setAcOpen(false), 150)} placeholder="สแกน หรือพิมพ์ค้นหากลิ่น" /></Field>
        {acOpen && res.length > 0 && <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-surface border border-line rounded-lg shadow-lg text-sm">
          {res.map((p) => <button key={p.id} onMouseDown={() => { setState({ ...state, item: p.scent, barcode: p.barcode, size: p.size, unit_price: p.price }); setAcOpen(false); }} className="block w-full text-left px-3 py-2 hover:bg-brand-soft"><b>{p.scent}</b> <span className="text-muted">{p.size} · {p.barcode}</span></button>)}
        </div>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <Field label="จำนวน"><Select value={String(Number(state.qty) || 1)} onValueChange={(v) => s("qty", Number(v))} options={qtyOptions(state.qty)} className="py-2.5" /></Field>
        <Field label="ราคา/หน่วย"><input {...numFld("unit_price")} className={inp} /></Field>
        <Field label="ส่วนลด"><input {...numFld("discount")} className={inp} /></Field>
        <Field label="ขนาด"><input className={inp} value={state.size} onChange={(e) => s("size", e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <Field label="ช่องทางชำระ *">
          <Select value={state.payment_channel} onValueChange={paymentPick} onPick={bumpQr}
            options={[...payOptions(split ? "" : state.payment_channel), { value: SPLIT2, label: "จ่าย 2 ช่องทาง (แยกยอด)" }]}
            placeholder="- เลือกช่องทางชำระ -"
            className={"py-2.5" + (split ? "" : errRing("ช่องทางชำระ"))} />
        </Field>
        <Field label="สัญชาติลูกค้า *"><Select value={state.nation} onValueChange={(v) => { s("nation", v); clearMiss("สัญชาติลูกค้า"); }} options={NATION_OPTIONS} placeholder="- เลือกสัญชาติ -" className={"py-2.5" + errRing("สัญชาติลูกค้า")} /></Field>
        <Field label="เลขใบเสร็จ"><input className={inp} value={state.receipt_no} onChange={(e) => s("receipt_no", e.target.value)} placeholder="ไม่มีก็เว้นได้" /></Field>
      </div>
      {split && (
        <div className="mb-3">
          <div className="text-xs text-muted mb-1">แยกยอดแต่ละช่องทาง (รวมต้องเท่ากับ {baht(total)})</div>
          <SplitTenders value={state.tenders ?? []} onChange={(t) => { s("tenders", t); clearMiss("ยอดชำระ 2 ช่องทางให้ครบและตรงกับยอดบิล"); }} net={total} onPick={bumpQr} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Field label="เวลา"><input type="time" className={inp} value={state.sale_time} onChange={(e) => s("sale_time", e.target.value)} /></Field>
        <Field label="ช่องทางขาย"><Select value={state.source} onValueChange={(v) => s("source", v)} options={SOURCE_OPTIONS} className="py-2.5" /></Field>
      </div>
      {missing.length > 0 && <div className="mb-3 text-sm bg-danger-soft border border-danger/30 text-danger rounded-lg px-3 py-2">กรุณาเติมข้อมูลให้ครบ: <b>{missing.join(" · ")}</b></div>}
      {(split ? (state.tenders ?? []).some((t) => isKShop(t.channel)) : isKShop(state.payment_channel)) && <KShopQr key={qrKey} />}
      {/* sticky action bar — matches the new-bill form so saving an edit is always
          one tap away on mobile */}
      <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-5 mt-3 px-4 sm:px-5 pt-3 bg-surface/95 backdrop-blur border-t border-line flex items-center justify-between gap-3 shadow-[0_-4px_14px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="min-w-0 leading-tight">
          <div className="text-[11px] text-muted">รวม</div>
          <div className="text-brand-dark text-xl font-bold tabular-nums truncate">{baht(total)}</div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setState(null)} className="px-4 min-h-[48px] rounded-lg border border-line text-sm font-medium hover:bg-canvas">ยกเลิก</button>
          <button onClick={handleSave} disabled={pending || !state.item || (split && !tendersOk)} className="px-6 min-h-[48px] rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">บันทึกการแก้ไข</button>
        </div>
      </div>
      {scanning && <BarcodeScanner onDetected={onScanned} onClose={() => setScanning(false)} />}
    </div>
  );
}
