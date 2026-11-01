import { FileEdit, TriangleAlert } from "lucide-react";
import { requirePermission } from "@/lib/auth/require-user";
import { salesDraftLines, salesRealMonthTotal, salesMonthsForBranch } from "@/lib/queries";
import { isBranch, DEFAULT_BRANCH, branchName } from "@/lib/branches";
import { PageHeader } from "@/components/ui";
import { BranchTabs } from "@/components/BranchTabs";
import { DraftSalesReview } from "@/components/DraftSalesReview";

export const dynamic = "force-dynamic";

const isMonth = (s?: string) => !!s && /^\d{4}-\d{2}$/.test(s);
const thisMonth = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(0, 7);

// ยอดขาย CTW (ฉบับร่าง) — ชุดข้อมูลสำเนาที่แก้ได้อิสระ ไม่กระทบยอดขายจริง
export default async function SalesDraftPage({ searchParams }: { searchParams: Promise<{ branch?: string; month?: string }> }) {
  await requirePermission("sales_draft");
  const sp = await searchParams;
  const branch = isBranch(sp.branch) ? sp.branch! : DEFAULT_BRANCH;
  const months = await salesMonthsForBranch(branch);
  const month = isMonth(sp.month) ? sp.month! : (months[0] || thisMonth());
  const [lines, real] = await Promise.all([
    salesDraftLines(month, branch),
    salesRealMonthTotal(month, branch),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader icon={FileEdit} title="ยอดขาย CTW (ฉบับร่าง)"
        subtitle={`สำเนายอดขายไว้แก้/จำลอง · ${branchName(branch)} — ไม่กระทบยอดขายจริง`} />

      {/* แบนเนอร์ถาวร: ย้ำว่าไม่ใช่ยอดขายจริง */}
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50/70 px-4 py-3 text-sm text-amber-800">
        <TriangleAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <b>นี่คือฉบับร่าง — ไม่ใช่ยอดขายจริง</b> · แก้/ลบรายการที่นี่ <u>ไม่กระทบ</u>ข้อมูลขายจริงในระบบ (sales / ตรวจสอบยอดขาย)
          · ห้ามใช้ตัวเลขนี้แทนยอดขายจริงในการยื่น/รายงานต่อบุคคลภายนอก
        </div>
      </div>

      <div className="mb-4"><BranchTabs defaultValue={DEFAULT_BRANCH} /></div>
      <DraftSalesReview lines={lines} branch={branch} month={month} months={months} real={real} />
    </div>
  );
}
