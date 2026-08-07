"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Undo2, Trash2 } from "lucide-react";
import { restoreSubmission, purgeSubmission } from "@/lib/actions/submissions";
import { baht, num } from "@/lib/format";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { SubmissionRow } from "@/lib/queries";

type TRow = SubmissionRow & { deleted_at: string };
type TBill = { key: string; author: string; date: string; deleted_at: string; kind: string; rows: TRow[] };

// group trashed rows into bills (shared receipt/ref), newest-deleted first
function groupBills(rows: TRow[]): TBill[] {
  const bills: TBill[] = [];
  for (const r of rows) {
    const key = r.receipt_no || `id:${r.id}`;
    let b = bills.find((x) => x.key === key);
    if (!b) { b = { key, author: r.author, date: r.entry_date, deleted_at: r.deleted_at, kind: r.kind, rows: [] }; bills.push(b); }
    b.rows.push(r);
  }
  return bills;
}

const fmtWhen = (d: string) => new Date(d).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
const fmtDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });

export function TrashedBills({ rows }: { rows: TRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [toPurge, setToPurge] = useState<TBill | null>(null);

  const bills = groupBills(rows);

  const restore = (b: TBill) => start(async () => {
    for (const r of b.rows) { const res = await restoreSubmission(r.id); if (!res?.ok) { alert(res?.error ?? "กู้คืนไม่สำเร็จ"); break; } }
    router.refresh();
  });
  const doPurge = () => {
    const b = toPurge; setToPurge(null);
    if (!b) return;
    start(async () => {
      for (const r of b.rows) { const res = await purgeSubmission(r.id); if (!res?.ok) { alert(res?.error ?? "ลบไม่สำเร็จ"); break; } }
      router.refresh();
    });
  };

  if (bills.length === 0) return <div className="p-10 text-center text-muted text-sm">ไม่มีบิลในถังขยะ</div>;

  return (
    <>
    <table className="w-full text-sm">
      <thead className="bg-canvas"><tr className="th border-b border-line-soft">
        <th className="px-5 py-2.5">พนักงานขาย</th><th className="px-3 py-2.5">วันที่บิล</th>
        <th className="px-3 py-2.5">รายการ</th><th className="px-3 py-2.5 text-right">ยอด</th>
        <th className="px-3 py-2.5">ลบเมื่อ</th><th className="px-5 py-2.5 text-right">จัดการ</th>
      </tr></thead>
      <tbody>
        {bills.map((b) => {
          const isSale = b.kind === "sale";
          const total = b.rows.reduce((s, r) => s + (r.total ?? 0), 0);
          const summary = isSale
            ? `${b.rows.length} รายการ`
            : `ลูกค้า ${num(b.rows[0]?.customers ?? 0)} ราย`;
          return (
            <tr key={b.key} className="border-b border-line-soft last:border-0 hover:bg-canvas transition-colors align-top">
              <td className="px-5 py-3 font-semibold text-ink">{b.author}</td>
              <td className="px-3 py-3 text-ink-soft whitespace-nowrap">{fmtDay(b.date)}</td>
              <td className="px-3 py-3 text-muted">
                {summary}
                {isSale && (
                  <div className="mt-0.5 text-xs text-muted-soft truncate max-w-[280px]">
                    {b.rows.map((r) => r.item).filter(Boolean).join(", ")}
                  </div>
                )}
              </td>
              <td className="px-3 py-3 text-right text-ink tabular-nums whitespace-nowrap">{baht(total)}</td>
              <td className="px-3 py-3 text-muted text-xs whitespace-nowrap">{fmtWhen(b.deleted_at)}</td>
              <td className="px-5 py-3 text-right whitespace-nowrap">
                <button onClick={() => restore(b)} disabled={pending} className="inline-flex items-center gap-1 text-xs text-brand-dark hover:bg-brand-soft px-2.5 py-1.5 rounded-lg font-medium"><Undo2 className="w-3.5 h-3.5" /> กู้คืน</button>
                <button onClick={() => setToPurge(b)} disabled={pending} className="inline-flex items-center gap-1 text-xs text-danger hover:bg-danger-soft px-2.5 py-1.5 rounded-lg font-medium ml-1"><Trash2 className="w-3.5 h-3.5" /> ลบถาวร</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
    <ConfirmDialog open={!!toPurge} title="ลบบิลถาวร?" danger confirmLabel="ลบถาวร" pending={pending}
      message={toPurge ? `บิลของ ${toPurge.author} (${baht(toPurge.rows.reduce((s, r) => s + (r.total ?? 0), 0))}) — ลบถาวรแล้วกู้คืนไม่ได้อีก` : ""}
      onCancel={() => setToPurge(null)} onConfirm={doPurge} />
    </>
  );
}
