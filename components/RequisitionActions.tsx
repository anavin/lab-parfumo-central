"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { setRequisitionStatus, deleteRequisition, approveRequisition, unapproveRequisition } from "@/lib/actions/requisitions";
import { Select } from "@/components/ui/Select";

// Thai status labels for the admin override editor (full lifecycle)
const STATUS_OPTS = [
  { value: "draft", label: "ร่าง" },
  { value: "issued", label: "ออกใบเบิก" },
  { value: "delivered", label: "ส่งแล้ว" },
  { value: "approved", label: "อนุมัติแล้ว (รอสาขารับ)" },
  { value: "received", label: "รับของแล้ว" },
  { value: "closed", label: "ปิดแล้ว" },
];

export function RequisitionActions({ id, status }: { id: number; status: string }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const run = (fn: () => Promise<any>) => start(async () => { const r = await fn(); if (r && !r.ok) alert(r.error ?? "ทำรายการไม่สำเร็จ"); else if (r?.warn) alert(r.warn); router.refresh(); });
  const preApprove = ["draft", "issued"].includes(status);

  const changeStatus = (v: string) => {
    if (v === status) { setEditing(false); return; }
    // moving in/out of "received" changes branch stock — confirm the override
    const crossesStock = v === "received" || status === "received";
    if (crossesStock && !confirm(`เปลี่ยนสถานะเป็น "${STATUS_OPTS.find((o) => o.value === v)?.label ?? v}"?\n(มีผลต่อสต๊อกสาขา)`)) return;
    setEditing(false);
    run(() => setRequisitionStatus(id, v));
  };

  return (
    <div className="no-print flex items-center gap-2">
      {/* workflow indicator + primary action */}
      {status === "received" ? (
        <span className="px-3 py-1.5 rounded-lg bg-success-soft text-success text-sm font-semibold">✓ รับของแล้ว</span>
      ) : status === "delivered" ? (
        <span className="px-3 py-1.5 rounded-lg bg-brand-soft text-brand-dark text-sm font-semibold">ส่งแล้ว · รอสาขารับของ</span>
      ) : status === "approved" ? (
        <>
          <span className="px-3 py-1.5 rounded-lg bg-brand-soft text-brand-dark text-sm font-semibold">อนุมัติแล้ว · รอสาขารับของ</span>
          <button onClick={() => run(() => unapproveRequisition(id))} disabled={pending}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-line text-sm text-muted hover:bg-canvas disabled:opacity-50"><RotateCcw className="w-3.5 h-3.5" /> ยกเลิกอนุมัติ</button>
        </>
      ) : preApprove ? (
        <button onClick={() => run(() => approveRequisition(id))} disabled={pending}
          className="btn btn-brand"><Check className="w-4 h-4" /> อนุมัติ</button>
      ) : null}

      {/* admin: edit status override — available in every state */}
      {editing ? (
        <div className="flex items-center gap-1">
          <Select value={status} onValueChange={changeStatus} options={STATUS_OPTS} className="min-w-[190px]" />
          <button onClick={() => setEditing(false)} className="p-2 rounded-lg border border-line text-muted hover:bg-canvas" title="ยกเลิก"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} disabled={pending}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-line text-sm font-medium text-muted hover:bg-canvas disabled:opacity-50">
          <SlidersHorizontal className="w-4 h-4" /> แก้ไขสถานะ
        </button>
      )}

      {status !== "received" && (
        <a href={`/requisitions/${id}/edit`} className="px-3.5 py-2 rounded-lg border border-line text-sm font-medium hover:bg-canvas">✎ แก้ไข</a>
      )}
      <button onClick={() => { if (confirm("ลบใบเบิกนี้?")) start(() => deleteRequisition(id)); }} disabled={pending}
        className="btn btn-danger-outline">🗑 ลบ</button>
    </div>
  );
}
