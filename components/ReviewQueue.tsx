"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, CheckCheck, Clock, ShoppingBag, Users, Pencil } from "lucide-react";
import { approveSubmission, rejectSubmission, approveMany, updateSubmissionByAdmin } from "@/lib/actions/submissions";
import { baht, num, fmtDate } from "@/lib/format";
import { PhotoStrip } from "@/components/BillPhotos";
import { PAYMENTS } from "@/lib/payments";
import type { SubmissionRow, BillAttachment } from "@/lib/queries";

const inp = "w-full min-w-0 border border-line rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-brand";
const numAttrs = (v: any, on: (s: string) => void) => ({
  value: v ?? "", inputMode: "numeric" as const,
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => on(e.target.value.replace(/^0+(?=\d)/, "")),
});
const Fld = ({ label, children }: { label: string; children: React.ReactNode }) =>
  <label className="block min-w-0"><span className="text-[11px] text-muted mb-0.5 block">{label}</span>{children}</label>;

export function ReviewQueue({ rows, attachments = {} }: { rows: SubmissionRow[]; attachments?: Record<string, BillAttachment[]> }) {
  const shownRefs = new Set<string>();   // show each bill's photos once (on its first row)
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const refresh = () => router.refresh();

  // group by author, preserving the FIFO order the server sent
  const groups: { key: number; author: string; rows: SubmissionRow[] }[] = [];
  for (const r of rows) {
    let g = groups.find((x) => x.key === r.created_by);
    if (!g) { g = { key: r.created_by, author: r.author, rows: [] }; groups.push(g); }
    g.rows.push(r);
  }

  const approve = (id: number) => start(async () => { setBusy(id); try { await approveSubmission(id); refresh(); } catch (e: any) { alert(e?.message ?? "ไม่สำเร็จ"); } finally { setBusy(null); } });
  const reject = (id: number) => {
    const note = window.prompt("เหตุผลที่ตีกลับ (ไม่บังคับ):", "");
    if (note === null) return;
    start(async () => { setBusy(id); try { await rejectSubmission(id, note); refresh(); } catch (e: any) { alert(e?.message ?? "ไม่สำเร็จ"); } finally { setBusy(null); } });
  };
  const approveGroup = (ids: number[]) => { if (!confirm(`อนุมัติทั้งหมด ${ids.length} รายการของพนักงานคนนี้?`)) return; start(async () => { try { await approveMany(ids); refresh(); } catch (e: any) { alert(e?.message ?? "ไม่สำเร็จ"); } }); };

  if (rows.length === 0) {
    return <div className="card px-4 py-16 text-center text-muted"><CheckCheck className="w-8 h-8 mx-auto mb-2 text-green-500" /><div className="text-sm">ไม่มีรายการรอตรวจสอบ</div></div>;
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.key} className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-canvas/60">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-brand/20 text-brand-dark flex items-center justify-center text-xs font-bold uppercase">{g.author.charAt(0)}</span>
              <span className="text-sm font-semibold text-ink">{g.author}</span>
              <span className="text-xs text-muted">· {g.rows.length} รายการ</span>
            </div>
            <button onClick={() => approveGroup(g.rows.map((r) => r.id))} disabled={pending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50">
              <CheckCheck className="w-3.5 h-3.5" /> อนุมัติทั้งหมด
            </button>
          </div>
          <ul className="divide-y divide-line">
            {g.rows.map((r) => {
              const ref = r.receipt_no || "";
              const ph = attachments[ref];
              const showPh = ph?.length && !shownRefs.has(ref);
              if (showPh) shownRefs.add(ref);
              return (
              <li key={r.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-muted">{r.kind === "sale" ? <ShoppingBag className="w-4 h-4" /> : <Users className="w-4 h-4" />}</span>
                  <div className="flex-1 min-w-0">
                    {r.kind === "sale" ? (
                      <>
                        <div className="text-sm font-medium text-ink truncate">{r.item} <span className="text-muted font-normal">{r.size}</span></div>
                        <div className="text-xs text-muted mt-0.5 flex flex-wrap gap-x-3">
                          <span>{fmtDate(r.entry_date)}{r.sale_time ? ` ${r.sale_time.slice(0, 5)}` : ""}</span>
                          <span>{num(r.qty ?? 0)} ชิ้น × {baht(r.unit_price ?? 0)}{r.discount ? ` − ${baht(r.discount)}` : ""}</span>
                          <span className="font-medium text-ink">{baht(r.total ?? 0)}</span>
                          {r.payment_channel && <span>{r.payment_channel}</span>}
                          {r.nation && <span>{r.nation === "Foreign" ? "ต่างชาติ" : "ไทย"}</span>}
                          {r.receipt_no && <span>#{r.receipt_no}</span>}
                          <span>{r.source}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-medium text-ink">ลูกค้า {num(r.customers ?? 0)} ราย</div>
                        <div className="text-xs text-muted mt-0.5 flex flex-wrap gap-x-3">
                          <span>{fmtDate(r.entry_date)}</span>
                          <span>ไทย {num(r.thai ?? 0)} · ต่างชาติ {num(r.foreign_cnt ?? 0)}</span>
                          {r.sell_amount ? <span>ยอด {baht(r.sell_amount)}</span> : null}
                        </div>
                      </>
                    )}
                    {showPh && <PhotoStrip photos={ph!} size={52} />}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setEditId(editId === r.id ? null : r.id)} disabled={pending}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-50 ${editId === r.id ? "border-brand bg-brand/10 text-brand-dark" : "border-line text-muted hover:bg-canvas"}`}>
                      <Pencil className="w-3.5 h-3.5" /> แก้ไข
                    </button>
                    <button onClick={() => approve(r.id)} disabled={pending}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                      {busy === r.id ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} อนุมัติ
                    </button>
                    <button onClick={() => reject(r.id)} disabled={pending}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-line text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50">
                      <X className="w-3.5 h-3.5" /> ตีกลับ
                    </button>
                  </div>
                </div>
                {editId === r.id && (
                  <RowEditor row={r} pending={pending}
                    onCancel={() => setEditId(null)}
                    onSave={(payload) => start(async () => {
                      try { await updateSubmissionByAdmin(r.id, payload); setEditId(null); refresh(); }
                      catch (e: any) { alert(e?.message ?? "บันทึกไม่สำเร็จ"); }
                    })} />
                )}
              </li>
            );})}
          </ul>
        </div>
      ))}
    </div>
  );
}

function RowEditor({ row, onSave, onCancel, pending }: { row: SubmissionRow; onSave: (payload: any) => void; onCancel: () => void; pending: boolean }) {
  const isSale = row.kind === "sale";
  const [f, setF] = useState<any>(isSale ? {
    sale_date: row.entry_date, sale_time: (row.sale_time || "").slice(0, 5), source: row.source || "CTW",
    receipt_no: row.receipt_no || "", item: row.item || "", barcode: row.barcode || "", size: row.size || "",
    qty: row.qty ?? 1, unit_price: row.unit_price ?? 0, discount: row.discount ?? 0,
    payment_channel: row.payment_channel || "", nation: row.nation || "",
  } : {
    cust_date: row.entry_date, customers: row.customers ?? 0, thai: row.thai ?? 0, foreign: row.foreign_cnt ?? 0, sell_amount: row.sell_amount ?? 0,
  });
  const s = (k: string, v: any) => setF((o: any) => ({ ...o, [k]: v }));
  const payKnown = PAYMENTS.some((p) => p.v === f.payment_channel);
  const total = isSale ? Math.max(0, (Number(f.qty) || 0) * (Number(f.unit_price) || 0) - (Number(f.discount) || 0)) : 0;

  return (
    <div className="mt-3 ml-7 rounded-xl border border-line bg-canvas/50 p-3">
      {isSale ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="col-span-2"><Fld label="สินค้า"><input className={inp} value={f.item} onChange={(e) => s("item", e.target.value)} /></Fld></div>
            <Fld label="ขนาด"><input className={inp} value={f.size} onChange={(e) => s("size", e.target.value)} /></Fld>
            <Fld label="บาร์โค้ด"><input className={inp} value={f.barcode} onChange={(e) => s("barcode", e.target.value)} /></Fld>
            <Fld label="จำนวน"><input className={inp} {...numAttrs(f.qty, (v) => s("qty", v))} /></Fld>
            <Fld label="ราคา/หน่วย"><input className={inp} {...numAttrs(f.unit_price, (v) => s("unit_price", v))} /></Fld>
            <Fld label="ส่วนลด"><input className={inp} {...numAttrs(f.discount, (v) => s("discount", v))} /></Fld>
            <Fld label="รวม"><input className={inp + " bg-canvas text-muted"} value={baht(total)} readOnly /></Fld>
            <Fld label="ช่องทางชำระ">
              <select className={inp} value={f.payment_channel} onChange={(e) => s("payment_channel", e.target.value)}>
                <option value="">- เลือก -</option>
                {!payKnown && f.payment_channel && <option value={f.payment_channel}>{f.payment_channel}</option>}
                {PAYMENTS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
              </select>
            </Fld>
            <Fld label="สัญชาติ"><select className={inp} value={f.nation} onChange={(e) => s("nation", e.target.value)}><option value="">- เลือก -</option><option value="Thai">ไทย</option><option value="Foreign">ต่างชาติ</option></select></Fld>
            <Fld label="เลขใบเสร็จ"><input className={inp} value={f.receipt_no} onChange={(e) => s("receipt_no", e.target.value)} /></Fld>
            <Fld label="วันที่"><input type="date" className={inp} value={f.sale_date} onChange={(e) => s("sale_date", e.target.value)} /></Fld>
            <Fld label="เวลา"><input type="time" className={inp} value={f.sale_time} onChange={(e) => s("sale_time", e.target.value)} /></Fld>
            <Fld label="ช่องทางขาย"><select className={inp} value={f.source} onChange={(e) => s("source", e.target.value)}><option value="CTW">Central World</option><option value="EVENT_SCS">Event</option></select></Fld>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Fld label="วันที่"><input type="date" className={inp} value={f.cust_date} onChange={(e) => s("cust_date", e.target.value)} /></Fld>
          <Fld label="ลูกค้า (ราย)"><input className={inp} {...numAttrs(f.customers, (v) => s("customers", v))} /></Fld>
          <Fld label="ไทย"><input className={inp} {...numAttrs(f.thai, (v) => s("thai", v))} /></Fld>
          <Fld label="ต่างชาติ"><input className={inp} {...numAttrs(f.foreign, (v) => s("foreign", v))} /></Fld>
          <Fld label="ยอดขาย"><input className={inp} {...numAttrs(f.sell_amount, (v) => s("sell_amount", v))} /></Fld>
        </div>
      )}
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg border border-line text-sm text-muted hover:bg-canvas">ยกเลิก</button>
        <button onClick={() => onSave(isSale
          ? { ...f, qty: Number(f.qty) || 0, unit_price: Number(f.unit_price) || 0, discount: Number(f.discount) || 0 }
          : { ...f, customers: Number(f.customers) || 0, thai: Number(f.thai) || 0, foreign: Number(f.foreign) || 0, sell_amount: Number(f.sell_amount) || 0 })}
          disabled={pending} className="px-4 py-1.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">บันทึกการแก้ไข</button>
      </div>
    </div>
  );
}
