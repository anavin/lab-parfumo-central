import { Suspense } from "react";
import {
  LayoutDashboard, Wallet, TrendingUp, ShoppingBag, Users, Package, Coins,
  ReceiptText, ShoppingCart, UserRound, Percent, AlertTriangle,
} from "lucide-react";
import { PageHeader, Stat, Card, Badge, Hint } from "@/components/ui";
import { RevenueCustomersCombo, Donut, Columns, GradeColumns } from "@/components/charts";
import { BarList } from "@/components/BarList";
import { TopScentsCard } from "@/components/TopScentsCard";
import { BAList } from "@/components/BAList";
import { LowStockList } from "@/components/LowStockList";
import { DashboardFilters } from "@/components/DashboardFilters";
import { baht, num, compactBaht } from "@/lib/format";
import {
  kpis, monthlyRevenue, monthlyCustomers, topScents, sizeMix,
  paymentMix, nationMix, byBA, stockSummary, getMonths,
  dailyRevenue, dailyCustomers, salesStats, gradeMix, salesByDow, salesByHour,
  stockLive, type Filter,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

const PERIOD_N: Record<string, number> = { "1m": 1, "3m": 3, "6m": 6, "12m": 12 };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ period?: string; source?: string; month?: string }> }) {
  const sp = await searchParams;
  const allMonths = await getMonths();
  // a specific month takes precedence over the period preset
  const singleMonth = sp.month && allMonths.includes(sp.month) ? sp.month : null;
  const months = singleMonth
    ? [singleMonth]
    : (PERIOD_N[sp.period ?? "all"] ? allMonths.slice(-PERIOD_N[sp.period!]) : null); // null = all
  const source = sp.source && sp.source !== "all" ? sp.source : null;
  const f: Filter = { months, source };

  const [k, rev, cust, scents, sizes, pay, nation, ba, stock, dRev, dCust,
         sstats, grades, dow, hours, stockAll] = await Promise.all([
    kpis(f), monthlyRevenue(f), monthlyCustomers(f), topScents(f, 500),
    sizeMix(f), paymentMix(f), nationMix(f), byBA(f), stockSummary(source),
    singleMonth ? dailyRevenue(singleMonth, source) : Promise.resolve([]),
    singleMonth ? dailyCustomers(singleMonth, source) : Promise.resolve([]),
    salesStats(f), gradeMix(f), salesByDow(f), salesByHour(f), stockLive(source),
  ]);

  // sales efficiency — per-bill metrics use receipted-only figures (บิลที่มีเลขใบเสร็จ)
  const aov = k.receipts ? k.revReceipted / k.receipts : 0;
  const basket = k.receipts ? k.qtyReceipted / k.receipts : 0;
  const perCust = k.customers ? k.revenue / k.customers : 0;
  const gross = sstats.revenue + sstats.discount;
  const discRate = gross ? (sstats.discount / gross) * 100 : 0;

  // day-of-week (Mon→Sun) and hour-of-day
  const DOW_TH = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."]; // index = pg dow (0=Sun)
  const dowMap = new Map(dow.map((d) => [d.dow, d.revenue]));
  const dowData = [1, 2, 3, 4, 5, 6, 0].map((i) => ({ label: DOW_TH[i], value: dowMap.get(i) ?? 0 }));
  const bestDow = dowData.reduce((a, b) => (b.value > a.value ? b : a), dowData[0]);
  const hourData = hours.map((h) => ({ label: `${h.hr}:00`, value: h.revenue }));
  const bestHour = hourData.reduce((a, b) => (b && a && b.value > a.value ? b : a), hourData[0]);

  const gr = grades.filter((g) => g.revenue > 0);
  const gradeRevTot = gr.reduce((a, g) => a + g.revenue, 0) || 1;
  const gradeQtyTot = gr.reduce((a, g) => a + g.qty, 0) || 1;
  // nationality coverage — most sales aren't tagged with a nationality
  const nationAll = nation.reduce((a, n) => a + n.n, 0) || 1;
  const nationTagged = nation.filter((n) => n.nation !== "ไม่ระบุ").reduce((a, n) => a + n.n, 0);
  const nationCov = Math.round((nationTagged / nationAll) * 100);

  const gradeCols = gr.map((g) => ({
    label: g.grade, revenue: g.revenue, qty: g.qty,
    revenuePct: (g.revenue / gradeRevTot) * 100, qtyPct: (g.qty / gradeQtyTot) * 100,
  }));

  // When a single month is selected, the trend chart shows daily data.
  const daily = !!singleMonth;
  const revData = daily ? dRev : rev;
  const custData = daily ? dCust : cust;
  const xKey = daily ? "label" : "month";
  // merge revenue + customers into one series for the combo chart
  const custMap = new Map(custData.map((c: any) => [c[xKey], c.customers]));
  const combo = revData.map((r: any) => ({ x: r[xKey], revenue: r.revenue, customers: custMap.get(r[xKey]) ?? 0 }));

  // Size mix — keep the 3 main pack sizes, fold the rest into "อื่นๆ".
  const MAIN = ["50 ml.", "30 ml.", "10 ml."];
  const mainSizes = MAIN.map((m) => ({ name: m, value: sizes.find((s) => s.size === m)?.revenue ?? 0 }));
  const otherVal = sizes.filter((s) => !MAIN.includes(s.size) && s.revenue > 0).reduce((a, s) => a + s.revenue, 0);
  const sizeData = [...mainSizes, ...(otherVal > 0 ? [{ name: "อื่นๆ", value: otherVal }] : [])].filter((d) => d.value > 0);
  // Units sold per size (complements the revenue donut).
  const otherUnits = sizes.filter((s) => !MAIN.includes(s.size) && s.qty > 0).reduce((a, s) => a + s.qty, 0);
  const sizeUnits = [
    ...MAIN.map((m) => ({ label: m, value: sizes.find((s) => s.size === m)?.qty ?? 0 })),
    ...(otherUnits > 0 ? [{ label: "อื่นๆ", value: otherUnits }] : []),
  ].filter((d) => d.value > 0);

  const monthCount = rev.length;
  const avgMonth = monthCount ? k.revenue / monthCount : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader icon={LayoutDashboard} title="แดชบอร์ด"
        subtitle={rev.length ? `ภาพรวมยอดขาย · ${rev[0]?.month} – ${rev.at(-1)?.month}` : "ไม่มีข้อมูลในช่วงที่เลือก"}
        action={<Suspense fallback={<div className="h-9" />}><DashboardFilters months={allMonths} /></Suspense>} />

      {/* KPI row — 4 headline metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-7">
        <Stat icon={Wallet} label="รายได้รวม" value={compactBaht(k.revenue)} sub={`${num(k.receipts)} ใบเสร็จ`} tone="brand"
          hint="ยอดขายรวมทั้งหมด (หลังหักส่วนลด) จากทุกใบเสร็จในช่วงที่เลือก" />
        <Stat icon={TrendingUp} label="เฉลี่ย/เดือน" value={compactBaht(avgMonth)} sub={`${monthCount} เดือน`} tone="brand"
          hint="รายได้รวม ÷ จำนวนเดือนที่มีข้อมูล" />
        <Stat icon={ShoppingBag} label="จำนวนขาย" value={num(k.qty)} sub="ชิ้น"
          hint="จำนวนชิ้นสินค้าที่ขายได้รวมทั้งหมด" />
        <Stat icon={ReceiptText} label="ยอดเฉลี่ย/บิล (AOV)" value={baht(aov)} sub={`${num(k.receipts)} ใบเสร็จ`} tone="brand"
          hint="Average Order Value = ยอดเฉลี่ยต่อ 1 ใบเสร็จ · นับเฉพาะรายการที่มีเลขใบเสร็จ (รายได้ ÷ จำนวนบิล)" />
      </div>

      {/* secondary metrics */}
      <SectionTitle>ประสิทธิภาพการขาย</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-7">
        <Stat icon={ShoppingCart} label="ชิ้น/บิล" value={basket.toFixed(1)} sub="ชิ้นต่อใบเสร็จ"
          hint="จำนวนชิ้นเฉลี่ยต่อ 1 ใบเสร็จ · นับเฉพาะรายการที่มีเลขใบเสร็จ" />
        <Stat icon={UserRound} label="ยอดเฉลี่ย/ลูกค้า" value={baht(perCust)} sub={`${num(k.customers)} ราย`} tone="brand"
          hint="รายได้รวม ÷ จำนวนลูกค้า (จากบันทึกลูกค้ารายวัน)" />
        <Stat icon={Users} label="ลูกค้าสะสม" value={num(k.customers)} sub="ราย" tone="info"
          hint="จำนวนลูกค้าที่เข้าร้านสะสม จากบันทึกลูกค้ารายวัน" />
        <Stat icon={Percent} label="ส่วนลดรวม" value={compactBaht(sstats.discount)} sub={`${discRate.toFixed(1)}% ของราคาเต็ม`} tone="warn"
          hint="ส่วนลดที่ให้ลูกค้ารวม · % เทียบราคาเต็ม (ก่อนหักส่วนลด)" />
        <Stat icon={Coins} label="เงินสดสะสม" value={compactBaht(k.cash)} sub="Cash" tone="brand"
          hint="ยอดเงินสดหน้าร้าน/เงินสดย่อยสะสมทั้งหมด" />
        <Stat icon={Package} label="สต๊อกคงเหลือ" value={num(stock.remaining)} sub={`${stock.out} SKU หมด`} tone={stock.out > 0 ? "danger" : "default"}
          hint="คงเหลือ = ยอดเบิก(ส่งไปสาขา) − ยอดขาย · นับรวมทุกสินค้า" />
      </div>

      {/* trends — revenue + customers combined (dual axis) */}
      <SectionTitle>{daily ? `แนวโน้มรายวัน · ${singleMonth}` : "แนวโน้มรายเดือน"}</SectionTitle>
      <div className="mb-7">
        <Card title={daily ? "รายได้ & ลูกค้า (รายวัน)" : "รายได้ & ลูกค้า (รายเดือน)"}
          subtitle="เปรียบเทียบรายได้ (฿) กับจำนวนลูกค้า (ราย)" bodyClass="h-80">
          <RevenueCustomersCombo data={combo} />
        </Card>
      </div>

      {/* timing — day of week + hour of day */}
      <SectionTitle>ช่วงเวลาขาย</SectionTitle>
      <div className="grid lg:grid-cols-2 gap-4 mb-7">
        <Card title="ยอดขายตามวันในสัปดาห์" subtitle={`ขายดีสุด: ${bestDow?.label ?? "-"}`} bodyClass="h-60">
          <Columns data={dowData} highlight={bestDow?.label} />
        </Card>
        <Card title="ยอดขายตามช่วงเวลา" subtitle={hourData.length ? `ชั่วโมงพีค: ${bestHour?.label ?? "-"} · จากข้อมูลที่มีเวลา` : "ไม่มีข้อมูลเวลา"} bodyClass="h-60">
          <Columns data={hourData} highlight={bestHour?.label} />
        </Card>
      </div>

      {/* product + mix — Top 15 scents (wide) + size donut (narrow) */}
      <SectionTitle>สินค้าและสัดส่วน</SectionTitle>
      <div className="grid lg:grid-cols-3 gap-4 mb-7">
        <TopScentsCard data={scents} className="lg:col-span-2" />
        <div className="flex flex-col gap-4">
          <Card title="สัดส่วนตามขนาด" subtitle="รายได้แยกตามขนาดบรรจุ">
            <Donut data={sizeData} money centerLabel="รายได้รวม" />
          </Card>
          <Card title="ยอดขายรายขนาด" subtitle="จำนวนชิ้นต่อขนาด">
            <BarList data={sizeUnits} money={false} labelWidth={64} theme="brand" />
          </Card>
        </div>
      </div>

      {/* grade + low stock */}
      <SectionTitle>ประเภทสินค้า & สต๊อก</SectionTitle>
      <div className="grid lg:grid-cols-3 gap-4 mb-7">
        <Card title="สัดส่วนตามเกรด" subtitle="รายได้ & จำนวน แยกตามเกรด (% ของยอดรวม)" className="lg:col-span-2" fill bodyClass="min-h-[18rem]">
          <GradeColumns data={gradeCols} />
        </Card>
        <Card title="สต๊อกใกล้หมด" subtitle="เรียงจากคงเหลือน้อยสุด · กดดูทั้งหมดได้" fill bodyClass="min-h-[18rem]">
          <LowStockList data={stockAll} />
        </Card>
      </div>

      {/* payment + nation + BA */}
      <SectionTitle>ช่องทางและทีมขาย</SectionTitle>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="ช่องทางชำระเงิน" subtitle="รายได้ตามช่องทาง">
          <BarList data={pay.map((p) => ({ label: p.channel, value: p.revenue }))} labelWidth={132} theme="brand" />
        </Card>
        <Card title="สัญชาติลูกค้า" subtitle={`รายได้ & AOV ตามสัญชาติ · ระบุสัญชาติ ${nationCov}% ของรายการ`}>
          <table className="w-full text-sm">
            <thead><tr className="th border-b border-line-soft">
              <th className="pb-2">สัญชาติ</th>
              <th className="pb-2 text-right">รายได้</th>
              <th className="pb-2 text-right"><span className="inline-flex items-center gap-1">AOV<Hint text="Average Order Value = ยอดเฉลี่ยต่อ 1 ใบเสร็จของสัญชาตินั้น · นับเฉพาะรายการที่มีเลขใบเสร็จ" /></span></th>
            </tr></thead>
            <tbody>
              {nation.map((n) => {
                const unspec = n.nation === "ไม่ระบุ";
                return (
                  <tr key={n.nation} className="border-b border-line-soft last:border-0">
                    <td className="py-2.5">
                      {unspec ? <span className="text-[11px] text-muted-soft">ไม่ระบุ</span>
                        : <Badge tone={n.nation === "Foreign" ? "info" : "brand"}>{n.nation}</Badge>}
                    </td>
                    <td className={`py-2.5 text-right tabular-nums ${unspec ? "text-muted" : "font-semibold"}`}>{baht(n.revenue)}</td>
                    <td className="py-2.5 text-right text-muted tabular-nums">{baht(n.receipts ? n.revReceipted / n.receipts : 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <Card title="ยอดขายตาม BA" subtitle="พนักงานขายรายคน">
          <BAList data={ba} />
        </Card>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[13px] font-semibold text-muted uppercase tracking-wide mb-3">{children}</h2>;
}
