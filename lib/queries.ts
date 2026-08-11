import { q } from "./db";
import { SPLIT2 } from "@/lib/payments";
import { DEFAULT_BRANCH } from "@/lib/branches";

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
  // group by the seller's CURRENT name (join users on created_by) so a rename doesn't
  // split one person into two; fall back to the frozen ba for legacy rows with no user.
  return q<{ ba: string; revenue: number; qty: number }>(`
    select coalesce(u.full_name, nullif(s.ba,''), 'ไม่ระบุ') ba,
           sum(s.total)::float revenue, sum(s.qty)::float qty
    from sales s left join users u on u.id = s.created_by
    where coalesce(u.full_name, nullif(s.ba,''), '') not in ('', '#N/A') and ${SWs}
    group by coalesce(u.full_name, nullif(s.ba,''), 'ไม่ระบุ')
    order by revenue desc limit $3`, [f.months, f.source, limit]);
}

export function monthlyCash() {
  return q<{ month: string; total: number }>(`
    select to_char(cash_date,'Mon-YY') month, sum(amount)::float total
    from cash_entries where cash_date is not null
    group by to_char(cash_date,'Mon-YY'), date_trunc('month',cash_date)
    order by date_trunc('month',cash_date)`);
}

// ---- stock (computed live from requisitions − sales), per branch ----------
// Each leg is keyed to a canonical branch code (CTW/SCS): shipments + returns
// derive it from the "0N_XXX …" branch_label token; sales use sales.source.
const STOCK_CTE = `
  with ship as (
    select i.barcode,
           upper(coalesce(substring(po.branch_label from '_([A-Za-z]+)'), 'CTW')) branch,
           sum(i.qty)::float q
    from po_items i
    join purchase_orders po on po.id = i.po_id
    where i.barcode is not null and po.deleted_at is null group by 1, 2),
  sold as (
    select barcode, upper(coalesce(nullif(source,''),'CTW')) branch, sum(qty)::float q
    from sales where barcode is not null group by 1, 2),
  ret as (
    select serial as barcode,
           upper(coalesce(substring(branch_label from '_([A-Za-z]+)'), 'CTW')) branch,
           count(*)::float q
    from return_items where serial is not null and receive_status='Returned' group by 1, 2),
  keys as (
    select barcode, branch from ship
    union select barcode, branch from sold
    union select barcode, branch from ret),
  stock as (
    select p.barcode, p.scent, p.size, k.branch,
           coalesce(ship.q,0) shipped, coalesce(sold.q,0) sold, coalesce(ret.q,0) returned,
           -- returns go back to HQ (leave the branch), so subtract them from stock
           coalesce(ship.q,0) - coalesce(sold.q,0) - coalesce(ret.q,0) remaining
    from keys k
    join products p on p.barcode = k.barcode
    left join ship on ship.barcode = k.barcode and ship.branch = k.branch
    left join sold on sold.barcode = k.barcode and sold.branch = k.branch
    left join ret  on ret.barcode  = k.barcode and ret.branch  = k.branch)
`;

/** Live stock rows. Pass a branch code for that branch only; null/undefined =
 *  all branches combined (summed per product, i.e. the whole-company view). */
export function stockLive(branch: string | null = null) {
  return q<{ barcode: string; scent: string; size: string; shipped: number; sold: number; returned: number; remaining: number }>(
    branch
      ? `${STOCK_CTE} select barcode, scent, size, shipped, sold, returned, remaining
         from stock where branch = $1 order by remaining asc, scent`
      : `${STOCK_CTE} select barcode, scent, size,
           sum(shipped)::float shipped, sum(sold)::float sold,
           sum(returned)::float returned, sum(remaining)::float remaining
         from stock group by barcode, scent, size order by remaining asc, scent`,
    branch ? [branch] : []);
}

export async function stockSummary(branch: string | null = null) {
  const inner = branch
    ? `select remaining, shipped, sold from stock where branch = $1`
    : `select sum(remaining)::float remaining, sum(shipped)::float shipped, sum(sold)::float sold
       from stock group by barcode`;
  const [r] = await q<{ shipped: number; sold: number; remaining: number; skus: number; out: number; low: number }>(
    `${STOCK_CTE}
     select coalesce(sum(shipped),0)::float shipped,
            coalesce(sum(sold),0)::float sold,
            coalesce(sum(remaining),0)::float remaining,
            count(*)::int skus,
            count(*) filter (where remaining <= 0)::int out,
            count(*) filter (where remaining > 0 and remaining <= 3)::int low
     from (${inner}) x`,
    branch ? [branch] : []);
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
  // show the user's CURRENT name/role (join users) so a rename updates old entries too;
  // fall back to the stored snapshot for deleted users or name-only events (failed login).
  return q<{ id: number; user_name: string; user_role: string; action: string; entity: string; entity_id: string; detail: string; created_at: string }>(`
    select a.id, coalesce(u.full_name, a.user_name) user_name, coalesce(u.role, a.user_role) user_role,
           a.action, a.entity, a.entity_id, a.detail, a.created_at
    from audit_log a
    left join users u on u.id = a.user_id
    where ($1::text is null or a.action = $1)
      and ($2::text is null or a.entity = $2)
      and ($3::text is null or coalesce(u.full_name, a.user_name) ilike '%'||$3||'%')
    order by a.created_at desc limit $4`,
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

/** Recently approved submissions (last 30 days) so an admin can review/undo an
 *  approval and still see its attached files well after the day it was approved. */
export async function recentlyApprovedSubmissions() {
  return q<SubmissionRow>(`
    select ${SUB_COLS}
    from submissions s
    join users u on u.id = s.created_by
    left join users r on r.id = s.reviewed_by
    where s.status = 'approved' and s.reviewed_at >= now() - interval '30 days'${await aliveAnd("s")}
    order by s.entry_date desc, s.created_at`);
}

/** Count of pending items — drives the sidebar badge. */
export async function pendingCount() {
  // count BILLS (rows sharing a receipt_no = one bill), not individual line items
  return q<{ n: number }>(
    `select count(distinct coalesce(nullif(receipt_no,''), 'id:'||id::text))::int n
     from submissions where status='pending'${await aliveAnd("")}`,
  ).then((r) => r[0].n);
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
  return q<{ d: string; total: number; orders: number; qty: number }>(`
    select d::text d, coalesce(sum(total),0)::float total,
           count(distinct billkey)::int orders, coalesce(sum(qty),0)::float qty
    from (
      select sale_date d, total, coalesce(qty,0) qty, coalesce(nullif(receipt_no,''),'s'||id::text) billkey
      from sales where sale_date is not null and to_char(sale_date,'YYYY-MM') = $1 and source = $2
      union all
      select entry_date d, total, coalesce(qty,0) qty, coalesce(nullif(receipt_no,''),'p'||s.id::text) billkey
      from submissions s where kind = 'sale' and status = 'pending' and to_char(entry_date,'YYYY-MM') = $1 and source = $2${await aliveAnd("s")}
    ) t
    group by d order by d`, [month, source]);
}

/** Total sales per calendar month (from the live `sales` table), newest first.
 *  Feeds the month-vs-month comparison chart on /review. */
export async function monthlySalesTotals(source: string | null = null, limit = 12) {
  return q<{ ym: string; revenue: number; qty: number; bills: number }>(`
    select to_char(sale_date,'YYYY-MM') as ym,
           coalesce(sum(total),0)::float revenue,
           coalesce(sum(qty),0)::float qty,
           count(distinct coalesce(nullif(receipt_no,''),'s'||id::text))::int bills
    from sales
    where sale_date is not null and ($1::text is null or source = $1)
    group by 1 order by 1 desc limit $2`, [source, limit]);
}

export type DaySaleRow = {
  id: number; src: string; receipt_no: string | null; item: string | null; size: string | null;
  qty: number; unit_price: number; discount: number; total: number;
  payment_channel: string | null; nation: string | null; sale_time: string | null;
  author: string; created_by: number | null; entry_date: string;
};

/** One day's sale lines from the live `sales` table (approved + imported history) PLUS
 *  still-pending submissions (not yet copied to sales) — no double-count. Feeds both the
 *  daily report summary and the printable per-bill detail, so both include old data. */
export async function dailySaleRows(date: string, source: string, userId: number | null = null): Promise<DaySaleRow[]> {
  return q<DaySaleRow>(`
    select s.id, 'sale'::text src, s.receipt_no, s.item, s.size,
           s.qty::float qty, s.unit_price::float unit_price, coalesce(s.discount,0)::float discount, s.total::float total,
           s.payment_channel, s.nation, s.sale_time::text sale_time,
           coalesce(u.full_name, nullif(s.ba,''), '') author, s.created_by, s.sale_date::text entry_date
    from sales s left join users u on u.id = s.created_by
    where s.sale_date = $1 and s.source = $2 and ($3::bigint is null or s.created_by = $3)
    union all
    select s.id, 'sub'::text src, s.receipt_no, s.item, s.size,
           s.qty::float, s.unit_price::float, coalesce(s.discount,0)::float, s.total::float,
           s.payment_channel, s.nation, s.sale_time::text,
           coalesce(u.full_name,'') author, s.created_by, s.entry_date::text
    from submissions s join users u on u.id = s.created_by
    where s.kind = 'sale' and s.status = 'pending' and s.entry_date = $1 and s.source = $2
      and ($3::bigint is null or s.created_by = $3)${await aliveAnd("s")}
    order by sale_time nulls last, id`, [date, source, userId]);
}

/** One bill's lines by receipt number (approved from sales, else pending submission) —
 *  for the printable tax receipt. Salesperson uses the current name. */
export async function billByReceipt(ref: string) {
  const alive = await aliveAnd("s");
  return q<{ id: number; receipt_no: string; item: string; size: string; qty: number; unit_price: number; discount: number; total: number; sale_time: string; author: string; entry_date: string; source: string; payment_channel: string }>(`
    select s.id, s.receipt_no, s.item, s.size, s.qty::float qty, s.unit_price::float unit_price,
           coalesce(s.discount,0)::float discount, s.total::float total, s.sale_time::text sale_time,
           coalesce(u.full_name, nullif(s.ba,''), '') author, s.sale_date::text entry_date, s.source, s.payment_channel
    from sales s left join users u on u.id = s.created_by
    where s.receipt_no = $1
    union all
    select s.id, s.receipt_no, s.item, s.size, s.qty::float, s.unit_price::float,
           coalesce(s.discount,0)::float, s.total::float, s.sale_time::text,
           coalesce(u.full_name, '') author, s.entry_date::text, s.source, s.payment_channel
    from submissions s join users u on u.id = s.created_by
    where s.receipt_no = $1 and s.kind = 'sale' and s.status = 'pending'${alive}
    order by id`, [ref]);
}

export async function dailyReport(date: string, source: string, userId: number | null = null) {
  const rows = await dailySaleRows(date, source, userId);
  const billKey = (r: DaySaleRow) => (r.receipt_no && r.receipt_no.trim() ? `r:${r.receipt_no}` : `i:${r.src}${r.id}`);

  const total = rows.reduce((s, r) => s + (r.total || 0), 0);
  const orders = new Set(rows.map(billKey)).size;

  // cash = single-channel Cash lines + the cash portion of split ("จ่าย 2 ทาง") bills
  const cashLine = rows.filter((r) => r.payment_channel === "Cash").reduce((s, r) => s + (r.total || 0), 0);
  const splitRefs = [...new Set(rows.filter((r) => r.payment_channel === SPLIT2 && r.receipt_no).map((r) => r.receipt_no as string))];
  let cashSplit = 0;
  if (splitRefs.length) {
    try {
      const [r] = await q<{ c: number }>(
        `select coalesce(sum(amount),0)::float c from bill_payments where channel='Cash' and bill_ref = any($1)`, [splitRefs]);
      cashSplit = r?.c ?? 0;
    } catch (e) { if (!missingTable(e)) throw e; }
  }
  const cash = cashLine + cashSplit;
  const nonCash = Math.max(0, total - cash);

  // nationality — distinct bills + amount per nation
  const nat = new Map<string, { bills: Set<string>; amt: number }>();
  for (const r of rows) {
    const key = r.nation && r.nation.trim() ? r.nation : "ไม่ระบุ";
    const e = nat.get(key) ?? { bills: new Set<string>(), amt: 0 };
    e.bills.add(billKey(r)); e.amt += r.total || 0;
    nat.set(key, e);
  }
  const thai = nat.get("Thai"), foreign = nat.get("Foreign");
  let otherCount = 0, otherAmt = 0;
  for (const [k, e] of nat) if (k !== "Thai" && k !== "Foreign") { otherCount += e.bills.size; otherAmt += e.amt; }

  return {
    orders, total, cash, nonCash,
    thaiCount: thai?.bills.size ?? 0, thaiAmt: thai?.amt ?? 0,
    foreignCount: foreign?.bills.size ?? 0, foreignAmt: foreign?.amt ?? 0,
    otherCount, otherAmt,
  };
}
export type DailyReport = Awaited<ReturnType<typeof dailyReport>>;

// ---- daily cash drawer (opening float carries forward) --------------------
const missingDailyCash = (e: any) => e?.code === "42P01" || /relation "?daily_cash"? does not exist/i.test(String(e?.message || ""));

/** Shared shop drawer for a day (same figures for every user). Opening carries from the
 *  latest prior day's closing when not yet saved. Zeros gracefully if the table is absent. */
export async function getDailyCash(date: string, branch: string = DEFAULT_BRANCH) {
  try {
    const [row] = await q<{ opening: number; deposit: number; confirmed: boolean }>(
      `select opening::float, deposit::float, confirmed from daily_cash where entry_date=$1 and branch=$2`, [date, branch]);
    // A confirmed (admin-reviewed) day keeps its own opening. Otherwise "ยกมา" = the prior
    // day's LIVE closing (opening + เงินสดขาย − เข้าธนาคาร), so it always equals the admin
    // table and carries the true คงเหลือ forward — not the stale stored closing.
    if (row?.confirmed) return { opening: row.opening, deposit: row.deposit, saved: true };
    const [prev] = await q<{ entry_date: string; opening: number; deposit: number }>(
      `select entry_date::text entry_date, opening::float, deposit::float
       from daily_cash where entry_date<$1 and branch=$2 order by entry_date desc limit 1`, [date, branch]);
    if (!prev) return { opening: row?.opening ?? 0, deposit: row?.deposit ?? 0, saved: !!row };
    const prevClosing = Math.max(0, prev.opening + (await dailyReport(prev.entry_date, branch)).cash - prev.deposit);
    return { opening: prevClosing, deposit: row?.deposit ?? 0, saved: !!row };
  } catch (e) { if (missingDailyCash(e)) return { opening: 0, deposit: 0, saved: false }; throw e; }
}

export async function saveDailyCash(date: string, branch: string, opening: number, deposit: number, closing: number, updatedBy: number | null = null) {
  try {
    await q(`insert into daily_cash (entry_date, branch, opening, deposit, closing, updated_by, updated_at)
             values ($1,$2,$3,$4,$5,$6, now())
             on conflict (entry_date, branch)
             do update set opening=$3, deposit=$4, closing=$5, updated_by=$6, updated_at=now()`,
      [date, branch, opening, deposit, closing, updatedBy]);
    return { ok: true };
  } catch (e) { if (missingDailyCash(e)) return { ok: false, missing: true }; throw e; }
}

/** Per-day shop drawer figures for the admin cash page (review + confirm + post), one branch. */
export async function dailyCashLog(limit = 90, branch: string = DEFAULT_BRANCH) {
  try {
    const rows = await q<{ entry_date: string; opening: number; deposit: number; closing: number; confirmed: boolean; posted: boolean }>(
      `select entry_date::text entry_date, opening::float, deposit::float, closing::float,
              confirmed, (posted_cash_id is not null) posted
       from daily_cash where branch=$2 order by entry_date desc limit $1`, [limit, branch]);
    // "คงเหลือ" is computed LIVE = ยกมา + เงินสดขายวันนั้น − เข้าธนาคาร, exactly like the
    // daily report's "เงินสดหน้าร้านคงเหลือ" — that live value is what carries to the next
    // day. (The stored closing gets frozen at confirm time and can go stale.)
    const cashByDate = new Map<string, number>();
    await Promise.all(rows.map(async (r) => cashByDate.set(r.entry_date, (await dailyReport(r.entry_date, branch)).cash)));
    let prevClosing: number | null = null;
    for (const r of [...rows].reverse()) {   // oldest → newest
      if (prevClosing !== null && !r.confirmed) r.opening = prevClosing;   // un-reviewed day: ยกมา = คงเหลือเมื่อวาน
      r.closing = Math.max(0, r.opening + (cashByDate.get(r.entry_date) ?? 0) - r.deposit);
      prevClosing = r.closing;
    }
    return rows;
  } catch (e) { if (missingDailyCash(e) || (e as any)?.code === "42703") return []; throw e; }
}

export type CashAttachment = { id: number; entry_date: string; data: string };
/** Bank-deposit slip photos grouped by day for one branch (admin /cash drawer). */
export async function cashAttachmentsByDate(branch: string = DEFAULT_BRANCH): Promise<Record<string, CashAttachment[]>> {
  try {
    const rows = await q<CashAttachment>(
      `select id, entry_date::text entry_date, data from cash_attachments where branch=$1 order by id`, [branch]);
    const map: Record<string, CashAttachment[]> = {};
    for (const r of rows) (map[r.entry_date] ??= []).push(r);
    return map;
  } catch (e) { if ((e as any)?.code === "42P01") return {}; throw e; }
}

/** Bank-deposit slip photos for one (day, branch) — for the salesperson's /my daily report.
 *  Pass userId to return only that person's slips (each salesperson sees only their own). */
export async function cashAttachmentsForDate(date: string, userId?: number, branch: string = DEFAULT_BRANCH): Promise<CashAttachment[]> {
  try {
    const mine = typeof userId === "number";
    const params: any[] = [date, branch];
    if (mine) params.push(userId);
    return await q<CashAttachment>(
      `select id, entry_date::text entry_date, data from cash_attachments
       where entry_date=$1 and branch=$2${mine ? " and created_by=$3" : ""} order by id`,
      params);
  } catch (e) { if ((e as any)?.code === "42P01") return []; throw e; }
}
