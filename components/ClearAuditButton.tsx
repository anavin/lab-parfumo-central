"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { clearAuditLog } from "@/lib/actions/audit";

export function ClearAuditButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const onClick = () => {
    if (!confirm("ล้างบันทึกกิจกรรมทั้งหมด?\nลบแล้วกู้คืนไม่ได้ (จะเหลือบันทึกการล้างครั้งนี้ไว้ 1 รายการ)")) return;
    start(async () => {
      try {
        const r = await clearAuditLog();
        if (r?.ok) { alert(`ล้างบันทึกแล้ว ${r.cleared ?? 0} รายการ`); router.refresh(); }
        else alert(r?.error ?? "ล้างไม่สำเร็จ");
      } catch { alert("ล้างไม่สำเร็จ ลองใหม่อีกครั้ง"); }
    });
  };
  return (
    <button onClick={onClick} disabled={pending}
      className="btn btn-danger-outline">
      <Trash2 className="w-4 h-4" /> {pending ? "กำลังล้าง…" : "ล้างบันทึกทั้งหมด"}
    </button>
  );
}
