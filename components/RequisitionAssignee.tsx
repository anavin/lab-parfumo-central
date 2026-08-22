"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, Loader2 } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { assignRequisition } from "@/lib/actions/requisitions";
import { branchName, isBranch } from "@/lib/branches";

type Receiver = { id: number; full_name: string; role: string; branch: string | null };

/** Admin picks which salesperson receives this requisition. Once set, only that
 *  person sees it in their /my receiving inbox. Empty = no one sees it yet. */
export function RequisitionAssignee({ id, current, receivers }: {
  id: number; current: number | null; receivers: Receiver[];
}) {
  const router = useRouter();
  const NONE = "";
  const [val, setVal] = useState(current ? String(current) : NONE);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const opts = [
    { value: NONE, label: "— ยังไม่มอบหมาย —" },
    ...receivers.map((r) => ({ value: String(r.id), label: isBranch(r.branch) ? `${r.full_name} · ${branchName(r.branch!)}` : r.full_name })),
  ];

  const onPick = (v: string) => {
    const prev = val;
    setVal(v); setErr(null);
    start(async () => {
      const r = await assignRequisition(id, v === NONE ? null : Number(v));
      if (r.ok) router.refresh();
      else { setErr(r.error ?? "มอบหมายไม่สำเร็จ"); setVal(prev); }
    });
  };

  return (
    <div className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-1 text-sm text-muted whitespace-nowrap"><UserCheck className="w-4 h-4" /> ผู้รับของ:</span>
      <div className="w-[200px]"><Select value={val} onValueChange={onPick} options={opts} placeholder="— ยังไม่มอบหมาย —" /></div>
      {pending && <Loader2 className="w-4 h-4 animate-spin text-muted shrink-0" />}
      {err && <span className="text-xs text-danger">{err}</span>}
    </div>
  );
}
