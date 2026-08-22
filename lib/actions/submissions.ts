"use server";
import { q, tx, type TxRun } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { saleSchema, customerDaySchema, billSchema } from "./schemas";
import { SPLIT2, isSplit } from "@/lib/payments";
import { logAudit } from "@/lib/audit";
import { monthLabel } from "@/lib/month";
import { branchPrefix, resolveBranch } from "@/lib/branches";
import { requirePermission } from "@/lib/auth/require-user";
import { pushLine, siteBaseUrl } from "@/lib/line";
import { offloadToStorage, deleteAttachment } from "@/lib/attachments";

// ---------------------------------------------------------------- staff: submit
// Staff entries land in `submissions` (status='pending'). Nothing touches the
// live sales/daily_customers tables until an admin approves.

// Shared required-field guard for staff sale entry.
function requireSaleFields(d: { payment_channel?: string; nation?: string }) {
  if (!d.payment_channel?.trim()) throw new Error("กรุณาเลือกช่องทางชำระ");
  if (!d.nation?.trim()) throw new Error("กรุณาเลือกสัญชาติลูกค้า");
}

export async function submitSale(input: unknown) {
  const user = await requirePermission("my_sales");
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const d = parsed.data;
  requireSaleFields(d);
  const sub = d.qty * (d.unit_price ?? 0);
  const discount = Math.min(sub, d.discount ?? 0);
  const total = sub - discount;
  const [row] = await q<{ id: number }>(
    `insert into submissions
       (kind, status, created_by, ba, entry_date, source, sale_time, receipt_no, item, barcode, size, qty, unit_price, discount, total, payment_channel, nation, note)
     values ('sale','pending',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     returning id`,
    [user.id, user.full_name, d.sale_date, resolveBranch(d.source), d.sale_time || null,
     d.receipt_no || null, d.item, d.barcode || null, d.size || null,
     d.qty, d.unit_price ?? 0, discount, total, d.payment_channel || null, d.nation || null, (d as any).note || null]);
  await q(`update submissions s set product_id = p.id from products p where p.barcode = s.barcode and s.id = $1`, [row.id]);
  await logAudit("submit", "submission", row.id, `ขาย: ${d.item} · ${d.qty} ชิ้น · ฿${Math.round(total).toLocaleString()}`);
  revalidatePath("/my"); revalidatePath("/review");
}

// One bill = one customer buying one or more items. All lines share a bill
// reference (the entered receipt no., or a generated one) so they count as a
// single bill/customer, plus shared payment/nationality/time.
// Standard, human-readable bill ref when staff leaves เลขใบเสร็จ blank:
//   {BRANCH}-{YYMMDD}-{running}  e.g. CTW-260806-001  (sortable, self-explanatory)
async function genBillRef(saleDate: string, source: string): Promise<string> {
  const [y, m, dd] = saleDate.split("-");
  const src = branchPrefix(source);
  const prefix = `${src}-${(y || "").slice(2)}${(m || "").padStart(2, "0")}${(dd || "").padStart(2, "0")}-`;
  // max running number already used for this branch+day (only our generated refs)
  const [mx] = await q<{ n: number }>(
    `select coalesce(max(substring(receipt_no from '[0-9]+$')::int), 0) n
     from submissions where receipt_no ~ $1`, [`^${prefix}[0-9]+$`]);
  return prefix + String((mx?.n ?? 0) + 1).padStart(3, "0");
}

export async function submitBill(input: unknown) {
  const user = await requirePermission("my_sales");
  const parsed = billSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const d = parsed.data;
  if (!d.nation?.trim()) throw new Error("กรุณาเลือกสัญชาติลูกค้า");
  const billPc = d.payment_channel?.trim() || "";
  const split = isSplit(billPc);
  // each line's channel = its own override, else the bill default; all required
  if (!split && d.items.some((it) => !((it.payment_channel?.trim() || billPc)))) throw new Error("กรุณาเลือกช่องทางชำระให้ครบทุกชิ้น");

  // split tender: the per-channel amounts must add up to the bill total
  const billTotal = d.items.reduce((s, it) => s + (it.qty * (it.unit_price ?? 0) - (it.discount ?? 0)), 0);
  const tenders = split ? (d.tenders ?? []).filter((t) => t.channel?.trim() && t.amount > 0) : [];
  if (split) {
    if (tenders.length < 2) throw new Error("จ่าย 2 ทาง: เลือกช่องทางและใส่ยอดให้ครบอย่างน้อย 2 ช่องทาง");
    const tsum = Math.round(tenders.reduce((s, t) => s + t.amount, 0));
    if (tsum !== Math.round(billTotal)) throw new Error(`ยอดชำระรวม ฿${tsum.toLocaleString()} ไม่เท่ากับยอดบิล ฿${Math.round(billTotal).toLocaleString()}`);
  }

  const ref = d.receipt_no?.trim() || (await genBillRef(d.sale_date, resolveBranch(d.source)));
  let count = 0, sum = 0;
  // Whole bill in ONE transaction: line rows + split tenders + attachment rows all
  // commit together, so a mid-loop failure can't leave a half-saved bill (which the
  // salesperson would re-submit → duplicate). Storage offload runs AFTER commit.
  const attachIds: { id: number; data: string }[] = [];
  await tx(async (run) => {
    for (const it of d.items) {
      const pc = split ? SPLIT2 : (it.payment_channel?.trim() || billPc);
      const total = it.qty * (it.unit_price ?? 0) - (it.discount ?? 0);
      const [row] = await run<{ id: number }>(
        `insert into submissions
           (kind, status, created_by, ba, entry_date, source, sale_time, receipt_no, item, barcode, size, qty, unit_price, discount, total, payment_channel, nation)
         values ('sale','pending',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         returning id`,
        [user.id, user.full_name, d.sale_date, resolveBranch(d.source), d.sale_time || null, ref,
         it.item, it.barcode || null, it.size || null, it.qty, it.unit_price ?? 0, it.discount ?? 0, total,
         pc, d.nation]);
      await run(`update submissions s set product_id = p.id from products p where p.barcode = s.barcode and s.id = $1`, [row.id]);
      count++; sum += total;
    }
    for (const t of tenders) {
      await run(`insert into bill_payments (bill_ref, created_by, entry_date, channel, amount) values ($1,$2,$3,$4,$5)`,
        [ref, user.id, d.sale_date, t.channel.trim(), t.amount]);
    }
    for (const a of d.attachments ?? []) {
      const [ins] = await run<{ id: number }>(`insert into bill_attachments (bill_ref, created_by, data) values ($1,$2,$3) returning id`, [ref, user.id, a]);
      attachIds.push({ id: ins.id, data: a });
    }
  });
  // move slip images to Storage after the bill is committed (network call, not part of the DB tx)
  for (const a of attachIds) await offloadToStorage("bill_attachments", "bill", a.id, a.data);
  await logAudit("submit", "submission", null, `บิล ${count} รายการ · ฿${Math.round(sum).toLocaleString()}${d.attachments?.length ? ` · แนบ ${d.attachments.length} รูป` : ""}`);
  revalidatePath("/my"); revalidatePath("/review");

  // LINE alert to the shop group — fully optional & fail-soft (a LINE outage or
  // missing config must never break the sale). Awaited so it runs before the
  // serverless function returns, but its result is ignored.
  try {
    const pieces = d.items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    const pay = split ? "จ่าย 2 ช่องทาง" : billPc;
    const nation = d.nation === "Foreign" ? "🌏 ต่างชาติ" : d.nation === "Thai" ? "🇹🇭 ไทย" : d.nation;
    const base = siteBaseUrl();
    const lines = [
      `🧾 บิลใหม่ · ${user.full_name}`,
      ref,
      `${pieces} ชิ้น · ฿${Math.round(sum).toLocaleString()} · ${pay} · ${nation}`,
      ...(base ? [`ดูใบเสร็จ: ${base}/receipt/${encodeURIComponent(ref)}`] : []),
    ];
    await pushLine(lines.join("\n"));
  } catch (e) { console.error("[submitBill] line notify failed", e); }

  return { ref };   // so the UI can offer a "print receipt" link for the bill just saved
}

// ------- add item(s) to an EXISTING pending bill (same receipt_no) -------
type AddItem = { item: string; barcode?: string; size?: string; qty: number; unit_price: number; discount?: number };

async function insertBillItems(run: TxRun, ref: string, shared: { source: string; entry_date: string; sale_time: string | null; nation: string; payment_channel: string | null }, items: AddItem[], userId: number, ba: string) {
  for (const it of items) {
    const qty = Number(it.qty) || 0;
    const total = Math.max(0, qty * (Number(it.unit_price) || 0) - (Number(it.discount) || 0));
    const [row] = await run<{ id: number }>(
      `insert into submissions
         (kind, status, created_by, ba, entry_date, source, sale_time, receipt_no, item, barcode, size, qty, unit_price, discount, total, payment_channel, nation)
       values ('sale','pending',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) returning id`,
      [userId, ba, shared.entry_date, shared.source, shared.sale_time, ref,
       it.item, it.barcode || null, it.size || null, qty, Number(it.unit_price) || 0, Number(it.discount) || 0, total,
       shared.payment_channel, shared.nation]);
    await run(`update submissions s set product_id = p.id from products p where p.barcode = s.barcode and s.id = $1`, [row.id]);
  }
}

/** Salesperson: append items to their own still-pending bill. */
export async function addMyBillItems(billRef: string, items: AddItem[]) {
  const user = await requirePermission("my_sales");
  const ref = String(billRef || "").trim();
  const rows = (items || []).filter((it) => String(it?.item || "").trim());
  if (!ref || !rows.length) return { ok: false, error: "ไม่มีสินค้าที่จะเพิ่ม" };
  const [b] = await q<{ source: string; entry_date: string; sale_time: string | null; nation: string; payment_channel: string | null }>(
    `select source, entry_date::text entry_date, sale_time, nation, payment_channel
     from submissions where receipt_no = $1 and created_by = $2 and status = 'pending' order by id limit 1`, [ref, user.id]);
  if (!b) return { ok: false, error: "ไม่พบบิล หรือบิลถูกตรวจแล้ว (เพิ่มไม่ได้)" };
  // a split-payment bill's tenders are fixed at submit; adding items would make the
  // tender sum ≠ bill total (and the new lines vanish from the channel report) → block it
  if (isSplit(b.payment_channel)) return { ok: false, error: "บิลจ่าย 2 ทาง เพิ่มสินค้าไม่ได้ (ยอดชำระจะไม่ตรง) — สร้างบิลใหม่แทน" };
  try {
    await tx(async (run) => insertBillItems(run, ref, b, rows, user.id, user.full_name));
    await logAudit("submit", "submission", null, `เพิ่มสินค้าในบิล ${ref} · ${rows.length} รายการ`);
    revalidatePath("/my"); revalidatePath("/review");
    return { ok: true };
  } catch (e) { console.error("[addMyBillItems] failed", e); return { ok: false, error: "เพิ่มไม่สำเร็จ ลองใหม่" }; }
}

/** Admin: append items to any still-pending bill (review page). */
export async function addBillItemsByAdmin(billRef: string, items: AddItem[]) {
  const admin = await requirePermission("review");
  const ref = String(billRef || "").trim();
  const rows = (items || []).filter((it) => String(it?.item || "").trim());
  if (!ref || !rows.length) return { ok: false, error: "ไม่มีสินค้าที่จะเพิ่ม" };
  const [b] = await q<{ source: string; entry_date: string; sale_time: string | null; nation: string; payment_channel: string | null; created_by: number }>(
    `select source, entry_date::text entry_date, sale_time, nation, payment_channel, created_by
     from submissions where receipt_no = $1 and status = 'pending' order by id limit 1`, [ref]);
  if (!b) return { ok: false, error: "ไม่พบบิล หรือบิลถูกตรวจแล้ว" };
  if (isSplit(b.payment_channel)) return { ok: false, error: "บิลจ่าย 2 ทาง เพิ่มสินค้าไม่ได้ (ยอดชำระจะไม่ตรง)" };
  try {
    // keep the item under the original salesperson so the bill stays coherent
    await tx(async (run) => insertBillItems(run, ref, b, rows, b.created_by, admin.full_name));
    await logAudit("update", "submission", ref, `แอดมินเพิ่มสินค้าในบิล ${ref} · ${rows.length} รายการ`);
    revalidatePath("/review"); revalidatePath("/my");
    return { ok: true };
  } catch (e) { console.error("[addBillItemsByAdmin] failed", e); return { ok: false, error: "เพิ่มไม่สำเร็จ ลองใหม่" }; }
}

// Add / remove photo evidence on a bill you own that is still pending.
export async function addBillAttachments(billRef: string, images: string[]) {
  const user = await requirePermission("my_sales");
  const ref = String(billRef || "").trim();
  if (!ref) throw new Error("ไม่พบบิล");
  // must own at least one still-pending row of this bill
  const [own] = await q<{ n: number }>(
    `select count(*)::int n from submissions where receipt_no = $1 and created_by = $2 and status = 'pending'`, [ref, user.id]);
  if (!own?.n) throw new Error("แนบรูปได้เฉพาะบิลของตัวเองที่ยังรอตรวจ");
  const imgs = (images || []).filter((s) => typeof s === "string" && s.startsWith("data:image/") && s.length <= 3_000_000).slice(0, 6);
  if (!imgs.length) throw new Error("ไม่มีรูปที่ถูกต้อง");
  for (const a of imgs) {
    const [ins] = await q<{ id: number }>(`insert into bill_attachments (bill_ref, created_by, data) values ($1,$2,$3) returning id`, [ref, user.id, a]);
    await offloadToStorage("bill_attachments", "bill", ins.id, a);
  }
  await logAudit("update", "submission", null, `แนบรูปบิล ${ref} · ${imgs.length} รูป`);
  revalidatePath("/my"); revalidatePath("/review");
}

export async function deleteBillAttachment(id: number) {
  const user = await requirePermission("my_sales");
  const [a] = await q<{ bill_ref: string; created_by: number }>(`select bill_ref, created_by from bill_attachments where id = $1`, [id]);
  if (!a) throw new Error("ไม่พบรูป");
  if (Number(a.created_by) !== Number(user.id)) throw new Error("ลบได้เฉพาะรูปของตัวเอง");
  const [locked] = await q<{ n: number }>(
    `select count(*)::int n from submissions where receipt_no = $1 and status <> 'pending'`, [a.bill_ref]);
  if (locked?.n) throw new Error("บิลนี้ถูกตรวจแล้ว ลบรูปไม่ได้");
  await deleteAttachment("bill_attachments", id);   // also removes the Storage object
  revalidatePath("/my"); revalidatePath("/review");
}

export async function submitCustomerDay(input: unknown) {
  const user = await requirePermission("my_sales");
  const parsed = customerDaySchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const d = parsed.data;
  const [row] = await q<{ id: number }>(
    `insert into submissions
       (kind, status, created_by, ba, entry_date, customers, sell_amount, thai, foreign_cnt)
     values ('customer','pending',$1,$2,$3,$4,$5,$6,$7)
     returning id`,
    [user.id, user.full_name, d.cust_date, d.customers, d.sell_amount ?? 0, d.thai ?? null, d.foreign ?? null]);
  await logAudit("submit", "submission", row.id, `ลูกค้า: ${d.cust_date} · ${d.customers} ราย`);
  revalidatePath("/my"); revalidatePath("/review");
}

// ---------------------------------------------------------- staff: edit / delete own
// Only the author may touch a row, and only while it is still pending.

// Load a row and assert the caller owns it. `allow` lists the statuses the
// action permits (edits: pending only; delete: pending or rejected so a bounced
// entry can be removed and re-entered — approved rows stay locked).
async function ownRow(id: number, userId: number, allow: string[]) {
  const [row] = await q<{ id: number; kind: string; status: string; created_by: number }>(
    `select id, kind, status, created_by from submissions where id = $1`, [id]);
  if (!row) throw new Error("ไม่พบรายการ");
  // node-postgres returns bigint columns as strings; compare numerically
  if (Number(row.created_by) !== Number(userId)) throw new Error("แก้ไขได้เฉพาะรายการของตัวเอง");
  if (!allow.includes(row.status)) {
    throw new Error(row.status === "approved" ? "รายการนี้เข้าระบบแล้ว แก้ไข/ลบไม่ได้" : "รายการนี้แก้ไขไม่ได้");
  }
  return row;
}
const ownPending = (id: number, userId: number) => ownRow(id, userId, ["pending"]);

// When an existing bill is edited to (or away from) split payment, sync its
// per-channel amounts. Supports single-line bills only — a multi-item bill's
// split can't be expressed by editing one line, so it's rejected clearly.
async function applyEditTenders(id: number, d: any, total: number) {
  const split = isSplit((d.payment_channel || "").trim());
  const [row] = await q<{ receipt_no: string | null; created_by: number }>(`select receipt_no, created_by from submissions where id = $1`, [id]);
  const ref = row?.receipt_no?.trim() || null;
  if (!split) { if (ref) { try { await q(`delete from bill_payments where bill_ref = $1`, [ref]); } catch {} } return; }
  if (!ref) throw new Error("บิลนี้ไม่มีเลขที่บิล — ใช้จ่าย 2 ช่องทางไม่ได้ (ให้ลบแล้วกรอกใหม่)");
  const [cnt] = await q<{ n: number }>(`select count(*)::int n from submissions where receipt_no = $1 and status <> 'rejected'`, [ref]);
  if ((cnt?.n ?? 0) > 1) throw new Error("แก้เป็นจ่าย 2 ช่องทางได้เฉพาะบิลรายการเดียว — บิลหลายรายการให้ลบแล้วกรอกใหม่");
  const tenders = ((d.tenders ?? []) as { channel: string; amount: number }[]).filter((t) => t.channel?.trim() && t.amount > 0);
  if (tenders.length < 2) throw new Error("จ่าย 2 ทาง: เลือกช่องทางและใส่ยอดให้ครบอย่างน้อย 2 ช่องทาง");
  const tsum = Math.round(tenders.reduce((s, t) => s + t.amount, 0));
  if (tsum !== Math.round(total)) throw new Error(`ยอดชำระรวม ฿${tsum.toLocaleString()} ไม่เท่ากับยอดบิล ฿${Math.round(total).toLocaleString()}`);
  await q(`delete from bill_payments where bill_ref = $1`, [ref]);
  for (const t of tenders) {
    await q(`insert into bill_payments (bill_ref, created_by, entry_date, channel, amount) values ($1,$2,$3,$4,$5)`,
      [ref, row.created_by, d.sale_date, t.channel.trim(), t.amount]);
  }
}

export async function updateMySale(id: number, input: unknown) {
  const user = await requirePermission("my_sales");
  await ownPending(id, user.id);
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const d = parsed.data;
  requireSaleFields(d);
  const sub = d.qty * (d.unit_price ?? 0);
  const discount = Math.min(sub, d.discount ?? 0);
  const total = sub - discount;
  await q(
    `update submissions set
       entry_date=$2, source=$3, sale_time=$4, receipt_no=$5, item=$6, barcode=$7, size=$8,
       qty=$9, unit_price=$10, discount=$11, total=$12, payment_channel=$13, nation=$14, updated_at=now()
     where id=$1`,
    [id, d.sale_date, resolveBranch(d.source), d.sale_time || null, d.receipt_no || null, d.item,
     d.barcode || null, d.size || null, d.qty, d.unit_price ?? 0, discount, total,
     d.payment_channel || null, d.nation || null]);
  await q(`update submissions s set product_id = p.id from products p where p.barcode = s.barcode and s.id = $1`, [id]);
  await applyEditTenders(id, d, total);
  await logAudit("update", "submission", id, `แก้ไข: ${d.item}`);
  revalidatePath("/my"); revalidatePath("/review");
}

export async function updateMyCustomerDay(id: number, input: unknown) {
  const user = await requirePermission("my_sales");
  await ownPending(id, user.id);
  const parsed = customerDaySchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const d = parsed.data;
  await q(
    `update submissions set entry_date=$2, customers=$3, sell_amount=$4, thai=$5, foreign_cnt=$6, updated_at=now() where id=$1`,
    [id, d.cust_date, d.customers, d.sell_amount ?? 0, d.thai ?? null, d.foreign ?? null]);
  await logAudit("update", "submission", id, `แก้ไขลูกค้า: ${d.cust_date}`);
  revalidatePath("/my"); revalidatePath("/review");
}

export async function deleteMySubmission(id: number) {
  const user = await requirePermission("my_sales");
  await ownRow(id, user.id, ["pending", "rejected"]);   // allow removing a bounced entry
  const [ref] = await q<{ receipt_no: string | null }>(`select receipt_no from submissions where id = $1`, [id]);
  await q(`delete from submissions where id = $1`, [id]);
  // if that was the bill's last line, remove its now-orphaned photo + split records
  if (ref?.receipt_no) {
    const [left] = await q<{ n: number }>(`select count(*)::int n from submissions where receipt_no = $1`, [ref.receipt_no]);
    if (!left?.n) {
      await q(`delete from bill_attachments where bill_ref = $1`, [ref.receipt_no]);
      try { await q(`delete from bill_payments where bill_ref = $1`, [ref.receipt_no]); } catch {}
    }
  }
  await logAudit("delete", "submission", id, "ลบรายการที่กรอก");
  revalidatePath("/my"); revalidatePath("/review");
}

// Admin edits any pending submission (fix data before approving). Reviewer-only.
export async function updateSubmissionByAdmin(id: number, input: unknown) {
  await requirePermission("review");
  const [row] = await q<{ kind: string; status: string }>(`select kind, status from submissions where id = $1`, [id]);
  if (!row) throw new Error("ไม่พบรายการ");
  if (row.status !== "pending") throw new Error("รายการนี้ถูกตรวจแล้ว แก้ไขไม่ได้");

  if (row.kind === "sale") {
    const parsed = saleSchema.safeParse(input);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
    const d = parsed.data;
    const sub = d.qty * (d.unit_price ?? 0);
    const discount = Math.min(sub, d.discount ?? 0);
    const total = sub - discount;
    await q(
      `update submissions set
         entry_date=$2, source=$3, sale_time=$4, receipt_no=$5, item=$6, barcode=$7, size=$8,
         qty=$9, unit_price=$10, discount=$11, total=$12, payment_channel=$13, nation=$14, updated_at=now()
       where id=$1`,
      [id, d.sale_date, resolveBranch(d.source), d.sale_time || null, d.receipt_no || null, d.item,
       d.barcode || null, d.size || null, d.qty, d.unit_price ?? 0, discount, total,
       d.payment_channel || null, d.nation || null]);
    await q(`update submissions s set product_id = p.id from products p where p.barcode = s.barcode and s.id = $1`, [id]);
    await applyEditTenders(id, d, total);
    await logAudit("update", "submission", id, `แอดมินแก้ไข: ${d.item}`);
  } else {
    const parsed = customerDaySchema.safeParse(input);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
    const d = parsed.data;
    await q(
      `update submissions set entry_date=$2, customers=$3, sell_amount=$4, thai=$5, foreign_cnt=$6, updated_at=now() where id=$1`,
      [id, d.cust_date, d.customers, d.sell_amount ?? 0, d.thai ?? null, d.foreign ?? null]);
    await logAudit("update", "submission", id, `แอดมินแก้ไขลูกค้า: ${d.cust_date}`);
  }
  revalidatePath("/review"); revalidatePath("/my");
}

// ---------------------------------------------------------------- admin: review
// Approving copies the row into the live table (created_by preserved) so the
// dashboard aggregates it and can break it down by salesperson.

async function copyToLive(id: number) {
  const [s] = await q<any>(`select * from submissions where id = $1`, [id]);
  if (!s) throw new Error("ไม่พบรายการ");
  // Idempotent: submission_id is UNIQUE, so a retry/re-approve DOES NOTHING
  // instead of inserting a duplicate live row (double-counted revenue).
  let approvedId: number | null = null;
  if (s.kind === "sale") {
    const [ins] = await q<{ id: number }>(
      `insert into sales (source, month, sale_date, sale_time, ba, receipt_no, item, barcode, product_id, grade, size, qty, unit_price, discount, total, paid, payment_channel, nation, note, created_by, submission_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9, coalesce($10,(select grade from products where id=$9)), $11,$12,$13,$14,$15,$15,$16,$17,$18,$19,$20)
       on conflict (submission_id) do nothing
       returning id`,
      [s.source, monthLabel(s.entry_date), s.entry_date, s.sale_time, s.ba, s.receipt_no, s.item,
       s.barcode, s.product_id, s.grade ?? null, s.size, s.qty, s.unit_price, s.discount, s.total,
       s.payment_channel, s.nation, s.note, s.created_by, s.id]);
    approvedId = ins?.id ?? (await q<{ id: number }>(`select id from sales where submission_id = $1`, [s.id]))[0]?.id ?? null;
  } else {
    // `source` (branch) added in 0025; fall back to the pre-0025 insert if prod
    // hasn't run the migration yet so approving a customer-day never fails.
    const base = [monthLabel(s.entry_date), s.entry_date, s.ba, s.customers, s.sell_amount, s.thai, s.foreign_cnt, s.created_by, s.id];
    let ins: { id: number } | undefined;
    try {
      [ins] = await q<{ id: number }>(
        `insert into daily_customers (month, cust_date, ba, customers, sell_amount, thai, foreign_cnt, created_by, submission_id, source)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         on conflict (submission_id) do nothing returning id`, [...base, s.source]);
    } catch (e: any) {
      if (e?.code !== "42703") throw e;
      [ins] = await q<{ id: number }>(
        `insert into daily_customers (month, cust_date, ba, customers, sell_amount, thai, foreign_cnt, created_by, submission_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (submission_id) do nothing returning id`, base);
    }
    approvedId = ins?.id ?? (await q<{ id: number }>(`select id from daily_customers where submission_id = $1`, [s.id]))[0]?.id ?? null;
  }
  return { s, approvedId };
}

export async function approveSubmission(id: number) {
  const admin = await requirePermission("review");
  const { s, approvedId } = await copyToLive(id);
  await q(
    `update submissions set status='approved', reviewed_by=$2, reviewed_at=now(), approved_id=$3, updated_at=now() where id=$1`,
    [id, admin.id, approvedId]);
  const label = s.kind === "sale" ? `${s.item} · ${s.qty} ชิ้น` : `ลูกค้า ${s.customers} ราย (${s.entry_date})`;
  await logAudit("approve", "submission", id, `อนุมัติของ ${s.ba || "-"}: ${label}`);
  revalidatePath("/review"); revalidatePath("/my"); revalidatePath("/sales"); revalidatePath("/");
}

export async function rejectSubmission(id: number, note?: string) {
  const admin = await requirePermission("review");
  const [s] = await q<{ status: string; ba: string; kind: string }>(
    `select status, ba, kind from submissions where id = $1`, [id]);
  if (!s) throw new Error("ไม่พบรายการ");
  if (s.status === "approved") throw new Error("อนุมัติไปแล้ว ตีกลับไม่ได้");
  await q(
    `update submissions set status='rejected', reviewed_by=$2, reviewed_at=now(), review_note=$3, updated_at=now() where id=$1`,
    [id, admin.id, note?.trim() || null]);
  await logAudit("reject", "submission", id, `ตีกลับของ ${s.ba || "-"}${note ? ` · ${note}` : ""}`);
  revalidatePath("/review"); revalidatePath("/my");
}

export async function approveMany(ids: number[]) {
  const admin = await requirePermission("review");
  let ok = 0;
  const failed: number[] = [];
  for (const id of ids) {
    try {
      const { approvedId } = await copyToLive(id);
      await q(`update submissions set status='approved', reviewed_by=$2, reviewed_at=now(), approved_id=$3, updated_at=now() where id=$1 and status <> 'approved'`,
        [id, admin.id, approvedId]);
      ok++;
    } catch (e) {
      // Don't silently swallow real DB errors — log them and report the count.
      console.error("[approveMany] failed to approve", id, e);
      failed.push(id);
    }
  }
  await logAudit("approve", "submission", null, `อนุมัติหลายรายการ · สำเร็จ ${ok}${failed.length ? ` · ล้มเหลว ${failed.length}` : ""} รายการ`);
  revalidatePath("/review"); revalidatePath("/my"); revalidatePath("/sales"); revalidatePath("/");
  if (failed.length) throw new Error(`อนุมัติสำเร็จ ${ok} รายการ · ล้มเหลว ${failed.length} รายการ กรุณาลองใหม่`);
  return ok;
}

// Undo an approval: pull the copied live row back out and return the
// submission(s) to 'pending' so the bill re-enters the review queue. Used when
// an admin approved a bill by mistake. Reviewer-only.
export async function unapproveMany(ids: number[]) {
  const admin = await requirePermission("review");
  let ok = 0;
  const failed: number[] = [];
  for (const id of ids) {
    try {
      const [s] = await q<{ kind: string; status: string; approved_id: number | null }>(
        `select kind, status, approved_id from submissions where id = $1`, [id]);
      if (!s || s.status !== "approved") continue;   // only approved rows can be undone
      // remove the live sale/customer row this approval created (restores stock & dashboard).
      // approved_id points at the exact inserted row (most precise); submission_id is a
      // belt-and-suspenders fallback. `tbl` is a fixed literal chosen by kind — not user input.
      const tbl = s.kind === "sale" ? "sales" : "daily_customers";
      if (s.approved_id != null) await q(`delete from ${tbl} where id = $1`, [s.approved_id]);
      await q(`delete from ${tbl} where submission_id = $1`, [id]);
      const res = await q<{ id: number }>(
        `update submissions set status='pending', reviewed_by=null, reviewed_at=null, approved_id=null, review_note=null, updated_at=now()
         where id=$1 and status='approved' returning id`, [id]);
      if (res.length) ok++;
    } catch (e) { console.error("[unapproveMany] failed", id, e); failed.push(id); }
  }
  await logAudit("update", "submission", null, `ยกเลิกการอนุมัติ ${ok} รายการ`);
  revalidatePath("/review"); revalidatePath("/my"); revalidatePath("/sales"); revalidatePath("/");
  if (failed.length) throw new Error(`ยกเลิกสำเร็จ ${ok} รายการ · ล้มเหลว ${failed.length} รายการ`);
  return ok;
}

// Reject a whole bill (all its rows) at once.
// Quick-edit the sale time for a whole bill (all its pending rows share one time).
export async function updateBillTime(ids: number[], time: string): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("review");
  if (!ids?.length) return { ok: true };
  const t = (time || "").trim();
  if (!/^\d{2}:\d{2}$/.test(t)) return { ok: false, error: "รูปแบบเวลาไม่ถูกต้อง (HH:MM)" };
  try {
    for (const id of ids) await q(`update submissions set sale_time = $2, updated_at = now() where id = $1 and status = 'pending'`, [id, t]);
  } catch (e) { console.error("[updateBillTime] failed", e); return { ok: false, error: "บันทึกเวลาไม่สำเร็จ" }; }
  await logAudit("update", "submission", null, `แก้เวลาขาย → ${t} น. (${ids.length} รายการ)`);
  revalidatePath("/review"); revalidatePath("/my");
  return { ok: true };
}

// Move bills to the trash instead of bouncing them back. Trashed (soft-deleted)
// bills drop out of the review queue and the salesperson's /my views, but can be
// restored or purged on /trash. Returns { ok, error } so a pre-migration prod (no
// `deleted_at` column yet) shows a clear message instead of a masked digest error.
export async function trashMany(ids: number[]): Promise<{ ok: boolean; error?: string; count?: number }> {
  await requirePermission("review");
  if (!ids?.length) return { ok: true, count: 0 };
  let ok = 0;
  const refs = new Set<string>();
  try {
    for (const id of ids) {
      const res = await q<{ id: number; receipt_no: string | null }>(
        `update submissions set deleted_at = now(), updated_at = now()
         where id = $1 and status <> 'approved' and deleted_at is null returning id, receipt_no`, [id]);
      if (res.length) { ok++; if (res[0].receipt_no) refs.add(res[0].receipt_no); }
    }
  } catch (e: any) {
    if (e?.code === "42703") return { ok: false, error: "ยังไม่ได้ติดตั้งระบบถังขยะบิลบนเซิร์ฟเวอร์ (ต้องรัน SQL 0011 ก่อน)" };
    console.error("[trashMany] failed", e);
    return { ok: false, error: "ลบไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
  // NOTE: do NOT delete bill_payments here — a trashed bill's lines are soft-deleted so
  // it's already excluded from every cash/paymentMix reader (they only sum tenders for
  // alive split bills). Deleting them here made a trash→restore permanently lose the
  // split amounts. Keep them so restore is lossless; purgeSubmission cleans them on
  // permanent delete.
  void refs;
  await logAudit("delete", "submission", null, `ลบบิลลงถังขยะ ${ok} รายการ`);
  revalidatePath("/review"); revalidatePath("/my"); revalidatePath("/trash");
  return { ok: true, count: ok };
}

// Restore a trashed bill back to the review queue (status is unchanged — a pending
// bill returns as pending). Gated by the trash permission (the /trash page).
export async function restoreSubmission(id: number): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("trash");
  try {
    await q(`update submissions set deleted_at = null, updated_at = now() where id = $1`, [id]);
  } catch (e: any) {
    if (e?.code === "42703") return { ok: false, error: "ยังไม่ได้ติดตั้งระบบถังขยะบิล (ต้องรัน SQL 0011 ก่อน)" };
    console.error("[restoreSubmission] failed", e);
    return { ok: false, error: "กู้คืนไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
  await logAudit("restore", "submission", id, "กู้คืนบิลจากถังขยะ");
  revalidatePath("/trash"); revalidatePath("/review"); revalidatePath("/my");
  return { ok: true };
}

// Permanently delete a trashed bill (and its orphaned photos/split records).
export async function purgeSubmission(id: number): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("trash");
  const [ref] = await q<{ receipt_no: string | null }>(`select receipt_no from submissions where id = $1`, [id]);
  await q(`delete from submissions where id = $1`, [id]);
  if (ref?.receipt_no) {
    const [left] = await q<{ n: number }>(`select count(*)::int n from submissions where receipt_no = $1`, [ref.receipt_no]);
    if (!left?.n) {
      await q(`delete from bill_attachments where bill_ref = $1`, [ref.receipt_no]);
      try { await q(`delete from bill_payments where bill_ref = $1`, [ref.receipt_no]); } catch {}
    }
  }
  await logAudit("purge", "submission", id, "ลบบิลถาวรจากถังขยะ");
  revalidatePath("/trash");
  return { ok: true };
}

export async function rejectMany(ids: number[], note?: string) {
  const admin = await requirePermission("review");
  let ok = 0;
  const refs = new Set<string>();
  for (const id of ids) {
    try {
      const res = await q<{ id: number; receipt_no: string | null }>(
        `update submissions set status='rejected', reviewed_by=$2, reviewed_at=now(), review_note=$3, updated_at=now()
         where id=$1 and status <> 'approved' returning id, receipt_no`,
        [id, admin.id, note?.trim() || null]);
      if (res.length) { ok++; if (res[0].receipt_no) refs.add(res[0].receipt_no); }
    } catch (e) { console.error("[rejectMany] failed", id, e); }
  }
  // a rejected split bill's per-channel amounts must stop counting toward cash
  try { for (const ref of refs) await q(`delete from bill_payments where bill_ref = $1`, [ref]); } catch {}
  await logAudit("reject", "submission", null, `ตีกลับ ${ok} รายการ${note ? ` · ${note}` : ""}`);
  revalidatePath("/review"); revalidatePath("/my");
  return ok;
}
