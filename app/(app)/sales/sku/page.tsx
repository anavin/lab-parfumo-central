import { PageHeader } from "@/components/ui";
import { Barcode } from "lucide-react";
import { requireAnyPermission } from "@/lib/auth/require-user";
import { soldSkuHistory } from "@/lib/queries";
import { isBranch, DEFAULT_BRANCH, branchName } from "@/lib/branches";
import { BranchTabs } from "@/components/BranchTabs";
import { SkuSalesHistory } from "@/components/SkuSalesHistory";

export const dynamic = "force-dynamic";

const ymd = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const isYmd = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

// รายการขายรายชิ้น (SKU) ย้อนหลัง — เลือกช่วงวันที่ + สาขา แล้ว Export CSV ได้
export default async function SkuSalesPage({ searchParams }: { searchParams: Promise<{ branch?: string; from?: string; to?: string }> }) {
  await requireAnyPermission(["sales", "requisitions", "stock"]);
  const sp = await searchParams;
  const branch = sp.branch === "all" ? null : (isBranch(sp.branch) ? sp.branch! : DEFAULT_BRANCH);

  const today = ymd(new Date());
  const from = isYmd(sp.from) ? sp.from! : ymd(new Date(Date.now() - 29 * 86400000));   // ค่าเริ่มต้น 30 วันล่าสุด
  const to = isYmd(sp.to) ? sp.to! : today;
  const rows = await soldSkuHistory(branch, from, to);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader icon={Barcode} title="รายการขายรายชิ้น (SKU)"
        subtitle={`SKU ที่ขายไปย้อนหลัง${branch ? ` · ${branchName(branch)}` : " · ทุกสาขา"} — เลือกช่วงวันที่แล้ว Export ได้`} />
      <div className="mb-3"><BranchTabs withAll defaultValue={DEFAULT_BRANCH} /></div>
      <SkuSalesHistory rows={rows} branch={branch} from={from} to={to} />
    </div>
  );
}
