import { ClipboardCheck } from "lucide-react";
import { requirePermission } from "@/lib/auth/require-user";
import { pendingSubmissions, recentlyApprovedSubmissions, pendingCountsByBranch, attachmentsForRefs, paymentsForRefs } from "@/lib/queries";
import { isBranch, DEFAULT_BRANCH, branchOptions, branchName } from "@/lib/branches";
import { PageHeader } from "@/components/ui";
import { ReviewQueue } from "@/components/ReviewQueue";
import { ReviewInsights } from "@/components/ReviewInsights";
import { MonthlyExcelButton } from "@/components/MonthlyExcelButton";

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
    </div>
  );
}
