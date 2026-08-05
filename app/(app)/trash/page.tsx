import { Trash2 } from "lucide-react";
import { PageHeader, Card } from "@/components/ui";
import { requirePermission } from "@/lib/auth/require-user";
import { trashedRequisitions } from "@/lib/queries";
import { TrashManager } from "@/components/TrashManager";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  await requirePermission("trash");
  const rows = await trashedRequisitions();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[900px] mx-auto">
      <PageHeader icon={Trash2} title="ถังขยะ" subtitle={`ใบเบิกที่ถูกลบ ${rows.length} รายการ · กู้คืนหรือลบถาวรได้`} />
      <Card bodyClass="p-0">
        <TrashManager rows={rows} />
      </Card>
    </div>
  );
}
