"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setRequisitionStatus, deleteRequisition } from "@/lib/actions/requisitions";
import { Select } from "@/components/ui/Select";

const STATUS_OPTS = ["draft", "issued", "delivered", "closed"].map((s) => ({ value: s, label: s }));

export function RequisitionActions({ id, status }: { id: number; status: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="no-print flex items-center gap-2">
      <Select value={status}
        onValueChange={(v) => start(async () => { await setRequisitionStatus(id, v); router.refresh(); })}
        options={STATUS_OPTS} className="min-w-[130px]" />
      <a href={`/requisitions/${id}/edit`} className="px-3.5 py-2 rounded-lg border border-line text-sm font-medium hover:bg-canvas">✎ แก้ไข</a>
      <button
        onClick={() => { if (confirm("ลบใบเบิกนี้?")) start(() => deleteRequisition(id)); }}
        className="px-3.5 py-2 rounded-lg border border-danger/30 text-danger text-sm font-medium hover:bg-danger-soft"
        disabled={pending}
      >🗑 ลบ</button>
    </div>
  );
}
