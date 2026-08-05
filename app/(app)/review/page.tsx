import { ClipboardCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require-user";
import { pendingSubmissions } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { ReviewQueue } from "@/components/ReviewQueue";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  await requireAdmin();
  const rows = await pendingSubmissions();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1000px] mx-auto">
      <PageHeader icon={ClipboardCheck} title="ตรวจสอบยอดขาย"
        subtitle={rows.length ? `${rows.length} รายการรอตรวจสอบ — อนุมัติเพื่อส่งเข้าระบบ` : "ตรวจสอบข้อมูลที่พนักงานกรอกก่อนเข้าระบบ"} />
      <ReviewQueue rows={rows} />
    </div>
  );
}
