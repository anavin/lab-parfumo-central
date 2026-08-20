import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { requirePermission } from "@/lib/auth/require-user";
import { auditLog } from "@/lib/queries";
import { AuditTimeline } from "@/components/AuditTimeline";
import { ClearAuditButton } from "@/components/ClearAuditButton";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requirePermission("audit");
  const rows = await auditLog({}, 300);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
      <PageHeader icon={ScrollText} title="บันทึกกิจกรรม (Audit Log)" subtitle="ใครทำอะไรเมื่อไหร่ — ไทม์ไลน์กิจกรรมของทั้งระบบ"
        action={<ClearAuditButton />} />
      <AuditTimeline rows={rows} />
    </div>
  );
}
