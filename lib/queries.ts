import { q } from "./db";
import { SPLIT2 } from "@/lib/payments";

// ---- filters --------------------------------------------------------------
// months: subset of month labels ('Nov-25') to include, or null = all.
// source: 'CTW' | 'EVENT_SCS' | null = all.
export type Filter = { months: string[] | null; source: string | null };
export const ALL: Filter = { months: null, source: null };

// WHERE fragment for the `sales` table using $1 = months[], $2 = source.
const SW = `($1::text[] is null or month = any($1)) and ($2::text is null or source = $2)`;
// same but for an aliased sales table (s.)
const SWs = `($1::text[] is null or s.month = any($1)) and ($2::text is null or s.source = $2)`;
// months-only fragment ($1) for date tables without a source column.
const MW = `($1::text[] is null or month = any($1))`;

/** Ordered month labels (oldest→newest) — used to resolve period presets. */
export function getMonths() {
  return q<{ month: string }>(
    `select month from sales where month is not null group by month order by min(sale_date)`,
  ).then((r) => r.map((x) => x.month));
}

// ---- KPIs -----------------------------------------------------------------
export async function kpis(f: Filter = ALL) {
  // revReceipted/qtyReceipted exclude sales with no receipt number, so per-bill
  // metrics (AOV, ชิ้น/บิล) use a numerator consistent with the bill count.
  const [rev] = await q<{ revenue: number; qty: number; receipts: number; revReceipted: number; qtyReceipted: number }>(`
    select coalesce(sum(total),0)::float revenue,
           coalesce(sum(qty),0)::float   qty,
           count(distinct receipt_no)    receipts,
           coalesce(sum(total) filter (where receipt_no is not null),0)::float "revReceipted",
           coalesce(sum(qty)   filter (where receipt_no is not null),0)::float "qtyReceipted"
    from sales where ${SW}`, [f.months, f.source]);
  const [cust] = await q<{ customers: number; sell: number }>(`
    select coalesce(sum(customers),0)::int customers,
           coalesce(sum(sell_amount),0)::float sell
    from daily_customers where ${MW}`, [f.months]);
  const [cash] = await q<{ total: number }>(
    `select coalesce(sum(amount),0)::float total from cash_entries
     where ($1::text[] is null or to_char(cash_date,'Mon-YY') = any($1))`, [f.months]);
  const [prod] = await q<{ n: number }>(`select count(*)::int n from products`);
  const [po] = await q<{ n: number }>(`select count(*)::int n from purchase_orders`);
  return {
    revenue: rev.revenue, qty: rev.qty, receipts: rev.receipts,
    revReceipted: rev.revReceipted, qtyReceipted: rev.qtyReceipted,
    customers: cust.customers, cash: cash.total, products: prod.n, pos: po.n,
  };
}

// ---- monthly trend --------------------------------------------------------
export function monthlyRevenue(f: Filter = ALL) {
  return q<{ month: string; revenue: number; qty: number; receipts: number }>(`
    select month, sum(total)::float revenue, sum(qty)::float qty,
           count(distinct receipt_no) receipts
    from sales where month is not null and ${SW}
    group by month order by min(sale_date)`, [f.months, f.source]);
}

export function monthlyCustomers(f: Filter = ALL) {
  return q<{ month: string; customers: number; sell: number }>(`
    select month, sum(customers)::int customers, sum(sell_amount)::float sell
    from daily_customers where month is not null and ${MW}
    group by month order by min(cust_date)`, [f.months]);
}

// ---- daily trend (for a single selected month) ----------------------------
export function dailyRevenue(month: string, source: string | null) {
  return q<{ label: string; revenue: number; qty: number }>(`
    select to_char(sale_date,'FMDD') label, sum(total)::float revenue, sum(qty)::float qty
    from sales
    where sale_date is not null and month = $1 and ($2::text is null or source = $2)
    group by sale_date order by sale_date`, [month, source]);
}

export function dailyCustomers(month: string) {
  return q<{ label: string; customers: number }>(`
    select to_char(cust_date,'FMDD') label, sum(customers)::int customers
    from daily_customers
    where cust_date is not null and month = $1
    group by cust_date order by cust_date`, [month]);
}

// ---- product performance --------------------------------------------------
export function topScents(f: Filter = ALL, limit = 12) {
  return q<{ scent: string; qty: number; revenue: number }>(`
    select coalesce(p.scent, s.item) scent,
           sum(s.qty)::float qty, sum(s.total)::float revenue
    from sales s left join products p on p.id = s.product_id
    where coalesce(p.scent, s.item) is not null and ${SWs}
    group by 1 order by revenue desc nulls last limit $3`, [f.months, f.source, limit]);
}

export function sizeMix(f: Filter = ALL) {
  return q<{ size: string; qty: number; revenue: number }>(`
    select coalesce(size,'อื่นๆ') size, sum(qty)::float qty, sum(total)::float revenue
    from sales where ${SW} group by 1 order by qty desc`, [f.months, f.source]);
}

export async function paymentMix(f: Filter = ALL) {
  // single-channel lines straight from sales (exclude the "จ่าย 2 ทาง" marker)
  const lines = await q<{ channel: string; revenue: number; n: number }>(`
    select coalesce(nullif(payment_channel,''),'ไม่ระบุ') channel,
           sum(total)::float revenue, count(*)::int n
    from sales where ${SW} and coalesce(payment_channel,'') <> $3
    group by 1`, [f.months, f.source, SPLIT2]);

  // per-channel amounts of split ("จ่าย 2 ทาง") bills, pulled from bill_payments for
  // the split bills in the filtered sales set — so the breakdown reflects the real
  // cash/card split instead of one lumped "จ่าย 2 ทาง" bucket.
  let split: { channel: string; revenue: number; n: number }[] = [];
  try {
    split = await q<{ channel: string; revenue: number; n: number }>(`
      select bp.channel, sum(bp.amount)::float revenue, count(*)::int n
      from bill_payments bp
      where bp.bill_ref in (
        select distinct receipt_no from sales
        where ${SW} and payment_channel = $3 and coalesce(receipt_no,'') <> '')
      group by 1`, [f.months, f.source, SPLIT2]);
  } catch (e) { if (!missingTable(e)) throw e; }

  const map = new Map<string, { revenue: number; n: number }>();
  for (const r of [...lines, ...split]) {
    const cur = map.get(r.channel) ?? { revenue: 0, n: 0 };
    cur.revenue += r.revenue ?? 0; cur.n += r.n ?? 0;
    map.set(r.channel, cur);
  }
  return [...map.entries()]
    .map(([channel, v]) => ({ channel, revenue: v.revenue, n: v.n }))
    .filter((c) => Math.round(c.revenue) !== 0)
    .sort((a, b) => b.revenue - a.revenue);
}

export function nationMix(f: Filter = ALL) {
  return q<{ nation: string; revenue: number; n: number; receipts: number; revReceipted: number }>(`
    select coalesce(nation,'ไม่ระบุ') nation, sum(total)::float revenue, count(*)::int n,
           count(distinct receipt_no)::int receipts,
           coalesce(sum(total) filter (where receipt_no is not null),0)::float "revReceipted"
    from sales where ${SW}
    group by coalesce(nation,'ไม่ระบุ')
    order by case coalesce(nation,'ไม่ระบุ') when 'ไม่ระบุ' then 1 else 0 end, sum(total) desc`,
    [f.months, f.source]);
}

// ---- extra angles ---------------------------------------------------------
export async function salesStats(f: Filter = ALL) {
  const [r] = await q<{ revenue: number; qty: number; receipts: number; discount: number }>(`
    select coalesce(sum(total),0)::float revenue, coalesce(sum(qty),0)::float qty,
           count(distinct receipt_no)::int receipts, coalesce(sum(discount),0)::float discount
    from sales where ${SW}`, [f.months, f.source]);
  return r;
}

export function gradeMix(f: Filter = ALL) {
  return q<{ grade: string; qty: number; revenue: number }>(`
    select coalesce(grade,'ไม่ระบุ') grade, sum(qty)::float qty, sum(total)::float revenue
    from sales where ${SW} group by 1 order by revenue desc`, [f.months, f.source]);
}

export function salesByDow(f: Filter = ALL) {
  return q<{ dow: number; revenue: number; qty: number }>(`
    select extract(dow from sale_date)::int dow, sum(total)::float revenue, sum(qty)::float qty
    from sales where sale_date is not null and ${SW}
    group by 1 order by 1`, [f.months, f.source]);
}

export function salesByHour(f: Filter = ALL) {
  return q<{ hr: number; revenue: number; n: number }>(`
    select extract(hour from sale_time)::int hr, sum(total)::float revenue, count(*)::int n
    from sales where sale_time is not null and ${SW}
    group by 1 order by 1`, [f.months, f.source]);
}

export function byBA(f: Filter = ALL, limit = 10) {
  return q<{ ba: string; revenue: number; qty: number }>(`
    select ba, sum(total)::float revenue, sum(qty)::float qty
    from sales where ba is not null and ba <> '#N/A' and ${SW}
    group by ba order by revenue desc limit $3`, [f.months, f.source, limit]);
}

export function monthlyCash() {
  return q<{ month: string; total: number }>(`
    select to_char(cash_date,'Mon-YY') month, sum(amount)::float total
    from cash_entries where cash_date is not null
    group by to_char(cash_date,'Mon-YY'), date_trunc('month',cash_date)
    order by date_trunc('month',cash_date)`);
}

// ---- stock (computed live from requisitions − sales) ----------------------
const STOCK_CTE = `
  with ship as (
    select i.barcode, sum(i.qty)::float q from po_items i
    join purchase_orders po on po.id = i.po_id
    where i.barcode is not null and po.deleted_at is null group by i.barcode),
  sold as (
    select barcode, sum(qty)::float q from sales
    where barcode is not null group by barcode),
  ret as (
    select serial as barcode, count(*)::float q from return_items
    where serial is not null and receive_status='Returned' group by serial),
  stock as (
    select p.barcode, p.scent, p.size,
           coalesce(ship.q,0) shipped, coalesce(sold.q,0) sold,
           coalesce(ret.q,0) returned,
           -- returns go back to HQ (leave the branch), so subtract them from stock
           coalesce(ship.q,0) - coalesce(sold.q,0) - coalesce(ret.q,0) remaining
    from products p
    left join ship on ship.barcode = p.barcode
    left join sold on sold.barcode = p.barcode
    left join ret  on ret.barcode  = p.barcode
    where coalesce(ship.q,0) > 0 or coalesce(sold.q,0) > 0)
`;

export function stockLive() {
  return q<{ barcode: string; scent: string; size: string; shipped: number; sold: number; returned: number; remaining: number }>(
    `${STOCK_CTE} select * from stock order by remaining asc, scent`);
}

export async function stockSummary() {
  const [r] = await q<{ shipped: number; sold: number; remaining: number; skus: number; out: number; low: number }>(
    `${STOCK_CTE}
     select coalesce(sum(shipped),0)::float shipped,
            coalesce(sum(sold),0)::float sold,
            coalesce(sum(remaining),0)::float remaining,
            count(*)::int skus,
            count(*) filter (where remaining <= 0)::int out,
            count(*) filter (where remaining > 0 and remaining <= 3)::int low
     from stock`);
  return r;
}

// ---- audit + trash --------------------------------------------------------
/** Recent successful logins (last `days` days) for the user-management page. */
export function loginHistory(days = 5) {
  return q<{ user_name: string; user_role: string | null; created_at: string }>(`
    select user_name, user_role, created_at
    from audit_log
    where action = 'login' and created_at >= now() - ($1 * interval '1 day')
    order by created_at desc limit 500`, [days]);
}

export function auditLog(filters: { action?: string; entity?: string; user?: string } = {}, limit = 200) {
  return q<{ id: number; user_name: string; user_role: string; action: string; entity: string; entity_id: string; detail: string; created_at: string }>(`
    select id, user_name, user_role, action, entity, entity_id, detail, created_at
    from audit_log
    where ($1::text is null or action = $1)
      and ($2::text is null or entity = $2)
      and ($3::text is null or user_name ilike '%'||$3||'%')
    order by created_at desc limit $4`,
    [filters.action || null, filters.entity || null, filters.user || null, limit]);
}

export function trashedRequisitions() {
  return q<{ id: number; po_number: string; version: string; order_date: string; branch_label: string; deleted_at: string; lines: number; qty: number }>(`
    select po.id, po.po_number, po.version, po.order_date, po.branch_label, po.deleted_at,
           count(i.id)::int lines, coalesce(sum(i.qty),0)::float qty
    from purchase_orders po left join po_items i on i.po_id = po.id
    where po.deleted_at is not null
    group by po.id order by po.deleted_at desc`);
}

// ---- logistics ------------------------------------------------------------
export function shipmentSummary() {
  return q<{ po_number: string; ship_date: string; units: number; received: number; returned: number; branch_label: string }>(`
    select po_number, max(ship_date) ship_date, count(*)::int units,
           count(*) filter (where receive_status in ('Receive','Received'))::int received,
           count(*) filter (where receive_status='Returned')::int returned,
           max(branch_label) branch_label
    from shipment_items where po_number is not null
    group by po_number order by max(ship_date) desc nulls last, po_number desc`);
}

// ============================================================================
// Staff sales entry + admin review queue
// ============================================================================

export type SubmissionRow = {
  id: number; kind: "sale" | "customer"; status: string;
  created_by: number; author: string; ba: string; entry_date: string;
  source: string | null; sale_time: string | null; receipt_no: string | null;
  item: string | null; barcode: string | null; size: string | null;
  qty: number | null; unit_price: number | null; discount: number | null;
  total: number | null; payment_channel: string | null; nation: string | null;
  customers: number | null; thai: number | null; foreign_cnt: number | null; sell_amount: number | null;
  review_note: string | null; reviewer: string | null; reviewed_at: string | null;
  created_at: string;
};

const SUB_COLS = `
  s.id, s.kind, s.status, s.created_by, u.full_name author, s.ba, s.entry_date::text entry_date,
  s.source, s.sale_time::text sale_time, s.receipt_no, s.item, s.barcode, s.size,
  s.qty::float qty, s.unit_price::float unit_price, s.discount::float discount, s.total::float total,
  s.payment_channel, s.nation, s.customers, s.thai::float thai, s.foreign_cnt::float foreign_cnt,
  s.sell_amount::float sell_amount, s.review_note, r.full_name reviewer, s.reviewed_at, s.created_at`;

// submissions soft-delete ("ถังขยะ"): prod adds `deleted_at` via manual SQL. Until it
// runs the column is absent, so probe once and treat every row as alive — the review
// and /my queries must keep working before the migration is applied.
let _subTrash: boolean | null = null;
async function subTrashReady(): Promise<boolean> {
  if (_subTrash !== null) return _subTrash;
  try {
    const r = await q(`select 1 from information_schema.columns where table_name = 'submissions' and column_name = 'deleted_at'`);
    _subTrash = r.length > 0;
  } catch { _subTrash = false; }
  return _subTrash;
}
/** " and <alias>.deleted_at is null" once the column exists; "" before the migration. */
async function aliveAnd(alias = "s"): Promise<string> {
  if (!(await subTrashReady())) return "";
  return ` and ${alias ? alias + "." : ""}deleted_at is null`;
}

/** Pending queue for the admin review page (oldest first = FIFO). */
export async function pendingSubmissions() {
  return q<SubmissionRow>(`
    select ${SUB_COLS}
    from submissions s
    join users u on u.id = s.created_by
    left join users r on r.id = s.reviewed_by
    where s.status = 'pending'${await aliveAnd("s")}
    order by s.created_by, s.entry_date, s.created_at`);
}

/** Recently approved submissions (last 7 days) so an admin can undo a wrong approval. */
export async function recentlyApprovedSubmissions() {
  return q<SubmissionRow>(`
    select ${SUB_COLS}
    from submissions s
    join users u on u.id = s.created_by
    left join users r on r.id = s.reviewed_by
    where s.status = 'approved' and s.reviewed_at >= now() - interval '7 days'${await aliveAnd("s")}
    order by s.entry_date desc, s.created_at`);
}

/** Count of pending items — drives the sidebar badge. */
export async function pendingCount() {
  return q<{ n: number }>(`select count(*)::int n from submissions where status='pending'${await aliveAnd("")}`).then((r) => r[0].n);
}

/** One staff member's submissions for a given day (all statuses). */
export async function mySubmissions(userId: number, date: string) {
  return q<SubmissionRow>(`
    select ${SUB_COLS}
    from submissions s
    join users u on u.id = s.created_by
    left join users r on r.id = s.reviewed_by
    where s.created_by = $1 and s.entry_date = $2${await aliveAnd("s")}
    order by s.created_at desc`, [userId, date]);
}

/** Bills a reviewer sent to the trash — restore or purge them on /trash. */
export async function trashedSubmissions() {
  if (!(await subTrashReady())) return [] as (SubmissionRow & { deleted_at: string })[];
  return q<SubmissionRow & { deleted_at: string }>(`
    select ${SUB_COLS}, s.deleted_at::text deleted_at
    from submissions s
    join users u on u.id = s.created_by
    left join users r on r.id = s.reviewed_by
    where s.deleted_at is not null
    order by s.deleted_at desc, s.entry_date desc`);
}

export type BillAttachment = { id: number; bill_ref: string; data: string; created_by: number };

export type BillTender = { channel: string; amount: number };
// bill_payments is added by a manual migration in prod; tolerate it being
// absent (the page renders without split data instead of crashing).
const missingTable = (e: any) => e?.code === "42P01" || /relation "?bill_payments"? does not exist/i.test(String(e?.message || ""));

/** Split-tender breakdown for a set of bill refs → map ref -> [{channel, amount}]. */
export async function paymentsForRefs(refs: string[]): Promise<Record<string, BillTender[]>> {
  const uniq = [...new Set((refs || []).filter(Boolean))];
  if (!uniq.length) return {};
  try {
    const rows = await q<{ bill_ref: string; channel: string; amount: number }>(
      `select bill_ref, channel, amount::float amount from bill_payments where bill_ref = any($1) order by id`, [uniq]);
    const map: Record<string, BillTender[]> = {};
    for (const r of rows) (map[r.bill_ref] ??= []).push({ channel: r.channel, amount: r.amount });
    return map;
  } catch (e) { if (missingTable(e)) return {}; throw e; }
}

/** Photo evidence for a set of bill refs → map ref -> attachments (in order). */
export async function attachmentsForRefs(refs: string[]): Promise<Record<string, BillAttachment[]>> {
  const uniq = [...new Set((refs || []).filter(Boolean))];
  if (!uniq.length) return {};
  const rows = await q<BillAttachment>(
    `select id, bill_ref, data, created_by from bill_attachments where bill_ref = any($1) order by id`, [uniq]);
  const map: Record<string, BillAttachment[]> = {};
  for (const r of rows) (map[r.bill_ref] ??= []).push(r);
  return map;
}

/** Personal daily KPIs for a staff member — counts pending + approved (i.e.
 * everything they entered that has not been rejected), so their view reflects
 * their own work regardless of review state. */
export async function myDayKpis(userId: number, date: string) {
  const alive = await aliveAnd("");
  const [sale] = await q<{ revenue: number; qty: number; bills: number; pending: number }>(`
    select coalesce(sum(total),0)::float revenue,
           coalesce(sum(qty),0)::float qty,
           -- one bill per shared receipt/bill-ref; legacy rows with none count individually
           count(distinct coalesce(nullif(receipt_no,''), 'i'||id))::int bills,
           count(*) filter (where status='pending')::int pending
    from submissions where kind='sale' and status<>'rejected' and created_by=$1 and entry_date=$2${alive}`,
    [userId, date]);

  // Per-channel breakdown for the daily summary: single-channel lines grouped by
  // their channel, PLUS the per-channel amounts of split ("จ่าย 2 ทาง") bills.
  const lineCh = await q<{ channel: string; revenue: number }>(`
    select coalesce(nullif(payment_channel,''),'ไม่ระบุ') channel, sum(total)::float revenue
    from submissions
    where kind='sale' and status<>'rejected' and created_by=$1 and entry_date=$2${alive}
      and coalesce(payment_channel,'') <> $3
    group by 1`, [userId, date, SPLIT2]);
  let tenderCh: { channel: string; revenue: number }[] = [];
  try {
    tenderCh = await q<{ channel: string; revenue: number }>(`
      select channel, sum(amount)::float revenue
      from bill_payments where created_by=$1 and entry_date=$2 group by 1`, [userId, date]);
  } catch (e) { if (!missingTable(e)) throw e; }

  const map = new Map<string, number>();
  for (const r of [...lineCh, ...tenderCh]) map.set(r.channel, (map.get(r.channel) ?? 0) + (r.revenue ?? 0));
  const channels = [...map.entries()]
    .map(([channel, revenue]) => ({ channel, revenue }))
    .filter((c) => Math.round(c.revenue) > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const aov = sale.bills ? sale.revenue / sale.bills : 0;
  return { revenue: sale.revenue, qty: sale.qty, bills: sale.bills, pending: sale.pending, customers: sale.bills, aov, channels };
}

/** Last `days` days of a staff member's own revenue (for the mini trend). */
export async function myTrend(userId: number, days = 14) {
  return q<{ d: string; revenue: number }>(`
    select entry_date::text as d, coalesce(sum(total),0)::float revenue
    from submissions
    where kind='sale' and status<>'rejected' and created_by=$1${await aliveAnd("")}
      and entry_date >= (current_date - ($2::int - 1))
    group by entry_date order by entry_date`, [userId, days]);
}

/** Days a staff member has any submission — for the day switcher. */
export async function myEntryDays(userId: number, limit = 30) {
  return q<{ d: string; n: number; pending: number }>(`
    select entry_date::text as d, count(*)::int n,
           count(*) filter (where status='pending')::int pending
    from submissions where created_by=$1${await aliveAnd("")}
    group by entry_date order by entry_date desc limit $2`, [userId, limit]);
}

/** Dashboard: revenue/bills/qty broken down by salesperson (live sales). */
export function salesByPerson(f: Filter = ALL) {
  return q<{ person: string; revenue: number; qty: number; bills: number }>(`
    select coalesce(u.full_name, nullif(s.ba,''), 'ไม่ระบุ') person,
           sum(s.total)::float revenue, sum(s.qty)::float qty,
           count(distinct s.receipt_no)::int bills
    from sales s left join users u on u.id = s.created_by
    where ${SWs}
    group by coalesce(u.full_name, nullif(s.ba,''), 'ไม่ระบุ')
    order by revenue desc`, [f.months, f.source]);
}

/**
 * Branch daily report: orders / cash vs transfer-credit / nationality split, from
 * that day's non-rejected sale lines. `total` (from submissions) is authoritative;
 * cash = single-channel Cash lines + the cash portion of split ("จ่าย 2 ทาง") bills;
 * everything else is transfer/credit (total − cash).
 */
/** Daily sales totals across a month for the review-page chart. $1='YYYY-MM'.
 *  Combines the live `sales` table (approved + imported history) with still-pending
 *  submissions (not yet copied to sales) so the chart shows old data too, no double-count. */
export async function dailySalesByMonth(month: string, source: string) {
  return q<{ d: string; total: number }>(`
    select d::text d, coalesce(sum(total),0)::float total
    from (
      select sale_date d, total from sales
      where sale_date is not null and to_char(sale_date,'YYYY-MM') = $1 and source = $2
      union all
      select entry_date d, total from submissions
      where kind = 'sale' and status = 'pending' and to_char(entry_date,'YYYY-MM') = $1 and source = $2${await aliveAnd("")}
    ) t
    group by d order by d`, [month, source]);
}

/** Non-rejected sale lines for one day (for the printable per-bill detail). */
export async function dailySaleRows(date: string, source: string) {
  return q<SubmissionRow>(`
    select ${SUB_COLS}
    from submissions s
    join users u on u.id = s.created_by
    left join users r on r.id = s.reviewed_by
    where s.kind = 'sale' and s.status <> 'rejected' and s.entry_date = $1 and s.source = $2${await aliveAnd("s")}
    order by s.sale_time nulls last, s.created_at, s.id`, [date, source]);
}

export async function dailyReport(date: string, source: string, userId: number | null = null) {
  const alive = await aliveAnd("");
  // $3 = userId (null = whole branch; a value = only that salesperson's sales)
  const [tot] = await q<{ orders: number; total: number }>(`
    select count(distinct coalesce(nullif(receipt_no,''),'i'||id))::int orders,
           coalesce(sum(total),0)::float total
    from submissions
    where kind='sale' and status<>'rejected' and entry_date=$1 and source=$2${alive}
      and ($3::bigint is null or created_by=$3)`, [date, source, userId]);

  const nat = await q<{ nation: string; cnt: number; amt: number }>(`
    select coalesce(nullif(nation,''),'ไม่ระบุ') nation,
           count(distinct coalesce(nullif(receipt_no,''),'i'||id))::int cnt,
           coalesce(sum(total),0)::float amt
    from submissions
    where kind='sale' and status<>'rejected' and entry_date=$1 and source=$2${alive}
      and ($3::bigint is null or created_by=$3)
    group by 1`, [date, source, userId]);

  const [cashLine] = await q<{ c: number }>(`
    select coalesce(sum(total),0)::float c from submissions
    where kind='sale' and status<>'rejected' and entry_date=$1 and source=$2 and payment_channel='Cash'${alive}
      and ($3::bigint is null or created_by=$3)`,
    [date, source, userId]);

  let cashSplit = 0;
  try {
    const [r] = await q<{ c: number }>(`
      select coalesce(sum(bp.amount),0)::float c from bill_payments bp
      where bp.channel='Cash' and bp.entry_date=$1 and ($4::bigint is null or bp.created_by=$4)
        and bp.bill_ref in (select distinct receipt_no from submissions
                            where kind='sale' and status<>'rejected' and entry_date=$1 and source=$2${alive}
                              and payment_channel=$3 and coalesce(receipt_no,'')<>''
                              and ($4::bigint is null or created_by=$4))`,
      [date, source, SPLIT2, userId]);
    cashSplit = r?.c ?? 0;
  } catch (e) { if (!missingTable(e)) throw e; }

  const total = tot?.total ?? 0;
  const cash = (cashLine?.c ?? 0) + cashSplit;
  const nonCash = Math.max(0, total - cash);
  const pick = (n: string) => nat.find((x) => x.nation === n);
  const thai = pick("Thai"), foreign = pick("Foreign");
  const other = nat.filter((x) => x.nation !== "Thai" && x.nation !== "Foreign");
  return {
    orders: tot?.orders ?? 0, total, cash, nonCash,
    thaiCount: thai?.cnt ?? 0, thaiAmt: thai?.amt ?? 0,
    foreignCount: foreign?.cnt ?? 0, foreignAmt: foreign?.amt ?? 0,
    otherCount: other.reduce((s, x) => s + x.cnt, 0),
    otherAmt: other.reduce((s, x) => s + x.amt, 0),
  };
}
export type DailyReport = Awaited<ReturnType<typeof dailyReport>>;

// ---- daily cash drawer (opening float carries forward) --------------------
const missingDailyCash = (e: any) => e?.code === "42P01" || /relation "?daily_cash"? does not exist/i.test(String(e?.message || ""));

/** Saved opening/deposit for a user's day; if none, opening carries from the latest
 *  prior day's closing. Returns zeros gracefully if the table isn't there yet (prod). */
export async function getDailyCash(date: string, userId: number) {
  try {
    const [row] = await q<{ opening: number; deposit: number }>(
      `select opening::float, deposit::float from daily_cash where entry_date=$1 and created_by=$2`, [date, userId]);
    if (row) return { opening: row.opening, deposit: row.deposit, saved: true };
    const [prev] = await q<{ closing: number }>(
      `select closing::float from daily_cash where created_by=$2 and entry_date<$1 order by entry_date desc limit 1`, [date, userId]);
    return { opening: prev?.closing ?? 0, deposit: 0, saved: false };
  } catch (e) { if (missingDailyCash(e)) return { opening: 0, deposit: 0, saved: false }; throw e; }
}

export async function saveDailyCash(date: string, userId: number, opening: number, deposit: number, closing: number) {
  try {
    await q(`insert into daily_cash (entry_date, created_by, opening, deposit, closing, updated_at)
             values ($1,$2,$3,$4,$5, now())
             on conflict (entry_date, created_by)
             do update set opening=$3, deposit=$4, closing=$5, updated_at=now()`,
      [date, userId, opening, deposit, closing]);
    return { ok: true };
  } catch (e) { if (missingDailyCash(e)) return { ok: false, missing: true }; throw e; }
}
