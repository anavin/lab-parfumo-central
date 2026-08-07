import { ScrollText } from "lucide-react";
import { PageHeader, Card } from "@/components/ui";
import { requirePermission } from "@/lib/auth/require-user";
import { auditLog } from "@/lib/queries";
import { AuditTable } from "@/components/AuditTable";
import { ClearAuditButton } from "@/components/ClearAuditButton";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requirePermission("audit");
  const rows = await auditLog({}, 300);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader icon={ScrollText} title="บันทึกกิจกรรม (Audit Log)" subtitle={`${rows.length} รายการล่าสุด · ใครทำอะไรเมื่อไหร่`}
        action={<ClearAuditButton />} />
      <Card bodyClass="p-0">
        <AuditTable rows={rows} />
      </Card>
    </div>
  );
}
