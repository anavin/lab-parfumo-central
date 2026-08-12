import type { Viewport } from "next";
import { cookies } from "next/headers";
import { Store } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { isBranch, DEFAULT_BRANCH, isStockGated } from "@/lib/branches";
import { myDayKpis, mySubmissions, myTrend, attachmentsForRefs, paymentsForRefs, pendingReceipts, stockLive } from "@/lib/queries";
import { ReceivingPanel } from "@/components/ReceivingPanel";
import { PageHeader, Stat, Card } from "@/components/ui";
import { baht, num } from "@/lib/format";
import { DateNav } from "@/components/DateNav";
import { MyWorkspace } from "@/components/MyWorkspace";
import { DailyReport } from "@/components/DailyReport";
import { PAYMENTS } from "@/lib/payments";

export const dynamic = "force-dynamic";

// Salesperson page is mobile-only and used for fast data entry at the counter.
// Lock zoom so pinch/double-tap can't shift the layout and — most importantly —
// iOS doesn't auto-zoom when tapping the 14px number inputs. Only this route.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const CH_LABEL: Record<string, string> = Object.fromEntries(PAYMENTS.map((p) => [p.v, p.label.replace(/\s*\(.*\)$/, "")]));
const chLabel = (c: string) => CH_LABEL[c] ?? c;
const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const thaiDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default async function MyPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = bkkToday();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date || "") ? sp.date! : today;

  // branch the salesperson picked for TODAY (cookie "my_branch=CODE:YYYY-MM-DD");
  // ignore it on a different Bangkok day so each day starts with a fresh choice.
  const jar = await cookies();
  const [bCode, bDate] = (jar.get("my_branch")?.value || "").split(":");
  const branch = bDate === today && isBranch(bCode) ? bCode : DEFAULT_BRANCH;

  const [kpi, rows, trendRows, receipts] = await Promise.all([
    myDayKpis(user.id, date),
    mySubmissions(user.id, date),
    myTrend(user.id, 14),
    pendingReceipts(branch),   // approved requisitions waiting for this branch to receive
  ]);
  // Fill every day in the 14-day window (including zero-sale days) so the chart
  // is a true timeline, not just the scattered days that had sales. UTC math so
  // the day keys never drift across the timezone boundary.
  const revByDay = new Map(trendRows.map((t) => [t.d, t.revenue]));
  const [ty, tm, td] = today.split("-").map(Number);
  const trend = Array.from({ length: 14 }, (_, i) => {
    const dt = new Date(Date.UTC(ty, tm - 1, td - (13 - i)));
    const d = dt.toISOString().slice(0, 10);
    return { d, revenue: revByDay.get(d) ?? 0 };
  });
  const maxRev = Math.max(1, ...trend.map((t) => t.revenue));
  const billRefs = rows.map((r) => r.receipt_no).filter(Boolean) as string[];
  const attachments = await attachmentsForRefs(billRefs);
  const payments = await paymentsForRefs(billRefs);
  // stock-gated branch (e.g. SCS): map barcode → remaining so the sale form can cap the
  // quantity picker (across scan + search + multiple lines) and can't oversell.
  const stockMap = isStockGated(branch)
    ? Object.fromEntries((await stockLive(branch)).map((r) => [r.barcode, Math.max(0, Math.round(r.remaining))]))
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px] mx-auto">
      <PageHeader icon={Store} title="ยอดขายของฉัน" subtitle={`สวัสดี ${user.full_name} · ${thaiDay(date)}`}
        action={<DateNav date={date} today={today} />} />

      {/* goods-receipt inbox — approved requisitions this branch needs to accept */}
      <ReceivingPanel pending={receipts} />

      {/* data entry first */}
      <MyWorkspace date={date} today={today} fullName={user.full_name} rows={rows} attachments={attachments} payments={payments} branch={branch} stockMap={stockMap} />

      {/* daily summary — below the entry */}
      <h2 className="text-sm font-semibold text-ink mb-3 mt-2">สรุปรายวัน</h2>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
        <Stat label="ยอดขายวันนี้" value={baht(kpi.revenue)} tone="brand" />
        {/* per-channel breakdown — only channels that actually took money today */}
        {kpi.channels.map((c) => (
          <Stat key={c.channel} label={chLabel(c.channel)} value={baht(c.revenue)} />
        ))}
        {/* 1 บิล ≈ 1 ลูกค้า — รวมเป็นตัวเดียว */}
        <Stat label="จำนวนลูกค้า/จำนวนบิล" value={num(kpi.bills)} sub="ราย · ใบเสร็จ" />
        <Stat label="จำนวน" value={num(kpi.qty)} sub="ชิ้น" />
        <Stat label="เฉลี่ย/บิล" value={baht(kpi.aov)} />
      </div>

      <div className="mb-5"><DailyReport mine defaultSource={branch} revision={`${kpi.revenue}|${kpi.bills}|${kpi.qty}`} /></div>

      <Card title="ยอดขายของฉัน 14 วันล่าสุด">
        {trend.every((t) => t.revenue === 0) ? (
          <div className="py-6 text-center text-sm text-muted">ยังไม่มียอดขายในช่วง 14 วันนี้</div>
        ) : (
          <div className="flex items-stretch gap-1.5 h-36 pt-2">
            {trend.map((t) => (
              <div key={t.d} className="flex-1 flex flex-col items-center gap-1 group" title={`${t.d}: ${baht(t.revenue)}`}>
                <span className="text-[8px] font-semibold text-ink tabular-nums leading-none shrink-0 h-2.5">
                  {t.revenue > 0 ? (t.revenue >= 1000 ? `${(t.revenue / 1000).toFixed(t.revenue >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : Math.round(t.revenue)) : ""}
                </span>
                {/* fixed-height bar track so the % bar height actually resolves */}
                <div className="flex-1 w-full flex items-end">
                  <div className="w-full rounded-t bg-brand/80 group-hover:bg-brand transition-colors" style={{ height: `${Math.max(2, (t.revenue / maxRev) * 100)}%` }} />
                </div>
                <span className="text-[9px] text-muted shrink-0">{t.d.slice(8)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
