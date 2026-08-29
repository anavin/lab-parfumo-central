"use client";
import { useState, useMemo, useTransition, useEffect, useContext, useRef } from "react";
import { useRouter } from "next/navigation";
import { ReviewDayContext } from "@/components/review-day-context";
import { Check, X, CheckCheck, Clock, Pencil, CalendarDays, RotateCcw, ChevronDown, ShieldCheck, Search, Users, Trash2, Plus, Receipt as ReceiptIcon, AlertTriangle, Undo2 } from "lucide-react";
import { approveMany, trashMany, unapproveMany, updateSubmissionByAdmin, updateBillTime, addBillItemsByAdmin, rejectMany } from "@/lib/actions/submissions";
import { baht, num } from "@/lib/format";
import { PhotoStrip } from "@/components/BillPhotos";
import { PAYMENTS, SPLIT2, isSplit, splitOk, resolveTenders } from "@/lib/payments";
import { SplitTenders } from "@/components/SplitTenders";
import { Select } from "@/components/ui/Select";
import type { SubmissionRow, BillAttachment, BillTender } from "@/lib/queries";
import { branchOptions } from "@/lib/branches";

const SOURCE_OPTIONS = branchOptions();
const NATION_OPTIONS = [{ value: "Thai", label: "ไทย" }, { value: "Foreign", label: "ต่างชาติ" }];

const payEditOptions = (cur?: string) => {
  const base = PAYMENTS.map((p) => ({ value: p.v, label: p.label }));
  if (cur && cur !== SPLIT2 && !PAYMENTS.some((p) => p.v === cur)) base.unshift({ value: cur, label: cur });
  base.push({ value: SPLIT2, label: "จ่าย 2 ช่องทาง (แยกยอด)" });
  return base;
};

const chLabel = (v: string) => PAYMENTS.find((p) => p.v === v)?.label.replace(/\s*\(.*\)$/, "") || v;
// full payment label exactly as shown in the edit dropdown (e.g. "บัตรเครดิต (EDC)")
const payLabel = (v: string) => PAYMENTS.find((p) => p.v === v)?.label || v;

const inp = "w-full min-w-0 border border-line rounded-lg px-2.5 py-2 text-sm bg-surface focus:outline-none focus:border-brand";
const numAttrs = (v: any, on: (s: string) => void) => ({
  value: v ?? "", inputMode: "numeric" as const,
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => on(e.target.value.replace(/^0+(?=\d)/, "")),
});
const Fld = ({ label, children }: { label: string; children: React.ReactNode }) =>
  <label className="block min-w-0"><span className="text-[11px] text-muted mb-0.5 block">{label}</span>{children}</label>;

const fmtThaiDay = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

type Bill = { key: string; ref: string; author: string; rows: SubmissionRow[] };
type Day = { date: string; bills: Bill[] };

// Cheap heuristics that flag a bill worth a second look before approving — free items,
// deep discounts, missing barcodes, or oddly large quantities. Pure display; never blocks.
function billAnomalies(bill: Bill): string[] {
  const out: string[] = [];
  for (const r of bill.rows) {
    if (r.kind !== "sale") continue;
    const qty = Number(r.qty) || 0, price = Number(r.unit_price) || 0, disc = Number(r.discount) || 0;
    const sub = qty * price;
    const name = r.item || "รายการ";
    if (price === 0) out.push(`${name}: ราคา 0`);
    else if (sub > 0 && disc >= sub) out.push(`${name}: ส่วนลดเต็มจำนวน`);
    else if (sub > 0 && disc / sub > 0.5) out.push(`${name}: ส่วนลด >50%`);
    if (!r.barcode) out.push(`${name}: ไม่มีบาร์โค้ด`);
    if (qty > 50) out.push(`${name}: จำนวนสูงผิดปกติ (${qty})`);
  }
  return [...new Set(out)];
}

// group rows by DAY, then by BILL (shared receipt/ref), preserving order
function groupDays(rows: SubmissionRow[]): Day[] {
  const days: Day[] = [];
  for (const r of rows) {
    let day = days.find((d) => d.date === r.entry_date);
    if (!day) { day = { date: r.entry_date, bills: [] }; days.push(day); }
    const bkey = r.receipt_no || `id:${r.id}`;
    let bill = day.bills.find((b) => b.key === bkey);
    if (!bill) { bill = { key: bkey, ref: r.receipt_no || "", author: r.author, rows: [] }; day.bills.push(bill); }
    bill.rows.push(r);
  }
  days.sort((a, b) => (a.date < b.date ? 1 : -1));   // newest day first
  return days;
}

function SplitBreakdown({ tenders }: { tenders?: BillTender[] }) {
  if (!tenders?.length) return null;
  return (
    <div className="mt-2 pt-2 border-t border-line/60 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
      <span className="font-medium text-ink">จ่าย {tenders.length} ช่องทาง:</span>
      {tenders.map((t, i) => <span key={i}>{chLabel(t.channel)} <b className="text-ink tabular-nums">{baht(t.amount)}</b></span>)}
    </div>
  );
}

// Inline sale-time editor in a pending bill's header (applies to all rows of the bill).
function BillTime({ bill, onSaved }: { bill: Bill; onSaved: () => void }) {
  const cur = (bill.rows[0]?.sale_time || "").slice(0, 5);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(cur);
  const [pending, start] = useTransition();
  const save = () => start(async () => {
    const r = await updateBillTime(bill.rows.map((x) => x.id), val);
    if (r?.ok) { setEditing(false); onSaved(); } else alert(r?.error ?? "บันทึกเวลาไม่สำเร็จ");
  });
  if (editing) {
    return (
      <span className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <input type="time" value={val} autoFocus onChange={(e) => setVal(e.target.value)}
          className="border border-line rounded-md px-1.5 py-0.5 text-[11px] bg-surface text-ink focus:outline-none focus:border-brand" />
        <button onClick={save} disabled={pending || !val} className="text-success disabled:opacity-40" aria-label="บันทึกเวลา"><Check className="w-3.5 h-3.5" /></button>
        <button onClick={() => { setEditing(false); setVal(cur); }} className="text-muted hover:text-ink" aria-label="ยกเลิก"><X className="w-3.5 h-3.5" /></button>
      </span>
    );
  }
  return (
    <button onClick={() => { setVal(cur); setEditing(true); }} title="แก้เวลาขายของบิลนี้"
      className="inline-flex items-center gap-1 hover:text-brand-dark transition-colors">
      <Clock className="w-3 h-3" />{cur || "ใส่เวลา"}<Pencil className="w-2.5 h-2.5 opacity-50" />
    </button>
  );
}

export function ReviewQueue({ rows, approved = [], attachments = {}, payments = {} }:
  { rows: SubmissionRow[]; approved?: SubmissionRow[]; attachments?: Record<string, BillAttachment[]>; payments?: Record<string, BillTender[]> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);      // bill key being processed
  const [editId, setEditId] = useState<number | null>(null);
  const [showApproved, setShowApproved] = useState(true);   // approved section open by default
  const refresh = () => router.refresh();

  // ---- filter by salesperson + free-text search ----
  const [who, setWho] = useState("");        // selected salesperson ("" = all)
  const [qtext, setQtext] = useState("");
  const query = qtext.trim().toLowerCase();
  const match = (r: SubmissionRow) =>
    (!who || r.author === who) &&
    (!query || [r.author, r.item, r.receipt_no, r.size, r.barcode].some((v) => (v || "").toLowerCase().includes(query)));

  // salesperson chips — pending bill count per author (approved-only authors show 0)
  const people = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of groupDays(rows)) for (const b of d.bills) m.set(b.author, (m.get(b.author) ?? 0) + 1);
    for (const r of approved) if (r.author && !m.has(r.author)) m.set(r.author, 0);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "th"));
  }, [rows, approved]);
  const totalPendingBills = people.reduce((s, [, c]) => s + c, 0);

  const days = groupDays(rows.filter(match));
  const approvedDays = groupDays(approved.filter(match));

  // Bill number = chronological rank within its day (earliest = #1), computed across
  // BOTH pending and approved bills so a bill keeps the SAME number in either section
  // (stable across approve/un-approve) and matches the salesperson page's numbering.
  const billRank = useMemo(() => {
    const m = new Map<string, number>();
    // bucket by (day + salesperson) so each person's bills number 1..N like their own /my page
    const buckets = new Map<string, Bill[]>();
    const collect = (d: Day) => {
      for (const b of d.bills) {
        const k = `${d.date}|${b.author}`;
        const arr = buckets.get(k) ?? [];
        if (!arr.some((x) => x.key === b.key)) arr.push(b);
        buckets.set(k, arr);
      }
    };
    groupDays(rows).forEach(collect);
    groupDays(approved).forEach(collect);
    const sortKey = (b: Bill) => `${b.rows[0]?.sale_time || "99:99"}|${String(b.rows[0]?.id ?? 0).padStart(12, "0")}`;
    for (const bills of buckets.values()) {
      [...bills].sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : 1)).forEach((b, i) => m.set(b.key, i + 1));
    }
    return m;
  }, [rows, approved]);
  const billNo = (b: Bill, fallback: number) => billRank.get(b.key) ?? fallback;
  // show one day at a time (today by default); other days are picked from the dropdown
  const [approvedDate, setApprovedDate] = useState("");
  // clicking a bar in the daily chart jumps this section to that day + opens + scrolls
  const approvedRef = useRef<HTMLDivElement>(null);
  const { day: pickedDay, nonce } = useContext(ReviewDayContext);
  useEffect(() => {
    if (!pickedDay) return;
    setApprovedDate(pickedDay);
    setShowApproved(true);
    const t = setTimeout(() => approvedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    return () => clearTimeout(t);
  }, [pickedDay, nonce]);
  const activeApprovedDate = approvedDate && approvedDays.some((d) => d.date === approvedDate)
    ? approvedDate
    : (approvedDays.find((d) => d.date === bkkToday())?.date ?? approvedDays[0]?.date ?? "");
  const shownApprovedDays = approvedDays.filter((d) => d.date === activeApprovedDate);
  const activeDayBillCount = shownApprovedDays.reduce((s, d) => s + d.bills.length, 0);
  const shownBills = days.reduce((s, d) => s + d.bills.length, 0);
  const shownTotal = days.reduce((s, d) => s + d.bills.reduce((x, b) => x + b.rows.reduce((y, r) => y + (r.total ?? 0), 0), 0), 0);

  const approveBill = (bill: Bill) => start(async () => {
    setBusy(bill.key);
    try { await approveMany(bill.rows.map((r) => r.id)); refresh(); }
    catch (e: any) { alert(e?.message ?? "ไม่สำเร็จ"); } finally { setBusy(null); }
  });
  const trashBill = (bill: Bill) => {
    if (!confirm("ลบบิลนี้?\nบิลจะถูกย้ายไปถังขยะ — กู้คืนได้ที่หน้า ‘ถังขยะ’")) return;
    start(async () => {
      setBusy(bill.key);
      try {
        const r = await trashMany(bill.rows.map((x) => x.id));
        if (r?.ok) refresh(); else alert(r?.error ?? "ลบไม่สำเร็จ");
      } catch { alert("ลบไม่สำเร็จ ลองใหม่อีกครั้ง"); } finally { setBusy(null); }
    });
  };
  const rejectBill = (bill: Bill) => {
    const note = prompt("ตีกลับบิลนี้ให้พนักงานแก้ไข\nใส่หมายเหตุ (เหตุผล) ให้พนักงานเห็น:", "");
    if (note === null) return;   // cancelled
    start(async () => {
      setBusy(bill.key);
      try {
        const n = await rejectMany(bill.rows.map((r) => r.id), note.trim());
        if (n > 0) refresh(); else alert("ตีกลับไม่สำเร็จ");
      } catch (e: any) { alert(e?.message ?? "ตีกลับไม่สำเร็จ"); } finally { setBusy(null); }
    });
  };
  const approveDay = (day: Day) => {
    const ids = day.bills.flatMap((b) => b.rows.map((r) => r.id));
    if (!confirm(`อนุมัติทั้งวัน ${fmtThaiDay(day.date)} · ${day.bills.length} บิล?`)) return;
    start(async () => { try { await approveMany(ids); refresh(); } catch (e: any) { alert(e?.message ?? "ไม่สำเร็จ"); } });
  };
  const unapproveBill = (bill: Bill) => {
    if (!confirm("ยกเลิกการอนุมัติบิลนี้?\nยอดจะถูกดึงออกจากระบบการขาย และบิลจะกลับไปสถานะ ‘รอตรวจ’")) return;
    start(async () => {
      setBusy(bill.key);
      try { await unapproveMany(bill.rows.map((r) => r.id)); refresh(); }
      catch (e: any) { alert(e?.message ?? "ไม่สำเร็จ"); } finally { setBusy(null); }
    });
  };

  return (
    <div className="space-y-6">
      {/* ---- filter toolbar: search + salesperson ---- */}
      {(rows.length > 0 || approved.length > 0) && (
        <div className="card p-3 sm:p-3.5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={qtext} onChange={(e) => setQtext(e.target.value)}
              placeholder="ค้นหา ชื่อพนักงาน / สินค้า / เลขใบเสร็จ"
              className="w-full border border-line rounded-lg pl-9 pr-9 py-2.5 text-sm bg-surface text-ink focus:outline-none focus:border-brand" />
            {qtext && (
              <button onClick={() => setQtext("")} aria-label="ล้างคำค้นหา"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-canvas"><X className="w-4 h-4" /></button>
            )}
          </div>
          {people.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-muted mr-0.5"><Users className="w-3.5 h-3.5" /> พนักงานขาย:</span>
              <button onClick={() => setWho("")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${!who ? "bg-brand text-white border-brand" : "bg-surface text-ink border-line hover:bg-canvas"}`}>
                ทั้งหมด <span className={`tabular-nums text-[11px] ${!who ? "opacity-90" : "text-muted"}`}>{totalPendingBills}</span>
              </button>
              {people.map(([name, cnt]) => (
                <button key={name} onClick={() => setWho(who === name ? "" : name)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${who === name ? "bg-brand text-white border-brand" : "bg-surface text-ink border-line hover:bg-canvas"}`}>
                  {name} <span className={`tabular-nums text-[11px] ${who === name ? "opacity-90" : "text-muted"}`}>{cnt}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card px-4 py-16 text-center text-muted"><CheckCheck className="w-8 h-8 mx-auto mb-2 text-success" /><div className="text-sm">ไม่มีรายการรอตรวจสอบ</div></div>
      ) : days.length === 0 ? (
        <div className="card px-4 py-14 text-center text-muted"><Search className="w-7 h-7 mx-auto mb-2 opacity-50" /><div className="text-sm">ไม่พบบิลที่ตรงกับตัวกรอง</div>
          <button onClick={() => { setWho(""); setQtext(""); }} className="mt-3 text-xs text-brand-dark font-medium hover:underline">ล้างตัวกรอง</button></div>
      ) : (
      <div className="space-y-6">
      {/* summary of what's shown */}
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted">แสดง <b className="text-ink">{shownBills}</b> บิล{who ? ` ของ ${who}` : "รอตรวจสอบ"}</span>
        <span className="font-semibold text-ink tabular-nums">รวม {baht(shownTotal)}</span>
      </div>
      {days.map((day) => {
        const dayTotal = day.bills.reduce((s, b) => s + b.rows.reduce((x, r) => x + (r.total ?? 0), 0), 0);
        return (
          <div key={day.date}>
            {/* day header */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 text-ink min-w-0">
                <CalendarDays className="w-4 h-4 text-brand-dark shrink-0" />
                <span className="text-sm font-semibold">{fmtThaiDay(day.date)}</span>
                <span className="text-xs text-muted whitespace-nowrap">· {day.bills.length} บิล · {baht(dayTotal)}</span>
              </div>
              <button onClick={() => approveDay(day)} disabled={pending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 shrink-0">
                <CheckCheck className="w-3.5 h-3.5" /> อนุมัติทั้งวัน
              </button>
            </div>

            {/* bills of the day */}
            <div className="grid gap-3 lg:grid-cols-2 items-start">
              {day.bills.map((bill, i) => {
                const first = bill.rows[0];
                const total = bill.rows.reduce((s, r) => s + (r.total ?? 0), 0);
                const photos = attachments[bill.ref] || [];
                const isSale = first.kind === "sale";
                const anomalies = billAnomalies(bill);
                return (
                  <div key={bill.key} className={`rounded-xl border bg-surface shadow-sm overflow-hidden ${anomalies.length ? "border-warn/50" : "border-line"}`}>
                    {/* bill header */}
                    <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-canvas/70 border-b border-line">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="inline-flex items-center justify-center h-6 min-w-[30px] px-1.5 rounded-md bg-brand text-white text-xs font-bold shrink-0" title={bill.ref || undefined}>#{billNo(bill, i + 1)}</span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-ink truncate">{bill.author}</div>
                          <div className="text-[11px] text-muted flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <BillTime bill={bill} onSaved={refresh} />
                            {first.payment_channel && <span>· {payLabel(first.payment_channel)}</span>}
                            {first.nation && <span>· {first.nation === "Foreign" ? "ต่างชาติ" : "ไทย"}</span>}
                            {isSale && <span>· {bill.rows.length} รายการ</span>}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-ink tabular-nums shrink-0">{baht(total)}</span>
                    </div>

                    {anomalies.length > 0 && (
                      <div className="flex items-start gap-1.5 px-3.5 py-1.5 bg-warn-soft/60 border-b border-warn/20 text-[11px] text-warn">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="min-w-0"><b>ตรวจสอบ:</b> {anomalies.join(" · ")}</span>
                      </div>
                    )}
                    {/* items */}
                    <div className="px-3.5 py-2.5">
                      <ul className="space-y-1.5">
                        {bill.rows.map((r, i) => (
                          <li key={r.id}>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="w-4 h-4 shrink-0 rounded-full bg-canvas text-muted text-[10px] font-semibold tabular-nums flex items-center justify-center">{i + 1}</span>
                              {isSale ? (
                                <>
                                  <span className="text-muted text-xs w-8 shrink-0 text-right">{num(r.qty ?? 0)}×</span>
                                  <span className="flex-1 min-w-0 truncate text-ink">{r.item} <span className="text-muted text-xs">{r.size}</span></span>
                                  <span className="text-ink tabular-nums whitespace-nowrap">{baht(r.total ?? 0)}</span>
                                </>
                              ) : (
                                <span className="flex-1 text-ink">ลูกค้า {num(r.customers ?? 0)} ราย · ไทย {num(r.thai ?? 0)} · ต่างชาติ {num(r.foreign_cnt ?? 0)}</span>
                              )}
                              <button onClick={() => setEditId(editId === r.id ? null : r.id)} disabled={pending}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 ${editId === r.id ? "text-brand-dark bg-brand/10" : "text-muted/60 hover:text-brand-dark hover:bg-canvas"}`} aria-label="แก้ไขรายการนี้">
                                <Pencil className="w-4 h-4" />
                              </button>
                            </div>
                            {editId === r.id && (
                              <RowEditor row={r} pending={pending} savedTenders={payments[bill.ref]}
                                onCancel={() => setEditId(null)}
                                onSave={(payload) => start(async () => {
                                  try { await updateSubmissionByAdmin(r.id, payload); setEditId(null); refresh(); }
                                  catch (e: any) { alert(e?.message ?? "บันทึกไม่สำเร็จ"); }
                                })} />
                            )}
                          </li>
                        ))}
                      </ul>

                      {bill.ref && <AddItemAdmin refId={bill.ref} pending={pending} onDone={refresh} />}
                      <SplitBreakdown tenders={payments[bill.ref]} />
                      {photos.length > 0 && <div className="mt-2 pt-2 border-t border-line/60"><PhotoStrip photos={photos} size={52} /></div>}

                      {/* per-bill actions */}
                      <div className="flex gap-2 items-center justify-end mt-3 pt-2.5 border-t border-line">
                        {bill.ref && (
                          <a href={`/receipt/${encodeURIComponent(bill.ref)}`} target="_blank" rel="noopener"
                            className="mr-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-muted text-sm font-medium hover:bg-canvas hover:text-ink">
                            <ReceiptIcon className="w-4 h-4" /> ใบเสร็จ
                          </a>
                        )}
                        <button onClick={() => trashBill(bill)} disabled={pending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-danger text-sm font-medium hover:bg-danger-soft disabled:opacity-50">
                          <Trash2 className="w-4 h-4" /> ลบ
                        </button>
                        <button onClick={() => rejectBill(bill)} disabled={pending} title="ส่งบิลกลับให้พนักงานแก้ไข พร้อมหมายเหตุ"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-warn text-sm font-medium hover:bg-warn-soft disabled:opacity-50">
                          {busy === bill.key ? <Clock className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />} ตีกลับ
                        </button>
                        <button onClick={() => approveBill(bill)} disabled={pending}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                          {busy === bill.key ? <Clock className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} อนุมัติบิลนี้
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      </div>
      )}

      {/* -------- approved bills (undo an approval) -------- */}
      {approvedDays.length > 0 && (
        <div ref={approvedRef} className="scroll-mt-4">
          <button onClick={() => setShowApproved((v) => !v)}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line bg-canvas/60 text-ink hover:bg-canvas transition-colors">
            <ShieldCheck className="w-4 h-4 text-success shrink-0" />
            <span className="text-sm font-semibold">อนุมัติแล้ว</span>
            <span className="text-xs text-muted">· {activeDayBillCount} บิล</span>
            <ChevronDown className={`w-4 h-4 text-muted ml-auto transition-transform ${showApproved ? "rotate-180" : ""}`} />
          </button>

          {showApproved && (
            <div className="space-y-6 mt-3">
              {/* pick which day to view (defaults to today) */}
              {approvedDays.length > 1 && (
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-muted">เลือกวัน</span>
                  <select value={activeApprovedDate} onChange={(e) => setApprovedDate(e.target.value)}
                    className="border border-line rounded-lg px-3 py-1.5 text-sm bg-surface text-ink focus:outline-none focus:border-brand">
                    {approvedDays.map((d) => (
                      <option key={d.date} value={d.date}>{fmtThaiDay(d.date)} · {d.bills.length} บิล</option>
                    ))}
                  </select>
                </label>
              )}
              {shownApprovedDays.map((day) => {
                const dayTotal = day.bills.reduce((s, b) => s + b.rows.reduce((x, r) => x + (r.total ?? 0), 0), 0);
                return (
                  <div key={day.date}>
                    <div className="flex items-center gap-2 mb-2.5 text-ink min-w-0">
                      <CalendarDays className="w-4 h-4 text-brand-dark shrink-0" />
                      <span className="text-sm font-semibold">{fmtThaiDay(day.date)}</span>
                      <span className="text-xs text-muted whitespace-nowrap">· {day.bills.length} บิล · {baht(dayTotal)}</span>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2 items-start">
                      {day.bills.map((bill, i) => {
                        const first = bill.rows[0];
                        const total = bill.rows.reduce((s, r) => s + (r.total ?? 0), 0);
                        const photos = attachments[bill.ref] || [];
                        const isSale = first.kind === "sale";
                        return (
                          <div key={bill.key} className="rounded-xl border border-green-200 bg-surface shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-success-soft/60 border-b border-success/20">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="inline-flex items-center justify-center h-6 min-w-[30px] px-1.5 rounded-md bg-green-600 text-white text-xs font-bold shrink-0" title={bill.ref || undefined}>#{billNo(bill, i + 1)}</span>
                                <div className="min-w-0">
                                  <div className="text-[13px] font-medium text-ink truncate">{bill.author}</div>
                                  <div className="text-[11px] text-muted flex flex-wrap gap-x-2">
                                    {first.sale_time && <span>{first.sale_time.slice(0, 5)}</span>}
                                    {first.payment_channel && <span>· {payLabel(first.payment_channel)}</span>}
                                    {first.nation && <span>· {first.nation === "Foreign" ? "ต่างชาติ" : "ไทย"}</span>}
                                    {isSale && <span>· {bill.rows.length} รายการ</span>}
                                    {first.reviewer && <span>· โดย {first.reviewer}</span>}
                                  </div>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-ink tabular-nums shrink-0">{baht(total)}</span>
                            </div>
                            <div className="px-3.5 py-2.5">
                              <ul className="space-y-1.5">
                                {bill.rows.map((r, ri) => (
                                  <li key={r.id} className="flex items-center gap-2 text-sm">
                                    <span className="w-4 h-4 shrink-0 rounded-full bg-canvas text-muted text-[10px] font-semibold tabular-nums flex items-center justify-center">{ri + 1}</span>
                                    {isSale ? (
                                      <>
                                        <span className="text-muted text-xs w-8 shrink-0 text-right">{num(r.qty ?? 0)}×</span>
                                        <span className="flex-1 min-w-0 truncate text-ink">{r.item} <span className="text-muted text-xs">{r.size}</span></span>
                                        <span className="text-ink tabular-nums whitespace-nowrap">{baht(r.total ?? 0)}</span>
                                      </>
                                    ) : (
                                      <span className="flex-1 text-ink">ลูกค้า {num(r.customers ?? 0)} ราย · ไทย {num(r.thai ?? 0)} · ต่างชาติ {num(r.foreign_cnt ?? 0)}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                              <SplitBreakdown tenders={payments[bill.ref]} />
                      {photos.length > 0 && <div className="mt-2 pt-2 border-t border-line/60"><PhotoStrip photos={photos} size={52} /></div>}
                              <div className="flex items-center justify-end mt-3 pt-2.5 border-t border-line">
                                <button onClick={() => unapproveBill(bill)} disabled={pending}
                                  className="mr-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-muted text-sm font-medium hover:bg-canvas hover:text-ink disabled:opacity-50">
                                  {busy === bill.key ? <Clock className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} ยกเลิกการอนุมัติ
                                </button>
                                {bill.ref && (
                                  <a href={`/receipt/${encodeURIComponent(bill.ref)}`} target="_blank" rel="noopener"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-muted text-sm font-medium hover:bg-canvas hover:text-ink">
                                    <ReceiptIcon className="w-4 h-4" /> ใบเสร็จ
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RowEditor({ row, onSave, onCancel, pending, savedTenders }: { row: SubmissionRow; onSave: (payload: any) => void; onCancel: () => void; pending: boolean; savedTenders?: BillTender[] }) {
  const isSale = row.kind === "sale";
  const [f, setF] = useState<any>(isSale ? {
    sale_date: row.entry_date, sale_time: (row.sale_time || "").slice(0, 5), source: row.source || "CTW",
    receipt_no: row.receipt_no || "", item: row.item || "", barcode: row.barcode || "", size: row.size || "",
    qty: row.qty ?? 1, unit_price: row.unit_price ?? 0, discount: row.discount ?? 0,
    payment_channel: row.payment_channel || "", nation: row.nation || "",
    tenders: isSplit(row.payment_channel)
      ? ((savedTenders || []).length >= 2 ? (savedTenders || []).map((t) => ({ channel: t.channel, amount: String(Math.round(t.amount)) })) : [{ channel: "", amount: "" }, { channel: "", amount: "" }])
      : [],
  } : {
    cust_date: row.entry_date, customers: row.customers ?? 0, thai: row.thai ?? 0, foreign: row.foreign_cnt ?? 0, sell_amount: row.sell_amount ?? 0,
  });
  const s = (k: string, v: any) => setF((o: any) => ({ ...o, [k]: v }));
  const total = isSale ? Math.max(0, (Number(f.qty) || 0) * (Number(f.unit_price) || 0) - (Number(f.discount) || 0)) : 0;
  const split = isSale && isSplit(f.payment_channel);
  const tendersOk = splitOk(f.tenders ?? [], total);
  const pickPay = (v: string) => setF((o: any) => ({ ...o, payment_channel: v, tenders: isSplit(v) && (o.tenders?.length ?? 0) < 2 ? [{ channel: "", amount: "" }, { channel: "", amount: "" }] : (o.tenders ?? []) }));

  return (
    <div className="mt-2 rounded-xl border border-line bg-canvas/50 p-3">
      {isSale ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="col-span-2"><Fld label="สินค้า"><input className={inp} value={f.item} onChange={(e) => s("item", e.target.value)} /></Fld></div>
          <Fld label="ขนาด"><input className={inp} value={f.size} onChange={(e) => s("size", e.target.value)} /></Fld>
          <Fld label="บาร์โค้ด"><input className={inp} value={f.barcode} onChange={(e) => s("barcode", e.target.value)} /></Fld>
          <Fld label="จำนวน"><input className={inp} {...numAttrs(f.qty, (v) => s("qty", v))} /></Fld>
          <Fld label="ราคา/หน่วย"><input className={inp} {...numAttrs(f.unit_price, (v) => s("unit_price", v))} /></Fld>
          <Fld label="ส่วนลด"><input className={inp} {...numAttrs(f.discount, (v) => s("discount", v))} /></Fld>
          <Fld label="รวม"><input className={inp + " bg-canvas text-muted"} value={baht(total)} readOnly /></Fld>
          <Fld label="ช่องทางชำระ">
            <Select value={f.payment_channel} onValueChange={pickPay} options={payEditOptions(f.payment_channel)} placeholder="- เลือก -" />
          </Fld>
          <Fld label="สัญชาติ"><Select value={f.nation} onValueChange={(v) => s("nation", v)} options={NATION_OPTIONS} placeholder="- เลือก -" /></Fld>
          <Fld label="เลขใบเสร็จ"><input className={inp} value={f.receipt_no} onChange={(e) => s("receipt_no", e.target.value)} /></Fld>
          <Fld label="วันที่"><input type="date" className={inp} value={f.sale_date} onChange={(e) => s("sale_date", e.target.value)} /></Fld>
          <Fld label="เวลา"><input type="time" className={inp} value={f.sale_time} onChange={(e) => s("sale_time", e.target.value)} /></Fld>
          <Fld label="ช่องทางขาย"><Select value={f.source} onValueChange={(v) => s("source", v)} options={SOURCE_OPTIONS} /></Fld>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Fld label="วันที่"><input type="date" className={inp} value={f.cust_date} onChange={(e) => s("cust_date", e.target.value)} /></Fld>
          <Fld label="ลูกค้า (ราย)"><input className={inp} {...numAttrs(f.customers, (v) => s("customers", v))} /></Fld>
          <Fld label="ไทย"><input className={inp} {...numAttrs(f.thai, (v) => s("thai", v))} /></Fld>
          <Fld label="ต่างชาติ"><input className={inp} {...numAttrs(f.foreign, (v) => s("foreign", v))} /></Fld>
          <Fld label="ยอดขาย"><input className={inp} {...numAttrs(f.sell_amount, (v) => s("sell_amount", v))} /></Fld>
        </div>
      )}
      {split && (
        <div className="mt-3">
          <div className="text-xs text-muted mb-1">แยกยอดแต่ละช่องทาง (รวมต้องเท่ากับ {baht(total)})</div>
          <SplitTenders value={f.tenders ?? []} onChange={(t) => s("tenders", t)} net={total} />
        </div>
      )}
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg border border-line text-sm text-muted hover:bg-canvas">ยกเลิก</button>
        <button onClick={() => onSave(isSale
          ? { ...f, qty: Number(f.qty) || 0, unit_price: Number(f.unit_price) || 0, discount: Number(f.discount) || 0, tenders: split ? resolveTenders(f.tenders ?? [], total) : undefined }
          : { ...f, customers: Number(f.customers) || 0, thai: Number(f.thai) || 0, foreign: Number(f.foreign) || 0, sell_amount: Number(f.sell_amount) || 0 })}
          disabled={pending || (split && !tendersOk)} className="btn btn-brand">บันทึกการแก้ไข</button>
      </div>
    </div>
  );
}

// Admin: add a new item to an existing pending bill (product search → qty/price/discount).
function AddItemAdmin({ refId, pending, onDone }: { refId: string; pending: boolean; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [res, setRes] = useState<any[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const [picked, setPicked] = useState<any | null>(null);
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [disc, setDisc] = useState("");
  const [busy, setBusy] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fld = "border border-line rounded-lg px-2 py-1.5 text-sm bg-surface text-ink focus:outline-none focus:border-brand";
  const onText = (v: string) => {
    setText(v); setPicked(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const term = v.trim();
    if (!term) { setAcOpen(false); return; }
    searchTimer.current = setTimeout(() => {   // debounce: search once the user pauses
      fetch(`/api/products/search?q=${encodeURIComponent(term)}`, { headers: { accept: "application/json" } })
        .then((r) => (r.ok ? r.json() : [])).then((rows) => { setRes(Array.isArray(rows) ? rows : []); setAcOpen(true); }).catch(() => {});
    }, 250);
  };
  const pick = (p: any) => { setPicked(p); setText(`${p.scent} ${p.size}`); setPrice(String(Math.round(p.price || 0))); setAcOpen(false); };
  const add = () => {
    const item = (picked?.scent ?? text).trim();
    if (!item) return;
    setBusy(true);
    addBillItemsByAdmin(refId, [{ item, barcode: picked?.barcode, size: picked?.size, qty: Number(qty) || 1, unit_price: Number(price) || 0, discount: Number(disc) || 0 }])
      .then((r) => { setBusy(false); if (r?.ok) { setOpen(false); setText(""); setPicked(null); setQty("1"); setPrice(""); setDisc(""); onDone(); } else alert(r?.error ?? "เพิ่มไม่สำเร็จ"); })
      .catch(() => { setBusy(false); alert("เพิ่มไม่สำเร็จ ลองใหม่"); });
  };
  if (!open) return (
    <button onClick={() => setOpen(true)} disabled={pending}
      className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-brand/50 text-sm font-semibold text-brand-dark hover:bg-brand/5 disabled:opacity-50">
      <Plus className="w-4 h-4" /> เพิ่มสินค้าในบิลนี้
    </button>
  );
  return (
    <div className="mt-2 rounded-lg border border-line bg-canvas/40 p-2.5 space-y-2">
      <div className="relative">
        <input className={fld + " w-full"} value={text} onChange={(e) => onText(e.target.value)} onBlur={() => setTimeout(() => setAcOpen(false), 150)} placeholder="พิมพ์ค้นหากลิ่น หรือชื่อสินค้า" autoFocus />
        {acOpen && res.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-44 overflow-auto bg-surface border border-line rounded-lg shadow-lg text-sm">
            {res.map((p) => <button key={p.id} onMouseDown={() => pick(p)} className="block w-full text-left px-3 py-2 hover:bg-brand-soft"><b>{p.scent}</b> <b className="text-ink">{p.size}</b> <span className="text-muted">· {p.barcode}</span></button>)}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-[11px] text-muted">จำนวน<input inputMode="numeric" className={fld + " w-full text-center"} value={qty} onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ""))} onFocus={(e) => e.target.select()} /></label>
        <label className="text-[11px] text-muted">ราคา<input inputMode="numeric" className={fld + " w-full text-center"} value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))} onFocus={(e) => e.target.select()} /></label>
        <label className="text-[11px] text-muted">ส่วนลด<input inputMode="numeric" className={fld + " w-full text-center"} value={disc} onChange={(e) => setDisc(e.target.value.replace(/[^\d]/g, ""))} onFocus={(e) => e.target.select()} /></label>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setOpen(false); setText(""); setPicked(null); }} className="px-3 py-1.5 rounded-lg border border-line text-sm">ยกเลิก</button>
        <button onClick={add} disabled={busy || !(picked?.scent ?? text).trim()} className="btn btn-brand flex-1">{busy ? "กำลังเพิ่ม…" : "เพิ่มลงบิล"}</button>
      </div>
    </div>
  );
}
