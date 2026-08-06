import { PageHeader, Stat, Card, Badge } from "@/components/ui";
import { baht, num, fmtDate } from "@/lib/format";
import { AddSale, AddCustomerDay } from "@/components/EntryForms";
import { ExportButton } from "@/components/ExportButton";
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
      <PageHeader icon={Receipt} title="การขาย" subtitle="รายเดือน + รายการล่าสุด" action={<ExportButton kind="sales" />} />
      <div className="flex gap-3 flex-wrap"><AddSale /><AddCustomerDay /></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="รายได้รวม" value={baht(tot.revenue)} tone="brand" />
        <Stat label="จำนวนขาย" value={num(tot.qty)} sub="ชิ้น" />
        <Stat label="เดือนที่มีข้อมูล" value={String(monthly.length)} />
        <Stat label="เฉลี่ย/เดือน" value={baht(monthly.length ? tot.revenue / monthly.length : 0)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="สรุปรายเดือน">
          <table className="w-full text-sm">
            <thead><tr className="text-black/40 text-xs text-left border-b"><th className="pb-2">เดือน</th><th className="pb-2 text-right">ใบเสร็จ</th><th className="pb-2 text-right">ชิ้น</th><th className="pb-2 text-right">รายได้</th></tr></thead>
            <tbody>
              {monthly.map((m) => (
                <tr key={m.month} className="border-b last:border-0">
                  <td className="py-2 font-medium">{m.month}</td>
                  <td className="py-2 text-right text-black/60">{num(m.receipts)}</td>
                  <td className="py-2 text-right text-black/60">{num(m.qty)}</td>
                  <td className="py-2 text-right font-medium">{baht(m.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="รายการขายล่าสุด (60)">
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-black/40 text-xs text-left sticky top-0 bg-white"><tr className="border-b"><th className="pb-2">วันที่</th><th className="pb-2">รายการ</th><th className="pb-2 text-right">จำนวน</th><th className="pb-2 text-right">ยอด</th></tr></thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1.5 text-black/50 whitespace-nowrap">{fmtDate(r.sale_date)}</td>
                    <td className="py-1.5">{r.item} <span className="text-black/35">{r.size}</span>
                      {r.nation && <Badge tone={r.nation === "Foreign" ? "info" : "gray"}>{r.nation}</Badge>}
                    </td>
                    <td className="py-1.5 text-right text-black/60">{num(r.qty)}</td>
                    <td className="py-1.5 text-right font-medium">{baht(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
