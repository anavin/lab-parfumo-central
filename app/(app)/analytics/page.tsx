import { BarChart3 } from "lucide-react";
import { requireAnyPermission } from "@/lib/auth/require-user";
import { salesAnalytics } from "@/lib/analytics";
import { isBranch, DEFAULT_BRANCH, branchName } from "@/lib/branches";
import { PageHeader } from "@/components/ui";
import { BranchTabs } from "@/components/BranchTabs";
import { SalesAnalytics } from "@/components/SalesAnalytics";

export const dynamic = "force-dynamic";

const ymd = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const isYmd = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

// วิเคราะห์การขายทุกมุม — เลือกช่วงวันที่ + สาขา แล้วดู/Export ได้
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ branch?: string; from?: string; to?: string }> }) {
  await requireAnyPermission(["analytics", "dashboard", "review"]);
  const sp = await searchParams;
  const branch = sp.branch === "all" ? null : (isBranch(sp.branch) ? sp.branch! : DEFAULT_BRANCH);

  const today = ymd(new Date());
  const monthStart = today.slice(0, 8) + "01";                       // วันที่ 1 ของเดือนนี้
  const from = isYmd(sp.from) ? sp.from! : monthStart;
  const to = isYmd(sp.to) ? sp.to! : today;
  const data = await salesAnalytics(branch, from, to);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader icon={BarChart3} title="วิเคราะห์การขาย"
        subtitle={`ทุกมุมของยอดขาย${branch ? ` · ${branchName(branch)}` : " · ทุกสาขา"} — กลิ่น / ขนาด / เวลา / วัน / พนักงาน`} />
      <div className="mb-3"><BranchTabs withAll defaultValue={DEFAULT_BRANCH} /></div>
      <SalesAnalytics data={data} branch={branch} from={from} to={to} />
    </div>
  );
}
