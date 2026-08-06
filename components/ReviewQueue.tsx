"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, CheckCheck, Clock, Pencil, CalendarDays, RotateCcw, ChevronDown, ShieldCheck } from "lucide-react";
import { approveMany, rejectMany, unapproveMany, updateSubmissionByAdmin } from "@/lib/actions/submissions";
import { baht, num } from "@/lib/format";
import { PhotoStrip } from "@/components/BillPhotos";
import { PAYMENTS, SPLIT2, isSplit, splitOk, resolveTenders } from "@/lib/payments";
import { SplitTenders } from "@/components/SplitTenders";
import { Select } from "@/components/ui/Select";
import type { SubmissionRow, BillAttachment, BillTender } from "@/lib/queries";

const SOURCE_OPTIONS = [{ value: "CTW", label: "Central World" }, { value: "EVENT_SCS", label: "Event" }];
const NATION_OPTIONS = [{ value: "Thai", label: "ไทย" }, { value: "Foreign", label: "ต่างชาติ" }];
const payEditOptions = (cur?: string) => {
  const base = PAYMENTS.map((p) => ({ value: p.v, label: p.label }));
  if (cur && cur !== SPLIT2 && !PAYMENTS.some((p) => p.v === cur)) base.unshift({ value: cur, label: cur });
  base.push({ value: SPLIT2, label: "จ่าย 2 ช่องทาง (แยกยอด)" });
  return base;
};

const chLabel = (v: string) => PAYMENTS.find((p) => p.v === v)?.label.replace(/\s*\(.*\)$/, "") || v;

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

type Bill = { key: string; ref: string; author: string; rows: SubmissionRow[] };
type Day = { date: string; bills: Bill[] };

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

export function ReviewQueue({ rows, approved = [], attachments = {}, payments = {} }:
  { rows: SubmissionRow[]; approved?: SubmissionRow[]; attachments?: Record<string, BillAttachment[]>; payments?: Record<string, BillTender[]> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);      // bill key being processed
  const [editId, setEditId] = useState<number | null>(null);
  const [showApproved, setShowApproved] = useState(false);
  const refresh = () => router.refresh();

  const days = groupDays(rows);
  const approvedDays = groupDays(approved);
  const approvedBillCount = approvedDays.reduce((s, d) => s + d.bills.length, 0);

  const approveBill = (bill: Bill) => start(async () => {
    setBusy(bill.key);
    try { await approveMany(bill.rows.map((r) => r.id)); refresh(); }
    catch (e: any) { alert(e?.message ?? "ไม่สำเร็จ"); } finally { setBusy(null); }
  });
  const rejectBill = (bill: Bill) => {
    const note = window.prompt("เหตุผลที่ตีกลับบิลนี้ (ไม่บังคับ):", "");
    if (note === null) return;
    start(async () => {
      setBusy(bill.key);
      try { await rejectMany(bill.rows.map((r) => r.id), note); refresh(); }
      catch (e: any) { alert(e?.message ?? "ไม่สำเร็จ"); } finally { setBusy(null); }
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
    <div className="space-y-8">
      {rows.length === 0 ? (
        <div className="card px-4 py-16 text-center text-muted"><CheckCheck className="w-8 h-8 mx-auto mb-2 text-green-500" /><div className="text-sm">ไม่มีรายการรอตรวจสอบ</div></div>
      ) : (
      <div className="space-y-6">
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
            <div className="space-y-3">
              {day.bills.map((bill, i) => {
                const first = bill.rows[0];
                const total = bill.rows.reduce((s, r) => s + (r.total ?? 0), 0);
                const photos = attachments[bill.ref] || [];
                const isSale = first.kind === "sale";
                return (
                  <div key={bill.key} className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden">
                    {/* bill header */}
                    <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-canvas/70 border-b border-line">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="inline-flex items-center justify-center h-6 min-w-[30px] px-1.5 rounded-md bg-brand text-white text-xs font-bold shrink-0">#{day.bills.length - i}</span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-ink truncate">{bill.author}</div>
                          <div className="text-[11px] text-muted flex flex-wrap gap-x-2">
                            {first.sale_time && <span>{first.sale_time.slice(0, 5)}</span>}
                            {first.payment_channel && <span>· {first.payment_channel}</span>}
                            {first.nation && <span>· {first.nation === "Foreign" ? "ต่างชาติ" : "ไทย"}</span>}
                            {isSale && <span>· {bill.rows.length} รายการ</span>}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-ink tabular-nums shrink-0">{baht(total)}</span>
                    </div>

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
                                className={`p-1 rounded shrink-0 ${editId === r.id ? "text-brand-dark bg-brand/10" : "text-muted/60 hover:text-brand-dark"}`} aria-label="แก้ไขรายการนี้">
                                <Pencil className="w-3.5 h-3.5" />
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

                      <SplitBreakdown tenders={payments[bill.ref]} />
                      {photos.length > 0 && <div className="mt-2 pt-2 border-t border-line/60"><PhotoStrip photos={photos} size={52} /></div>}

                      {/* per-bill actions */}
                      <div className="flex gap-2 justify-end mt-3 pt-2.5 border-t border-line">
                        <button onClick={() => rejectBill(bill)} disabled={pending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50">
                          <X className="w-4 h-4" /> ตีกลับ
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
      {approved.length > 0 && (
        <div>
          <button onClick={() => setShowApproved((v) => !v)}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line bg-canvas/60 text-ink hover:bg-canvas transition-colors">
            <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
            <span className="text-sm font-semibold">อนุมัติแล้ว (ยกเลิกได้)</span>
            <span className="text-xs text-muted">· {approvedBillCount} บิล · 7 วันล่าสุด</span>
            <ChevronDown className={`w-4 h-4 text-muted ml-auto transition-transform ${showApproved ? "rotate-180" : ""}`} />
          </button>

          {showApproved && (
            <div className="space-y-6 mt-3">
              {approvedDays.map((day) => {
                const dayTotal = day.bills.reduce((s, b) => s + b.rows.reduce((x, r) => x + (r.total ?? 0), 0), 0);
                return (
                  <div key={day.date}>
                    <div className="flex items-center gap-2 mb-2.5 text-ink min-w-0">
                      <CalendarDays className="w-4 h-4 text-brand-dark shrink-0" />
                      <span className="text-sm font-semibold">{fmtThaiDay(day.date)}</span>
                      <span className="text-xs text-muted whitespace-nowrap">· {day.bills.length} บิล · {baht(dayTotal)}</span>
                    </div>
                    <div className="space-y-3">
                      {day.bills.map((bill, i) => {
                        const first = bill.rows[0];
                        const total = bill.rows.reduce((s, r) => s + (r.total ?? 0), 0);
                        const photos = attachments[bill.ref] || [];
                        const isSale = first.kind === "sale";
                        return (
                          <div key={bill.key} className="rounded-xl border border-green-200 bg-surface shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-green-50/70 border-b border-green-100">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="inline-flex items-center justify-center h-6 min-w-[30px] px-1.5 rounded-md bg-green-600 text-white text-xs font-bold shrink-0">#{day.bills.length - i}</span>
                                <div className="min-w-0">
                                  <div className="text-[13px] font-medium text-ink truncate">{bill.author}</div>
                                  <div className="text-[11px] text-muted flex flex-wrap gap-x-2">
                                    {first.sale_time && <span>{first.sale_time.slice(0, 5)}</span>}
                                    {first.payment_channel && <span>· {first.payment_channel}</span>}
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
                              <div className="flex justify-end mt-3 pt-2.5 border-t border-line">
                                <button onClick={() => unapproveBill(bill)} disabled={pending}
                                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50">
                                  {busy === bill.key ? <Clock className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} ยกเลิกการอนุมัติ
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
          disabled={pending || (split && !tendersOk)} className="px-4 py-1.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">บันทึกการแก้ไข</button>
      </div>
    </div>
  );
}
