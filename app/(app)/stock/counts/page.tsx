import { ClipboardCheck } from "lucide-react";
import { requirePermission } from "@/lib/auth/require-user";
import { listStockCounts } from "@/lib/actions/stock-count";
import { PageHeader } from "@/components/ui";
import { StockCountReview } from "@/components/StockCountReview";

export const dynamic = "force-dynamic";

export default async function StockCountsPage() {
  await requirePermission("requisitions");
  const counts = await listStockCounts();
  const pending = counts.filter((c) => c.status === "pending").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader icon={ClipboardCheck} title="ตรวจนับสต๊อก"
        subtitle={pending ? `รอตรวจ ${pending} รายการ` : "ผลนับสต๊อกจากพนักงานขาย"} />
      <StockCountReview counts={counts} />
    </div>
  );
}
