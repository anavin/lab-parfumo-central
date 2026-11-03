import { q } from "./db";
import { normalizeNation } from "./nation";
import { stockLive } from "./queries";

// สาขาที่ขายจริง (EVENT_SCS นับเป็น SCS) — ใช้กรองสาขาให้ตรงกับที่อื่นในระบบ
const BR = `upper(case when source='EVENT_SCS' then 'SCS' else coalesce(nullif(source,''),'CTW') end)`;
// รหัสบิล = เลขใบเสร็จ > order_no > id (กันบิลคนละใบถูกนับรวมกัน) ตามกติกาเดียวกับทั้งระบบ
const BILL = `coalesce(nullif(receipt_no,''), order_no, 's'||id::text)`;

export type AnalyticsKpis = {
  revenue: number; qty: number; bills: number; items_per_bill: number;
  aov: number; per_item: number; discount: number; gross: number; discount_rate: number;
  days: number; per_day: number;
};
export type ScentRow = { scent: string; qty: number; revenue: number; bills: number };
export type SizeRow = { size: string; qty: number; revenue: number; bills: number };
export type HourRow = { hour: number; revenue: number; qty: number; bills: number };
export type WeekdayRow = { dow: number; revenue: number; qty: number; bills: number };
export type StaffRow = { staff: string; revenue: number; qty: number; bills: number; aov: number };
export type DailyRow = { d: string; revenue: number; bills: number; qty: number };
export type ChannelRow = { channel: string; revenue: number; n: number };
export type NationRow = { nation: string; revenue: number; bills: number };
export type StaffDailyRow = { d: string; staff: string; revenue: number; bills: number; qty: number };
export type ScentSizeRow = { scent: string; size: string; qty: number; revenue: number };
export type HeatCell = { dow: number; hour: number; revenue: number; bills: number };
export type DeadStockRow = { barcode: string; scent: string; size: string; remaining: number; soldPeriod: number; lastSold: string | null; daysIdle: number | null };

export type SalesAnalytics = {
  kpis: AnalyticsKpis;
  scents: ScentRow[]; sizes: SizeRow[]; hours: HourRow[]; weekdays: WeekdayRow[];
  staff: StaffRow[]; daily: DailyRow[]; payments: ChannelRow[]; nations: NationRow[];
  staffDaily: StaffDailyRow[]; scentSize: ScentSizeRow[]; heatmap: HeatCell[];
};

const EMPTY: SalesAnalytics = {
  kpis: { revenue: 0, qty: 0, bills: 0, items_per_bill: 0, aov: 0, per_item: 0, discount: 0, gross: 0, discount_rate: 0, days: 0, per_day: 0 },
  scents: [], sizes: [], hours: [], weekdays: [], staff: [], daily: [], payments: [], nations: [], staffDaily: [], scentSize: [], heatmap: [],
};

// คำนวณ KPI ที่ต่อยอด (เฉลี่ย ฯลฯ) จากตัวเลขดิบ — ใช้ร่วมทั้งช่วงหลักและช่วงเทียบ
function deriveKpis(k?: { revenue: number; qty: number; bills: number; discount: number; days: number }): AnalyticsKpis {
  const revenue = k?.revenue ?? 0, qty = k?.qty ?? 0, bills = k?.bills ?? 0, discount = k?.discount ?? 0, days = k?.days ?? 0;
  const gross = revenue + discount;
  return {
    revenue, qty, bills, discount, days, gross,
    aov: bills ? revenue / bills : 0,
    per_item: qty ? revenue / qty : 0,
    items_per_bill: bills ? qty / bills : 0,
    discount_rate: gross ? discount / gross : 0,
    per_day: days ? revenue / days : 0,
  };
}

const KPI_COLS = `coalesce(sum(total),0)::float revenue, coalesce(sum(qty),0)::float qty,
                  count(distinct ${BILL})::int bills, coalesce(sum(discount),0)::float discount,
                  count(distinct sale_date)::int days`;

/** รัน query หลายตัวแบบจำกัดจำนวนพร้อมกัน — prod pool เล็ก (max 3) ยิงพรวดเดียวจะคอขวด/ทามเอาต์.
 *  size=2 เว้นคอนเนกชันไว้ให้คำขออื่น. คืนผลลัพธ์ตามลำดับเดิมของ tasks. */
async function runLimited(tasks: (() => Promise<any>)[], size = 2): Promise<any[]> {
  const out = new Array(tasks.length);
  let next = 0;
  const worker = async () => { while (next < tasks.length) { const i = next++; out[i] = await tasks[i](); } };
  await Promise.all(Array.from({ length: Math.min(size, tasks.length) }, worker));
  return out;
}

/** KPI อย่างเดียว (query เดียว) — ใช้ดึง "ช่วงก่อนหน้า" มาเทียบ โดยไม่ต้องดึงทั้งชุด. */
export async function analyticsKpis(branch: string | null, from: string, to: string): Promise<AnalyticsKpis> {
  const a: (string | null)[] = [from, to, branch];
  const W = `sale_date is not null and sale_date between $1 and $2 and ($3::text is null or ${BR} = upper($3))`;
  try {
    const [k] = await q<{ revenue: number; qty: number; bills: number; discount: number; days: number }>(
      `select ${KPI_COLS} from sales where ${W}`, a);
    return deriveKpis(k);
  } catch (e: any) { if (e?.code === "42P01") return deriveKpis(undefined); throw e; }
}

/** วิเคราะห์การขายจากตาราง `sales` (ที่อนุมัติแล้ว) ในช่วงวันที่ + สาขา.
 *  branch = null → ทุกสาขา. from/to = 'YYYY-MM-DD' (รวมปลายช่วง). */
export async function salesAnalytics(branch: string | null, from: string, to: string): Promise<SalesAnalytics> {
  const a: (string | null)[] = [from, to, branch];
  // WHERE ร่วม (ตาราง sales ไม่มี alias)
  const W = `sale_date is not null and sale_date between $1 and $2 and ($3::text is null or ${BR} = upper($3))`;
  // เวอร์ชัน alias s. (สำหรับ query ที่ต้อง join)
  const Ws = `s.sale_date is not null and s.sale_date between $1 and $2 and ($3::text is null or upper(case when s.source='EVENT_SCS' then 'SCS' else coalesce(nullif(s.source,''),'CTW') end) = upper($3))`;
  const BILLs = `coalesce(nullif(s.receipt_no,''), s.order_no, 's'||s.id::text)`;

  try {
    const [kRows, scents, sizes, hours, weekdays, staff, daily, payments, nations, staffDaily, scentSize, heatmap] = await runLimited([
      () => q<{ revenue: number; qty: number; bills: number; discount: number; days: number }>(
        `select ${KPI_COLS} from sales where ${W}`, a),
      () => q<ScentRow>(
        `select coalesce(nullif(p.scent,''), nullif(s.item,''), 'ไม่ระบุ') scent,
                round(sum(s.qty))::float qty, round(sum(s.total))::float revenue, count(distinct ${BILLs})::int bills
         from sales s left join products p on p.id = s.product_id
         where ${Ws} group by 1 order by revenue desc nulls last limit 20`, a),
      () => q<SizeRow>(
        `select coalesce(nullif(size,''),'ไม่ระบุ') size, round(sum(qty))::float qty,
                round(sum(total))::float revenue, count(distinct ${BILL})::int bills
         from sales where ${W} group by 1 order by revenue desc nulls last`, a),
      () => q<HourRow>(
        `select extract(hour from sale_time)::int as "hour", round(sum(total))::float revenue,
                round(sum(qty))::float qty, count(distinct ${BILL})::int bills
         from sales where ${W} and sale_time is not null group by 1 order by 1`, a),
      () => q<WeekdayRow>(
        `select extract(dow from sale_date)::int dow, round(sum(total))::float revenue,
                round(sum(qty))::float qty, count(distinct ${BILL})::int bills
         from sales where ${W} group by 1 order by 1`, a),
      () => q<StaffRow>(
        `select coalesce(nullif(u.full_name,''), nullif(s.ba,''), 'ไม่ระบุ') staff,
                round(sum(s.total))::float revenue, round(sum(s.qty))::float qty, count(distinct ${BILLs})::int bills,
                (sum(s.total) / nullif(count(distinct ${BILLs}),0))::float aov
         from sales s left join users u on u.id = s.created_by
         where ${Ws} group by 1 order by revenue desc nulls last`, a),
      () => q<DailyRow>(
        `select sale_date::text d, round(sum(total))::float revenue, count(distinct ${BILL})::int bills, round(sum(qty))::float qty
         from sales where ${W} group by sale_date order by sale_date`, a),
      () => q<ChannelRow>(
        `select coalesce(nullif(payment_channel,''),'ไม่ระบุ') channel, round(sum(total))::float revenue, count(*)::int n
         from sales where ${W} group by 1 order by revenue desc nulls last`, a),
      () => q<NationRow>(
        `select coalesce(nullif(nation,''),'ไม่ระบุ') nation, round(sum(total))::float revenue, count(distinct ${BILL})::int bills
         from sales where ${W} group by 1 order by revenue desc nulls last`, a),
      () => q<StaffDailyRow>(
        `select sale_date::text d, coalesce(nullif(u.full_name,''), nullif(s.ba,''), 'ไม่ระบุ') staff,
                round(sum(s.total))::float revenue, count(distinct ${BILLs})::int bills, round(sum(s.qty))::float qty
         from sales s left join users u on u.id = s.created_by
         where ${Ws} group by 1, 2 order by d`, a),
      () => q<ScentSizeRow>(
        `select coalesce(nullif(p.scent,''), nullif(s.item,''), 'ไม่ระบุ') scent,
                coalesce(nullif(s.size,''),'ไม่ระบุ') size, round(sum(s.qty))::float qty, round(sum(s.total))::float revenue
         from sales s left join products p on p.id = s.product_id
         where ${Ws} group by 1, 2`, a),
      () => q<HeatCell>(
        `select extract(dow from sale_date)::int dow, extract(hour from sale_time)::int as "hour",
                round(sum(total))::float revenue, count(distinct ${BILL})::int bills
         from sales where ${W} and sale_time is not null group by 1, 2`, a),
    ], 2) as [
      { revenue: number; qty: number; bills: number; discount: number; days: number }[],
      ScentRow[], SizeRow[], HourRow[], WeekdayRow[], StaffRow[], DailyRow[], ChannelRow[], NationRow[], StaffDailyRow[], ScentSizeRow[], HeatCell[],
    ];
    const k = kRows[0];

    // รวมสัญชาติที่สะกดต่างกันให้เป็นค่าเดียว (normalize) — ค่าว่างใน SQL = 'ไม่ระบุ' คงไว้
    const natMap = new Map<string, NationRow>();
    for (const r of nations) {
      const key = r.nation === "ไม่ระบุ" ? "ไม่ระบุ" : (normalizeNation(r.nation) || "ไม่ระบุ");
      const e = natMap.get(key) ?? { nation: key, revenue: 0, bills: 0 };
      e.revenue += r.revenue; e.bills += r.bills; natMap.set(key, e);
    }
    const nationsNorm = [...natMap.values()].sort((x, y) => y.revenue - x.revenue);

    const kpis = deriveKpis(k);
    return { kpis, scents, sizes, hours, weekdays, staff, daily, payments, nations: nationsNorm, staffDaily, scentSize, heatmap };
  } catch (e: any) {
    if (e?.code === "42P01") return EMPTY;   // ตาราง sales/products ยังไม่มี (เครื่อง dev ใหม่)
    throw e;
  }
}

/** สินค้าขายช้า/ไม่ขยับ — ของที่ยังมีสต๊อก (remaining>0) เรียงจาก "ขายได้น้อย/ไม่ขายนานสุด" ก่อน.
 *  soldPeriod = ขายได้ในช่วงที่เลือก · lastSold = ขายล่าสุด (นับทุกช่วง) · daysIdle = ไม่ขายมากี่วัน. */
export async function deadStock(branch: string | null, from: string, to: string, limit = 40): Promise<DeadStockRow[]> {
  try {
    const live = await stockLive(branch);                       // ของคงเหลือต่อบาร์โค้ด (สาขาที่เลือก/รวม)
    const onHand = live.filter((r) => (Number(r.remaining) || 0) > 0);
    if (!onHand.length) return [];
    // ยอดขายต่อบาร์โค้ด: ในช่วง + วันขายล่าสุด (ทุกช่วง) ของสาขาที่เลือก
    const rows = await q<{ barcode: string; sold_period: number; last_sold: string | null }>(
      `select barcode,
              coalesce(sum(qty) filter (where sale_date between $2 and $3),0)::float sold_period,
              max(sale_date)::text last_sold
       from sales
       where barcode is not null and sale_date is not null
         and ($1::text is null or ${BR} = upper($1))
       group by barcode`, [branch, from, to]);
    const byBc = new Map(rows.map((r) => [r.barcode, r]));
    const today = new Date();
    const daysBetween = (iso: string | null) => {
      if (!iso) return null;
      const d = Math.round((today.getTime() - new Date(iso + "T00:00:00Z").getTime()) / 86400000);
      return d < 0 ? 0 : d;
    };
    return onHand
      .map((r) => {
        const s = byBc.get(r.barcode);
        return {
          barcode: r.barcode, scent: r.scent, size: r.size, remaining: Math.round(Number(r.remaining) || 0),
          soldPeriod: Math.round(Number(s?.sold_period) || 0),
          lastSold: s?.last_sold ?? null, daysIdle: daysBetween(s?.last_sold ?? null),
        };
      })
      // ช้าสุดก่อน: ขายในช่วงน้อยสุด → ไม่ขายนานสุด → ของค้างเยอะสุด
      .sort((x, y) => x.soldPeriod - y.soldPeriod
        || (y.daysIdle ?? 9e9) - (x.daysIdle ?? 9e9)
        || y.remaining - x.remaining)
      .slice(0, limit);
  } catch (e: any) {
    if (e?.code === "42P01") return [];
    throw e;
  }
}
