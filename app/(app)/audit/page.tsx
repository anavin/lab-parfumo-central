import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { requirePermission } from "@/lib/auth/require-user";
import { auditLog } from "@/lib/queries";
import { AuditTimeline } from "@/components/AuditTimeline";
import { ClearAuditButton } from "@/components/ClearAuditButton";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requirePermission("audit");
  const LIMIT = 300;
  const rows = await auditLog({}, LIMIT);
  // don't hide the cap silently — tell the reviewer older records aren't shown
  const subtitle = rows.length >= LIMIT
    ? `ใครทำอะไรเมื่อไหร่ · แสดง ${LIMIT} รายการล่าสุด (เก่ากว่านี้ไม่แสดง)`
    : "ใครทำอะไรเมื่อไหร่ — ไทม์ไลน์กิจกรรมของทั้งระบบ";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader icon={ScrollText} title="บันทึกกิจกรรม (Audit Log)" subtitle={subtitle}
        action={<ClearAuditButton />} />
      <AuditTimeline rows={rows} />
    </div>
  );
}
