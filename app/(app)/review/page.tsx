import { ClipboardCheck } from "lucide-react";
import { requirePermission } from "@/lib/auth/require-user";
import { pendingSubmissions, recentlyApprovedSubmissions, pendingCountsByBranch, attachmentsForRefs, paymentsForRefs, topScents, monthlySalesTotals, ALL } from "@/lib/queries";
import { isBranch, DEFAULT_BRANCH, branchOptions, branchName } from "@/lib/branches";
import { PageHeader } from "@/components/ui";
import { ReviewQueue } from "@/components/ReviewQueue";
import { ReviewInsights } from "@/components/ReviewInsights";
import { MonthlyExcelButton } from "@/components/MonthlyExcelButton";
import { TopScentsCard } from "@/components/TopScentsCard";
import { Columns } from "@/components/charts";

const TH_MON = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export const dynamic = "force-dynamic";

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  await requirePermission("review");
  const sp = await searchParams;
  const branch = isBranch(sp.branch) ? sp.branch! : DEFAULT_BRANCH;   // review one branch at a time
  const rows = await pendingSubmissions(branch);
  const pendingBills = new Set(rows.map((r) => r.receipt_no || `id:${r.id}`)).size;   // rows sharing a receipt = one bill
  const approved = await recentlyApprovedSubmissions(branch);
  // pending counts for EVERY branch so the admin can't miss another branch's queue
  const pendingByBranch = await pendingCountsByBranch();
  const otherPending = branchOptions().filter((b) => b.value !== branch && (pendingByBranch[b.value] ?? 0) > 0);
  const refs = [...rows, ...approved].map((r) => r.receipt_no).filter(Boolean) as string[];
  const attachments = await attachmentsForRefs(refs);
  const payments = await paymentsForRefs(refs);

  // month-vs-month comparison + top-selling products (all sources, live sales)
  const [topScentsData, monthTotals] = await Promise.all([topScents(ALL, 15), monthlySalesTotals(null, 12)]);
  const monthChart = [...monthTotals].reverse().map((m) => {
    const [y, mm] = m.ym.split("-").map(Number);
    return { label: `${TH_MON[mm]} ${String((y + 543) % 100).padStart(2, "0")}`, value: Math.round(m.revenue) };
  });
  const highlight = monthChart.at(-1)?.label;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="no-print">
        <PageHeader icon={ClipboardCheck} title="ตรวจสอบยอดขาย"
          subtitle={pendingBills ? `${pendingBills} บิลรอตรวจสอบ — อนุมัติเพื่อส่งเข้าระบบ` : "ตรวจสอบข้อมูลที่พนักงานกรอกก่อนเข้าระบบ"} />
        <div className="mb-6"><MonthlyExcelButton /></div>
        {otherPending.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-warn/40 bg-warn-soft px-4 py-2.5 text-sm text-ink">
            <span className="text-warn font-medium">อีกสาขามีบิลรอตรวจ:</span>
            {otherPending.map((b) => (
              <a key={b.value} href={`/review?branch=${b.value}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-line hover:bg-canvas">
                {branchName(b.value)} <b className="tabular-nums">{pendingByBranch[b.value]}</b>
              </a>
            ))}
          </div>
        )}
      </div>
      <ReviewInsights revision={`${rows.length}|${approved.length}`} branch={branch}>
        <div className="no-print">
          <ReviewQueue rows={rows} approved={approved} attachments={attachments} payments={payments} />
        </div>
      </ReviewInsights>

      {/* month-vs-month + best sellers — kept at the very bottom */}
      <div className="no-print grid gap-6 lg:grid-cols-2 mt-8">
        <div className="card p-5 flex flex-col">
          <h3 className="text-[14px] font-semibold text-ink">เปรียบเทียบยอดขายรายเดือน</h3>
          <p className="text-[12px] text-muted mt-0.5 mb-3">รายได้รวมของแต่ละเดือน (ล่าสุด {monthChart.length} เดือน)</p>
          {monthChart.length ? <Columns data={monthChart} highlight={highlight} />
            : <div className="flex-1 grid place-items-center text-sm text-muted py-10">ยังไม่มีข้อมูล</div>}
        </div>
        <TopScentsCard data={topScentsData} />
      </div>
    </div>
  );
}
