"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Printer, Undo2, Loader2, CheckCircle2 } from "lucide-react";
import { returnBranchStock } from "@/lib/actions/stock";

const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const thaiToday = () => new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit", timeZone: "Asia/Bangkok" });

/** Close a branch's shelf: print the received/sold/remaining report for staff, then return the
 *  remaining stock to the central warehouse (zeroes the branch). Admin only. */
export function BranchStockClose({ branch, branchLabel, remainingUnits, skus }: { branch: string; branchLabel: string; remainingUnits: number; skus: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [done, setDone] = useState<{ items: number; units: number } | null>(null);

  const doReturn = () => {
    if (!confirm(`คืนสต๊อกคงเหลือของ ${branchLabel} (${remainingUnits} ชิ้น) กลับเข้าคลังหลัก?\n\nสต๊อกสาขานี้จะกลายเป็น 0 · แนะนำพิมพ์รายงานเก็บไว้ก่อน · ทำแล้วย้อนได้ที่ประวัติปรับสต๊อก`)) return;
    start(async () => {
      const r = await returnBranchStock(branch, thaiToday());
      if (r.ok) { setDone({ items: r.items ?? 0, units: r.units ?? 0 }); router.refresh(); }
      else alert(r.error ?? "คืนสต๊อกไม่สำเร็จ");
    });
  };

  return (
    <div className="mb-6 rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-ink">รายงาน & คืนสต๊อก — {branchLabel}</div>
          <div className="text-[12px] text-muted mt-0.5">คงเหลือ {remainingUnits} ชิ้น · {skus} รายการ · พิมพ์รายงานให้พนักงานเช็ค แล้วคืนของกลับคลังหลัก</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a href={`/api/stock/${encodeURIComponent(branch)}/pdf`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gold text-white text-sm font-semibold hover:bg-gold-dark">
            <Download className="w-4 h-4" /> ดาวน์โหลดรายงาน PDF
          </a>
          <a href={`/print/stock/${encodeURIComponent(branch)}`} target="_blank" rel="noopener"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-sm text-muted hover:bg-canvas">
            <Printer className="w-4 h-4" /> พิมพ์
          </a>
          {remainingUnits > 0 && !done && (
            <button onClick={doReturn} disabled={pending}
              className="btn btn-danger-outline">
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />} คืนสต๊อกเข้าคลัง
            </button>
          )}
        </div>
      </div>
      {done && (
        <div className="alert-success items-center mt-3 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> คืนสต๊อกเข้าคลังแล้ว — {done.items} รายการ · {done.units} ชิ้น · สต๊อก {branchLabel} เป็น 0
        </div>
      )}
    </div>
  );
}
