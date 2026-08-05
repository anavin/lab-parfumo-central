"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setRequisitionStatus, deleteRequisition } from "@/lib/actions/requisitions";

export function RequisitionActions({ id, status }: { id: number; status: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="no-print flex items-center gap-2">
      <select
        defaultValue={status}
        onChange={(e) => start(async () => { await setRequisitionStatus(id, e.target.value); router.refresh(); })}
        className="border border-black/10 rounded-lg px-2.5 py-2 text-sm bg-white"
        disabled={pending}
      >
        <option value="draft">draft</option>
        <option value="issued">issued</option>
        <option value="delivered">delivered</option>
        <option value="closed">closed</option>
      </select>
      <a href={`/requisitions/${id}/edit`} className="px-3.5 py-2 rounded-lg border border-black/10 text-sm font-medium hover:bg-black/5">✎ แก้ไข</a>
      <button
        onClick={() => { if (confirm("ลบใบเบิกนี้?")) start(() => deleteRequisition(id)); }}
        className="px-3.5 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50"
        disabled={pending}
      >🗑 ลบ</button>
    </div>
  );
}
