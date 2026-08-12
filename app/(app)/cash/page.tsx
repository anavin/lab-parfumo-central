import { PageHeader, Stat, Card } from "@/components/ui";
import { baht } from "@/lib/format";
import { AddCash } from "@/components/EntryForms";
import { Wallet } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { CashTable } from "@/components/CashTable";
import { DrawerAdmin } from "@/components/DrawerAdmin";
import { q } from "@/lib/db";
import { dailyCashLog, cashAttachmentsByDate } from "@/lib/queries";
import { BranchTabs } from "@/components/BranchTabs";
import { isBranch, DEFAULT_BRANCH, branchName } from "@/lib/branches";

export const dynamic = "force-dynamic";

export default async function CashPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const sp = await searchParams;
  const branch = isBranch(sp.branch) ? sp.branch! : DEFAULT_BRANCH;
  // independent reads — run them together instead of five sequential round-trips
  const [drawer, cashSlips, rows, [agg], byType] = await Promise.all([
    dailyCashLog(90, branch),
    cashAttachmentsByDate(branch),
    q<{ cash_date: string; description: string; amount: number; type: string }>(`
      select cash_date, description, amount::float, type
      from cash_entries order by cash_date desc nulls last, id desc`),
    q<{ total: number; n: number }>(
      `select coalesce(sum(amount),0)::float total, count(*)::int n from cash_entries`),
    q<{ type: string; total: number }>(`
      select coalesce(type,'ไม่ระบุ') type, sum(amount)::float total
      from cash_entries group by 1 order by total desc`),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
      <PageHeader icon={Wallet} title="เงินสด" subtitle="บันทึกเงินสดหน้าร้าน / เงินสดย่อย" action={<ExportButton kind="cash" />} />
      <AddCash />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="เงินสดสะสม" value={baht(agg.total)} tone="success" />
        <Stat label="จำนวนรายการ" value={String(agg.n)} />
        {byType.slice(0, 2).map((t) => <Stat key={t.type} label={t.type} value={baht(t.total)} />)}
      </div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">เงินสดหน้าร้าน (รายวัน) · {branchName(branch)}</h2>
        <BranchTabs />
      </div>
      {drawer.length > 0 ? (
        <Card title="ตรวจสอบ & บันทึกเข้าระบบ" bodyClass="p-0 overflow-x-auto" className="mb-6">
          <DrawerAdmin rows={drawer} attachments={cashSlips} branch={branch} />
        </Card>
      ) : (
        <Card className="mb-6"><div className="p-8 text-center text-muted text-sm">ยังไม่มีข้อมูลเงินสดหน้าร้านของ {branchName(branch)}</div></Card>
      )}

      <Card title={`รายการเงินสด (${rows.length}) · คลิกหัวคอลัมน์เพื่อเรียง`}>
        <CashTable rows={rows} />
      </Card>
    </div>
  );
}
