import { q } from "./db";
import { normalizeNation } from "./nation";

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

export type SalesAnalytics = {
  kpis: AnalyticsKpis;
  scents: ScentRow[]; sizes: SizeRow[]; hours: HourRow[]; weekdays: WeekdayRow[];
  staff: StaffRow[]; daily: DailyRow[]; payments: ChannelRow[]; nations: NationRow[];
};

const EMPTY: SalesAnalytics = {
  kpis: { revenue: 0, qty: 0, bills: 0, items_per_bill: 0, aov: 0, per_item: 0, discount: 0, gross: 0, discount_rate: 0, days: 0, per_day: 0 },
  scents: [], sizes: [], hours: [], weekdays: [], staff: [], daily: [], payments: [], nations: [],
};

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
    const [[k], scents, sizes, hours, weekdays, staff, daily, payments, nations] = await Promise.all([
      q<{ revenue: number; qty: number; bills: number; discount: number; days: number }>(
        `select coalesce(sum(total),0)::float revenue, coalesce(sum(qty),0)::float qty,
                count(distinct ${BILL})::int bills, coalesce(sum(discount),0)::float discount,
                count(distinct sale_date)::int days
         from sales where ${W}`, a),
      q<ScentRow>(
        `select coalesce(nullif(p.scent,''), nullif(s.item,''), 'ไม่ระบุ') scent,
                sum(s.qty)::float qty, sum(s.total)::float revenue, count(distinct ${BILLs})::int bills
         from sales s left join products p on p.id = s.product_id
         where ${Ws} group by 1 order by revenue desc nulls last limit 20`, a),
      q<SizeRow>(
        `select coalesce(nullif(size,''),'ไม่ระบุ') size, sum(qty)::float qty,
                sum(total)::float revenue, count(distinct ${BILL})::int bills
         from sales where ${W} group by 1 order by revenue desc nulls last`, a),
      q<HourRow>(
        `select extract(hour from sale_time)::int hour, sum(total)::float revenue,
                sum(qty)::float qty, count(distinct ${BILL})::int bills
         from sales where ${W} and sale_time is not null group by 1 order by 1`, a),
      q<WeekdayRow>(
        `select extract(dow from sale_date)::int dow, sum(total)::float revenue,
                sum(qty)::float qty, count(distinct ${BILL})::int bills
         from sales where ${W} group by 1 order by 1`, a),
      q<StaffRow>(
        `select coalesce(nullif(u.full_name,''), nullif(s.ba,''), 'ไม่ระบุ') staff,
                sum(s.total)::float revenue, sum(s.qty)::float qty, count(distinct ${BILLs})::int bills,
                (sum(s.total) / nullif(count(distinct ${BILLs}),0))::float aov
         from sales s left join users u on u.id = s.created_by
         where ${Ws} group by 1 order by revenue desc nulls last`, a),
      q<DailyRow>(
        `select sale_date::text d, sum(total)::float revenue, count(distinct ${BILL})::int bills, sum(qty)::float qty
         from sales where ${W} group by sale_date order by sale_date`, a),
      q<ChannelRow>(
        `select coalesce(nullif(payment_channel,''),'ไม่ระบุ') channel, sum(total)::float revenue, count(*)::int n
         from sales where ${W} group by 1 order by revenue desc nulls last`, a),
      q<NationRow>(
        `select coalesce(nullif(nation,''),'ไม่ระบุ') nation, sum(total)::float revenue, count(distinct ${BILL})::int bills
         from sales where ${W} group by 1 order by revenue desc nulls last`, a),
    ]);

    // รวมสัญชาติที่สะกดต่างกันให้เป็นค่าเดียว (normalize) — ค่าว่างใน SQL = 'ไม่ระบุ' คงไว้
    const natMap = new Map<string, NationRow>();
    for (const r of nations) {
      const key = r.nation === "ไม่ระบุ" ? "ไม่ระบุ" : (normalizeNation(r.nation) || "ไม่ระบุ");
      const e = natMap.get(key) ?? { nation: key, revenue: 0, bills: 0 };
      e.revenue += r.revenue; e.bills += r.bills; natMap.set(key, e);
    }
    const nationsNorm = [...natMap.values()].sort((x, y) => y.revenue - x.revenue);

    const revenue = k?.revenue ?? 0, qty = k?.qty ?? 0, bills = k?.bills ?? 0;
    const discount = k?.discount ?? 0, days = k?.days ?? 0;
    const gross = revenue + discount;
    const kpis: AnalyticsKpis = {
      revenue, qty, bills, discount, days, gross,
      aov: bills ? revenue / bills : 0,
      per_item: qty ? revenue / qty : 0,
      items_per_bill: bills ? qty / bills : 0,
      discount_rate: gross ? discount / gross : 0,
      per_day: days ? revenue / days : 0,
    };
    return { kpis, scents, sizes, hours, weekdays, staff, daily, payments, nations: nationsNorm };
  } catch (e: any) {
    if (e?.code === "42P01") return EMPTY;   // ตาราง sales/products ยังไม่มี (เครื่อง dev ใหม่)
    throw e;
  }
}
