"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw } from "lucide-react";
import { setRequisitionStatus, deleteRequisition, approveRequisition, unapproveRequisition } from "@/lib/actions/requisitions";
import { Select } from "@/components/ui/Select";

const STATUS_OPTS = ["draft", "issued", "approved", "received", "closed"].map((s) => ({ value: s, label: s }));

export function RequisitionActions({ id, status }: { id: number; status: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<any>) => start(async () => { const r = await fn(); if (r && !r.ok) alert(r.error ?? "ทำรายการไม่สำเร็จ"); router.refresh(); });
  const preApprove = ["draft", "issued", "delivered"].includes(status);

  return (
    <div className="no-print flex items-center gap-2">
      {status === "received" ? (
        <span className="px-3 py-1.5 rounded-lg bg-success-soft text-success text-sm font-semibold">✓ รับของแล้ว</span>
      ) : status === "approved" ? (
        <>
          <span className="px-3 py-1.5 rounded-lg bg-brand-soft text-brand-dark text-sm font-semibold">อนุมัติแล้ว · รอสาขารับของ</span>
          <button onClick={() => run(() => unapproveRequisition(id))} disabled={pending}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-line text-sm text-muted hover:bg-canvas disabled:opacity-50"><RotateCcw className="w-3.5 h-3.5" /> ยกเลิกอนุมัติ</button>
        </>
      ) : (
        <>
          {preApprove && (
            <button onClick={() => run(() => approveRequisition(id))} disabled={pending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50"><Check className="w-4 h-4" /> อนุมัติ</button>
          )}
          <Select value={status} onValueChange={(v) => run(() => setRequisitionStatus(id, v))} options={STATUS_OPTS} className="min-w-[120px]" />
        </>
      )}
      {status !== "received" && (
        <a href={`/requisitions/${id}/edit`} className="px-3.5 py-2 rounded-lg border border-line text-sm font-medium hover:bg-canvas">✎ แก้ไข</a>
      )}
      <button onClick={() => { if (confirm("ลบใบเบิกนี้?")) start(() => deleteRequisition(id)); }} disabled={pending}
        className="px-3.5 py-2 rounded-lg border border-danger/30 text-danger text-sm font-medium hover:bg-danger-soft disabled:opacity-50">🗑 ลบ</button>
    </div>
  );
}
