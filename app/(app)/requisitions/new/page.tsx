import { PageHeader } from "@/components/ui";
import { RequisitionForm } from "@/components/RequisitionForm";
import { listBranches } from "@/lib/actions/lookups";

export const dynamic = "force-dynamic";

export default async function NewRequisition() {
  const branches = await listBranches();
  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      <PageHeader title="สร้างใบเบิกใหม่" subtitle="ระบบจะออกเลข PO อัตโนมัติ" />
      <RequisitionForm branches={branches} mode="new" />
    </div>
  );
}
