"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Undo2, Trash2 } from "lucide-react";
import { restoreRequisition, purgeRequisition } from "@/lib/actions/requisitions";
import { fmtDate, num } from "@/lib/format";

type Row = { id: number; po_number: string; version: string; order_date: string; branch_label: string; deleted_at: string; lines: number; qty: number };

export function TrashManager({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const restore = (r: Row) => start(async () => { await restoreRequisition(r.id); router.refresh(); });
  const purge = (r: Row) => {
    if (!confirm(`ลบถาวร ${r.po_number}? กู้คืนไม่ได้อีก`)) return;
    start(async () => { await purgeRequisition(r.id); router.refresh(); });
  };

  if (rows.length === 0) return <div className="p-10 text-center text-muted text-sm">ถังขยะว่าง</div>;

  return (
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
              <button onClick={() => purge(r)} disabled={pending} className="inline-flex items-center gap-1 text-xs text-danger hover:bg-danger-soft px-2.5 py-1.5 rounded-lg font-medium ml-1"><Trash2 className="w-3.5 h-3.5" /> ลบถาวร</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
