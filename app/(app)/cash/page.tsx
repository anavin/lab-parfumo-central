import { PageHeader, Stat, Card } from "@/components/ui";
import { baht } from "@/lib/format";
import { AddCash } from "@/components/EntryForms";
import { Wallet } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { CashTable } from "@/components/CashTable";
import { q } from "@/lib/db";
import { dailyCashLog } from "@/lib/queries";

export const dynamic = "force-dynamic";

const fmtDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "2-digit" });

export default async function CashPage() {
  const drawer = await dailyCashLog(90);
  const rows = await q<{ cash_date: string; description: string; amount: number; type: string }>(`
    select cash_date, description, amount::float, type
    from cash_entries order by cash_date desc nulls last, id desc`);
  const [agg] = await q<{ total: number; n: number }>(
    `select coalesce(sum(amount),0)::float total, count(*)::int n from cash_entries`);
  const byType = await q<{ type: string; total: number }>(`
    select coalesce(type,'ไม่ระบุ') type, sum(amount)::float total
    from cash_entries group by 1 order by total desc`);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
      <PageHeader icon={Wallet} title="เงินสด" subtitle="บันทึกเงินสดหน้าร้าน / เงินสดย่อย" action={<ExportButton kind="cash" />} />
      <AddCash />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="เงินสดสะสม" value={baht(agg.total)} tone="success" />
        <Stat label="จำนวนรายการ" value={String(agg.n)} />
        {byType.slice(0, 2).map((t) => <Stat key={t.type} label={t.type} value={baht(t.total)} />)}
      </div>
      {drawer.length > 0 && (
        <Card title="เงินสดหน้าร้าน (รายวัน) · จากที่พนักงานบันทึกในสรุปรายวัน" bodyClass="p-0 overflow-x-auto" className="mb-6">
          <table className="w-full text-sm">
            <thead className="bg-canvas"><tr className="th border-b border-line-soft">
              <th className="px-5 py-2.5 text-left">วันที่</th>
              <th className="px-3 py-2.5 text-right">ยกมา</th>
              <th className="px-3 py-2.5 text-right">🏦 เข้าธนาคาร</th>
              <th className="px-5 py-2.5 text-right">คงเหลือหน้าร้าน</th>
            </tr></thead>
            <tbody>
              {drawer.map((d) => (
                <tr key={d.entry_date} className="border-b border-line-soft last:border-0 hover:bg-canvas">
                  <td className="px-5 py-2.5 font-medium text-ink whitespace-nowrap">{fmtDay(d.entry_date)}</td>
                  <td className="px-3 py-2.5 text-right text-muted tabular-nums">{baht(d.opening)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-brand-dark tabular-nums">{baht(d.deposit)}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-ink tabular-nums">{baht(d.closing)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-muted px-5 py-2">อ่านอย่างเดียว · แก้ไขได้ที่สรุปรายวันในหน้าพนักงานขาย · ไม่รวมในยอด “เงินสดสะสม” ด้านบน</p>
        </Card>
      )}

      <Card title={`รายการเงินสด (${rows.length}) · คลิกหัวคอลัมน์เพื่อเรียง`}>
        <CashTable rows={rows} />
      </Card>
    </div>
  );
}
