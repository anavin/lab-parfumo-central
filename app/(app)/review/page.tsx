import { ClipboardCheck } from "lucide-react";
import { requirePermission } from "@/lib/auth/require-user";
import { pendingSubmissions, recentlyApprovedSubmissions, attachmentsForRefs, paymentsForRefs } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { ReviewQueue } from "@/components/ReviewQueue";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  await requirePermission("review");
  const rows = await pendingSubmissions();
  const approved = await recentlyApprovedSubmissions();
  const refs = [...rows, ...approved].map((r) => r.receipt_no).filter(Boolean) as string[];
  const attachments = await attachmentsForRefs(refs);
  const payments = await paymentsForRefs(refs);
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader icon={ClipboardCheck} title="ตรวจสอบยอดขาย"
        subtitle={rows.length ? `${rows.length} รายการรอตรวจสอบ — อนุมัติเพื่อส่งเข้าระบบ` : "ตรวจสอบข้อมูลที่พนักงานกรอกก่อนเข้าระบบ"} />
      <ReviewQueue rows={rows} approved={approved} attachments={attachments} payments={payments} />
    </div>
  );
}
