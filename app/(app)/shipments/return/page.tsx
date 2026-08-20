import { PageHeader } from "@/components/ui";
import { ReturnForm } from "@/components/ReturnForm";
import { listPOs } from "@/lib/actions/lookups";

export const dynamic = "force-dynamic";

export default async function ReturnPage() {
  const pos = await listPOs();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader title="บันทึกการคืนสินค้า" subtitle="ระบุ PO และรหัสหน่วยที่คืนกลับ" />
      <ReturnForm pos={pos.map((p) => ({ po_number: p.po_number, branch_label: p.branch_label }))} />
    </div>
  );
}
