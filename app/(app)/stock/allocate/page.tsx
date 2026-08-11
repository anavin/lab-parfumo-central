import { PageHeader } from "@/components/ui";
import { PackagePlus } from "lucide-react";
import { requirePermission } from "@/lib/auth/require-user";
import { branchAllocations } from "@/lib/queries";
import { BranchTabs } from "@/components/BranchTabs";
import { StockAllocateForm } from "@/components/StockAllocateForm";
import { isBranch, DEFAULT_BRANCH, branchName } from "@/lib/branches";

export const dynamic = "force-dynamic";

export default async function AllocateStockPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  await requirePermission("requisitions");
  const sp = await searchParams;
  const branch = isBranch(sp.branch) ? sp.branch! : DEFAULT_BRANCH;
  const allocations = await branchAllocations(branch);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[900px] mx-auto">
      <PageHeader icon={PackagePlus} title="จัดสต๊อกเข้าสาขา"
        subtitle="ระบุกลิ่น + จำนวนที่เอาไปขายแต่ละสาขา (เบิกจากคลัง — เพิ่มเข้าสต๊อกของสาขานั้น)"
        action={<BranchTabs />} />
      <StockAllocateForm branch={branch} branchName={branchName(branch)} allocations={allocations} />
    </div>
  );
}
