import { Store, Wallet, CreditCard } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { myDayKpis, mySubmissions, myTrend } from "@/lib/queries";
import { PageHeader, Stat, Card } from "@/components/ui";
import { baht, num } from "@/lib/format";
import { DateNav } from "@/components/DateNav";
import { MyWorkspace } from "@/components/MyWorkspace";

export const dynamic = "force-dynamic";

const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const thaiDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default async function MyPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = bkkToday();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date || "") ? sp.date! : today;

  const [kpi, rows, trend] = await Promise.all([
    myDayKpis(user.id, date),
    mySubmissions(user.id, date),
    myTrend(user.id, 14),
  ]);
  const maxRev = Math.max(1, ...trend.map((t) => t.revenue));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px] mx-auto">
      <PageHeader icon={Store} title="ยอดขายของฉัน" subtitle={`สวัสดี ${user.full_name} · ${thaiDay(date)}`}
        action={<DateNav date={date} today={today} />} />

      {/* data entry first */}
      <MyWorkspace date={date} fullName={user.full_name} rows={rows} />

      {/* daily summary — below the entry */}
      <h2 className="text-sm font-semibold text-ink mb-3 mt-2">สรุปรายวัน</h2>

      {kpi.pending > 0 && (
        <div className="mb-4 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-2.5">
          มี <b>{kpi.pending}</b> รายการรอผู้ดูแลตรวจสอบ — จะขึ้นแดชบอร์ดรวมหลังได้รับอนุมัติ
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
        <Stat label="ยอดขายวันนี้" value={baht(kpi.revenue)} tone="brand" />
        <Stat label="บิล" value={num(kpi.bills)} sub="ใบเสร็จ" />
        <Stat label="จำนวน" value={num(kpi.qty)} sub="ชิ้น" />
        <Stat label="ลูกค้า" value={num(kpi.customers)} sub="ราย" />
        <Stat label="เฉลี่ย/บิล" value={baht(kpi.aov)} />
      </div>

      {/* payment breakdown — cash vs. everything else */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Wallet className="w-4 h-4" /></span>
            เงินสด
          </div>
          <div className="text-xl font-bold text-ink mt-2 tabular-nums">{baht(kpi.cashRevenue)}</div>
          <div className="text-[11px] text-muted-soft">{num(kpi.cashBills)} บิล</div>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center"><CreditCard className="w-4 h-4" /></span>
            โอน / บัตร / อื่นๆ
          </div>
          <div className="text-xl font-bold text-ink mt-2 tabular-nums">{baht(kpi.otherRevenue)}</div>
          <div className="text-[11px] text-muted-soft">{num(kpi.otherBills)} บิล</div>
        </div>
      </div>

      <Card title="ยอดขายของฉัน 14 วันล่าสุด">
        {trend.every((t) => t.revenue === 0) ? (
          <div className="py-6 text-center text-sm text-muted">ยังไม่มียอดขายในช่วง 14 วันนี้</div>
        ) : (
          <div className="flex items-end gap-1.5 h-32 pt-2">
            {trend.map((t) => (
              <div key={t.d} className="flex-1 flex flex-col items-center gap-1 group" title={`${t.d}: ${baht(t.revenue)}`}>
                <div className="w-full rounded-t bg-brand/80 group-hover:bg-brand transition-colors" style={{ height: `${Math.max(2, (t.revenue / maxRev) * 100)}%` }} />
                <span className="text-[9px] text-muted">{t.d.slice(8)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
