import { Trash2, FileText, ClipboardList } from "lucide-react";
import { PageHeader, Card } from "@/components/ui";
import { requirePermission } from "@/lib/auth/require-user";
import { trashedRequisitions, trashedSubmissions } from "@/lib/queries";
import { TrashManager } from "@/components/TrashManager";
import { TrashedBills } from "@/components/TrashedBills";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  await requirePermission("trash");
  const rows = await trashedRequisitions();
  const bills = await trashedSubmissions();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-8">
      <PageHeader icon={Trash2} title="ถังขยะ" subtitle="รายการที่ถูกลบ · กู้คืนหรือลบถาวรได้" />

      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink mb-2.5">
          <FileText className="w-4 h-4 text-brand-dark" /> บิลขายที่ถูกลบ <span className="text-xs text-muted font-normal">· {bills.length} บิล</span>
        </h2>
        <Card bodyClass="p-0 overflow-x-auto">
          <TrashedBills rows={bills} />
        </Card>
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink mb-2.5">
          <ClipboardList className="w-4 h-4 text-brand-dark" /> ใบเบิกที่ถูกลบ <span className="text-xs text-muted font-normal">· {rows.length} รายการ</span>
        </h2>
        <Card bodyClass="p-0 overflow-x-auto">
          <TrashManager rows={rows} />
        </Card>
      </section>
    </div>
  );
}
