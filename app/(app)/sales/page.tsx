import { PageHeader, Stat, Card } from "@/components/ui";
import { baht, num } from "@/lib/format";
import { AddSale, AddCustomerDay } from "@/components/EntryForms";
import { ExportButton } from "@/components/ExportButton";
import { MonthlyTable, RecentSalesTable } from "@/components/SalesTables";
import { DailyReport } from "@/components/DailyReport";
import { Receipt } from "lucide-react";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const monthly = await q<{ month: string; revenue: number; qty: number; receipts: number }>(`
    select month, sum(total)::float revenue, sum(qty)::float qty,
           count(distinct receipt_no) receipts
    from sales where month is not null group by month order by min(sale_date) desc`);

  const recent = await q<{ sale_date: string; ba: string; item: string; size: string; qty: number; total: number; payment_channel: string; nation: string; source: string }>(`
    select sale_date, ba, item, size, qty, total, payment_channel, nation, source
    from sales order by sale_date desc nulls last, id desc limit 60`);

  const [tot] = await q<{ revenue: number; qty: number }>(
    `select coalesce(sum(total),0)::float revenue, coalesce(sum(qty),0)::float qty from sales`);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader icon={Receipt} title="การขาย" subtitle="รายเดือน + รายการล่าสุด" action={<ExportButton kind="sales" />} />
      <div className="flex gap-3 flex-wrap"><AddSale /><AddCustomerDay /></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="รายได้รวม" value={baht(tot.revenue)} tone="brand" />
        <Stat label="จำนวนขาย" value={num(tot.qty)} sub="ชิ้น" />
        <Stat label="เดือนที่มีข้อมูล" value={String(monthly.length)} />
        <Stat label="เฉลี่ย/เดือน" value={baht(monthly.length ? tot.revenue / monthly.length : 0)} />
      </div>

      <div className="mb-6"><DailyReport revision={`${tot.revenue}|${recent.length}`} /></div>

      <div className="grid lg:grid-cols-5 gap-4 items-start">
        <Card title="สรุปรายเดือน" className="lg:col-span-2">
          <MonthlyTable rows={monthly} />
        </Card>
        <Card title="รายการขายล่าสุด (60) · คลิกหัวคอลัมน์เพื่อเรียง" className="lg:col-span-3">
          <RecentSalesTable rows={recent} />
        </Card>
      </div>
    </div>
  );
}
