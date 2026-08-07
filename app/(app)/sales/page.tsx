import { PageHeader, Stat, Card } from "@/components/ui";
import { baht, num } from "@/lib/format";
import { AddSale, AddCustomerDay } from "@/components/EntryForms";
import { ExportButton } from "@/components/ExportButton";
import { MonthlyTable, RecentSalesTable } from "@/components/SalesTables";
import { Receipt } from "lucide-react";
import { q } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  await requirePermission("sales");   // salespeople (my_sales only) can't see branch sales / discounts
  const monthly = await q<{ month: string; revenue: number; qty: number; receipts: number }>(`
    select month, sum(total)::float revenue, sum(qty)::float qty,
           count(distinct receipt_no) receipts
    from sales where month is not null group by month order by min(sale_date) desc`);

  const recent = await q<{ sale_date: string; ba: string; item: string; size: string; qty: number; total: number; payment_channel: string; nation: string; source: string }>(`
    select sale_date, ba, item, size, qty, total, payment_channel, nation, source
    from sales order by sale_date desc nulls last, id desc limit 60`);

  const [tot] = await q<{ revenue: number; qty: number }>(
    `select coalesce(sum(total),0)::float revenue, coalesce(sum(qty),0)::float qty from sales`);

  // monthly discount breakdown — gross (before discount) vs discount vs net
  const disc = await q<{ month: string; gross: number; discount: number; net: number }>(`
    select month,
           coalesce(sum(qty*unit_price),0)::float gross,
           coalesce(sum(discount),0)::float discount,
           coalesce(sum(total),0)::float net
    from sales where month is not null group by month order by min(sale_date) desc`);
  const discTot = disc.reduce((a, d) => ({ gross: a.gross + d.gross, discount: a.discount + d.discount, net: a.net + d.net }), { gross: 0, discount: 0, net: 0 });
  const pct = (d: number, g: number) => (g > 0 ? (d / g) * 100 : 0);
  const avgRate = pct(discTot.discount, discTot.gross);

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

      <Card title={`ส่วนลดรายเดือน · เฉลี่ยรวม ${avgRate.toFixed(1)}% ของราคาเต็ม`} bodyClass="p-0 overflow-x-auto" className="mb-6">
        <table className="w-full text-sm">
          <thead className="bg-canvas"><tr className="th border-b border-line-soft">
            <th className="px-5 py-2.5 text-left">เดือน</th>
            <th className="px-3 py-2.5 text-right">ราคาเต็ม</th>
            <th className="px-3 py-2.5 text-right">ส่วนลด</th>
            <th className="px-3 py-2.5 text-right">% ลด</th>
            <th className="px-5 py-2.5 text-right">ยอดสุทธิ</th>
          </tr></thead>
          <tbody>
            {disc.map((d) => {
              const r = pct(d.discount, d.gross);
              const hot = r > avgRate + 5;   // notably above the overall average
              return (
                <tr key={d.month} className={`border-b border-line-soft last:border-0 ${hot ? "bg-warn-soft/40" : "hover:bg-canvas"}`}>
                  <td className="px-5 py-2.5 font-medium text-ink">{d.month}</td>
                  <td className="px-3 py-2.5 text-right text-muted tabular-nums">{baht(d.gross)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-warn tabular-nums">{baht(d.discount)}</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${hot ? "text-danger" : "text-ink"}`}>{r.toFixed(1)}%</td>
                  <td className="px-5 py-2.5 text-right text-ink tabular-nums">{baht(d.net)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot><tr className="border-t-2 border-line font-bold bg-canvas/60">
            <td className="px-5 py-2.5 text-ink">รวมทั้งหมด</td>
            <td className="px-3 py-2.5 text-right tabular-nums">{baht(discTot.gross)}</td>
            <td className="px-3 py-2.5 text-right text-warn tabular-nums">{baht(discTot.discount)}</td>
            <td className="px-3 py-2.5 text-right tabular-nums">{avgRate.toFixed(1)}%</td>
            <td className="px-5 py-2.5 text-right tabular-nums">{baht(discTot.net)}</td>
          </tr></tfoot>
        </table>
        <p className="text-[11px] text-muted px-5 py-2">แถวไฮไลต์ = เดือนที่ % ส่วนลดสูงกว่าค่าเฉลี่ยรวมมากกว่า 5%</p>
      </Card>

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
