import { PageHeader, Stat, Card } from "@/components/ui";
import { baht } from "@/lib/format";
import { AddCash } from "@/components/EntryForms";
import { Wallet } from "lucide-react";
import { CashTable } from "@/components/CashTable";
import { CashTabs } from "@/components/CashTabs";
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
  const [drawer, cashSlips, rows] = await Promise.all([
    dailyCashLog(90, branch),
    cashAttachmentsByDate(branch),
    q<{ cash_date: string; description: string; amount: number; type: string }>(`
      select cash_date, description, amount::float, type
      from cash_entries order by cash_date desc nulls last, id desc limit 1000`),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader icon={Wallet} title="เงินสด" subtitle="บันทึกเงินสดหน้าร้าน / เงินสดย่อย" />

      <CashTabs
        dailyLabel="เงินสดหน้าร้าน (รายวัน)"
        listLabel={`รายการเงินสด (${rows.length})`}
        daily={
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-ink">เงินสดหน้าร้าน (รายวัน) · {branchName(branch)}</h2>
              <BranchTabs />
            </div>
            {drawer.length > 0 && (
              <div className="mb-4 max-w-xs">
                <Stat label={`เงินสดหน้าร้านล่าสุด · ${branchName(branch)}`} value={baht(drawer[0].closing)} tone="success" />
              </div>
            )}
            {drawer.length > 0 ? (
              <Card title="ตรวจสอบ & บันทึกเข้าระบบ" bodyClass="p-0 overflow-x-auto">
                <DrawerAdmin rows={drawer} attachments={cashSlips} branch={branch} />
              </Card>
            ) : (
              <Card><div className="p-8 text-center text-muted text-sm">ยังไม่มีข้อมูลเงินสดหน้าร้านของ {branchName(branch)}</div></Card>
            )}
          </>
        }
        list={
          <>
            <AddCash />
            <Card title={`รายการเงินสด (${rows.length}) · คลิกหัวคอลัมน์เพื่อเรียง`} className="mt-4">
              <CashTable rows={rows} />
            </Card>
          </>
        }
      />
    </div>
  );
}
