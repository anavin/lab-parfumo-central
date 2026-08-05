import { PageHeader, Stat, Card } from "@/components/ui";
import { baht, fmtDate } from "@/lib/format";
import { AddCash } from "@/components/EntryForms";
import { Wallet } from "lucide-react";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CashPage() {
  const rows = await q<{ cash_date: string; description: string; amount: number; type: string }>(`
    select cash_date, description, amount::float, type
    from cash_entries order by cash_date desc nulls last, id desc`);
  const [agg] = await q<{ total: number; n: number }>(
    `select coalesce(sum(amount),0)::float total, count(*)::int n from cash_entries`);
  const byType = await q<{ type: string; total: number }>(`
    select coalesce(type,'ไม่ระบุ') type, sum(amount)::float total
    from cash_entries group by 1 order by total desc`);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1000px] mx-auto">
      <PageHeader icon={Wallet} title="เงินสด" subtitle="บันทึกเงินสดหน้าร้าน / เงินสดย่อย" />
      <AddCash />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="เงินสดสะสม" value={baht(agg.total)} tone="success" />
        <Stat label="จำนวนรายการ" value={String(agg.n)} />
        {byType.slice(0, 2).map((t) => <Stat key={t.type} label={t.type} value={baht(t.total)} />)}
      </div>
      <Card title={`รายการเงินสด (${rows.length})`}>
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-black/40 text-xs text-left sticky top-0 bg-white"><tr className="border-b"><th className="pb-2">วันที่</th><th className="pb-2">รายละเอียด</th><th className="pb-2">ประเภท</th><th className="pb-2 text-right">จำนวนเงิน</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1.5 text-black/50 whitespace-nowrap">{fmtDate(r.cash_date)}</td>
                  <td className="py-1.5">{r.description}</td>
                  <td className="py-1.5 text-black/50">{r.type}</td>
                  <td className="py-1.5 text-right font-medium">{baht(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
