"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, CheckCheck, Clock, ShoppingBag, Users } from "lucide-react";
import { approveSubmission, rejectSubmission, approveMany } from "@/lib/actions/submissions";
import { baht, num, fmtDate } from "@/lib/format";
import type { SubmissionRow } from "@/lib/queries";

export function ReviewQueue({ rows }: { rows: SubmissionRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<number | null>(null);
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
            {g.rows.map((r) => (
              <li key={r.id} className="px-4 py-3 flex items-start gap-3">
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
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => approve(r.id)} disabled={pending}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                    {busy === r.id ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} อนุมัติ
                  </button>
                  <button onClick={() => reject(r.id)} disabled={pending}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-line text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50">
                    <X className="w-3.5 h-3.5" /> ตีกลับ
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
