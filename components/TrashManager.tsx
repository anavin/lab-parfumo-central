"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Undo2, Trash2 } from "lucide-react";
import { restoreRequisition, purgeRequisition } from "@/lib/actions/requisitions";
import { fmtDate, num } from "@/lib/format";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Row = { id: number; po_number: string; version: string; order_date: string; branch_label: string; deleted_at: string; lines: number; qty: number };

export function TrashManager({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [toPurge, setToPurge] = useState<Row | null>(null);

  const restore = (r: Row) => start(async () => { await restoreRequisition(r.id); router.refresh(); });
  const doPurge = () => {
    const r = toPurge; setToPurge(null);
    if (r) start(async () => { await purgeRequisition(r.id); router.refresh(); });
  };

  if (rows.length === 0) return <div className="p-10 text-center text-muted text-sm">ถังขยะว่าง</div>;

  return (
    <>
    <table className="w-full text-sm">
      <thead className="bg-canvas"><tr className="th border-b border-line-soft">
        <th className="px-5 py-2.5">PO Number</th><th className="px-3 py-2.5">สาขา</th>
        <th className="px-3 py-2.5 text-right">จำนวน</th><th className="px-3 py-2.5">ลบเมื่อ</th><th className="px-5 py-2.5 text-right">จัดการ</th>
      </tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-b border-line-soft last:border-0 hover:bg-canvas transition-colors">
            <td className="px-5 py-3 font-semibold text-ink">{r.po_number}</td>
            <td className="px-3 py-3 text-ink-soft">{r.branch_label}</td>
            <td className="px-3 py-3 text-right text-muted tabular-nums">{num(r.qty)} ({r.lines})</td>
            <td className="px-3 py-3 text-muted text-xs">{fmtDate(r.deleted_at)}</td>
            <td className="px-5 py-3 text-right whitespace-nowrap">
              <button onClick={() => restore(r)} disabled={pending} className="inline-flex items-center gap-1 text-xs text-brand-dark hover:bg-brand-soft px-2.5 py-1.5 rounded-lg font-medium"><Undo2 className="w-3.5 h-3.5" /> กู้คืน</button>
              <button onClick={() => setToPurge(r)} disabled={pending} className="inline-flex items-center gap-1 text-xs text-danger hover:bg-danger-soft px-2.5 py-1.5 rounded-lg font-medium ml-1"><Trash2 className="w-3.5 h-3.5" /> ลบถาวร</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <ConfirmDialog open={!!toPurge} title="ลบถาวร?" danger confirmLabel="ลบถาวร" pending={pending}
      message={toPurge ? `${toPurge.po_number} — ลบถาวรแล้วกู้คืนไม่ได้อีก` : ""}
      onCancel={() => setToPurge(null)} onConfirm={doPurge} />
    </>
  );
}
