"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { saleSchema, customerDaySchema } from "./schemas";
import { logAudit } from "@/lib/audit";
import { monthLabel } from "@/lib/month";
import { requireUser, requireAdmin } from "@/lib/auth/require-user";

// ---------------------------------------------------------------- staff: submit
// Staff entries land in `submissions` (status='pending'). Nothing touches the
// live sales/daily_customers tables until an admin approves.

export async function submitSale(input: unknown) {
  const user = await requireUser();
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const d = parsed.data;
  const total = d.qty * (d.unit_price ?? 0) - (d.discount ?? 0);
  const [row] = await q<{ id: number }>(
    `insert into submissions
       (kind, status, created_by, ba, entry_date, source, sale_time, receipt_no, item, barcode, size, qty, unit_price, discount, total, payment_channel, nation, note)
     values ('sale','pending',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     returning id`,
    [user.id, user.full_name, d.sale_date, d.source || "CTW", d.sale_time || null,
     d.receipt_no || null, d.item, d.barcode || null, d.size || null,
     d.qty, d.unit_price ?? 0, d.discount ?? 0, total, d.payment_channel || null, d.nation || null, (d as any).note || null]);
  await q(`update submissions s set product_id = p.id from products p where p.barcode = s.barcode and s.id = $1`, [row.id]);
  await logAudit("submit", "submission", row.id, `ขาย: ${d.item} · ${d.qty} ชิ้น · ฿${Math.round(total).toLocaleString()}`);
  revalidatePath("/my"); revalidatePath("/review");
}

export async function submitCustomerDay(input: unknown) {
  const user = await requireUser();
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

async function ownPending(id: number, userId: number) {
  const [row] = await q<{ id: number; kind: string; status: string; created_by: number }>(
    `select id, kind, status, created_by from submissions where id = $1`, [id]);
  if (!row) throw new Error("ไม่พบรายการ");
  if (row.created_by !== userId) throw new Error("แก้ไขได้เฉพาะรายการของตัวเอง");
  if (row.status !== "pending") throw new Error("รายการนี้ถูกตรวจแล้ว แก้ไขไม่ได้");
  return row;
}

export async function updateMySale(id: number, input: unknown) {
  const user = await requireUser();
  await ownPending(id, user.id);
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const d = parsed.data;
  const total = d.qty * (d.unit_price ?? 0) - (d.discount ?? 0);
  await q(
    `update submissions set
       entry_date=$2, source=$3, sale_time=$4, receipt_no=$5, item=$6, barcode=$7, size=$8,
       qty=$9, unit_price=$10, discount=$11, total=$12, payment_channel=$13, nation=$14, updated_at=now()
     where id=$1`,
    [id, d.sale_date, d.source || "CTW", d.sale_time || null, d.receipt_no || null, d.item,
     d.barcode || null, d.size || null, d.qty, d.unit_price ?? 0, d.discount ?? 0, total,
     d.payment_channel || null, d.nation || null]);
  await q(`update submissions s set product_id = p.id from products p where p.barcode = s.barcode and s.id = $1`, [id]);
  await logAudit("update", "submission", id, `แก้ไข: ${d.item}`);
  revalidatePath("/my"); revalidatePath("/review");
}

export async function updateMyCustomerDay(id: number, input: unknown) {
  const user = await requireUser();
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
  const user = await requireUser();
  await ownPending(id, user.id);
  await q(`delete from submissions where id = $1`, [id]);
  await logAudit("delete", "submission", id, "ลบรายการที่กรอก");
  revalidatePath("/my"); revalidatePath("/review");
}

// ---------------------------------------------------------------- admin: review
// Approving copies the row into the live table (created_by preserved) so the
// dashboard aggregates it and can break it down by salesperson.

async function copyToLive(id: number) {
  const [s] = await q<any>(`select * from submissions where id = $1`, [id]);
  if (!s) throw new Error("ไม่พบรายการ");
  if (s.status === "approved") throw new Error("อนุมัติไปแล้ว");
  let approvedId: number | null = null;
  if (s.kind === "sale") {
    const [ins] = await q<{ id: number }>(
      `insert into sales (source, month, sale_date, sale_time, ba, receipt_no, item, barcode, product_id, size, qty, unit_price, discount, total, paid, payment_channel, nation, note, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14,$15,$16,$17,$18) returning id`,
      [s.source, monthLabel(s.entry_date), s.entry_date, s.sale_time, s.ba, s.receipt_no, s.item,
       s.barcode, s.product_id, s.size, s.qty, s.unit_price, s.discount, s.total, s.payment_channel,
       s.nation, s.note, s.created_by]);
    approvedId = ins.id;
  } else {
    const [ins] = await q<{ id: number }>(
      `insert into daily_customers (month, cust_date, ba, customers, sell_amount, thai, foreign_cnt, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
      [monthLabel(s.entry_date), s.entry_date, s.ba, s.customers, s.sell_amount, s.thai, s.foreign_cnt, s.created_by]);
    approvedId = ins.id;
  }
  return { s, approvedId };
}

export async function approveSubmission(id: number) {
  const admin = await requireAdmin();
  const { s, approvedId } = await copyToLive(id);
  await q(
    `update submissions set status='approved', reviewed_by=$2, reviewed_at=now(), approved_id=$3, updated_at=now() where id=$1`,
    [id, admin.id, approvedId]);
  const label = s.kind === "sale" ? `${s.item} · ${s.qty} ชิ้น` : `ลูกค้า ${s.customers} ราย (${s.entry_date})`;
  await logAudit("approve", "submission", id, `อนุมัติของ ${s.ba || "-"}: ${label}`);
  revalidatePath("/review"); revalidatePath("/my"); revalidatePath("/sales"); revalidatePath("/");
}

export async function rejectSubmission(id: number, note?: string) {
  const admin = await requireAdmin();
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
  const admin = await requireAdmin();
  let ok = 0;
  for (const id of ids) {
    try {
      const { approvedId } = await copyToLive(id);
      await q(`update submissions set status='approved', reviewed_by=$2, reviewed_at=now(), approved_id=$3, updated_at=now() where id=$1`,
        [id, admin.id, approvedId]);
      ok++;
    } catch { /* skip already-approved / bad rows */ }
  }
  await logAudit("approve", "submission", null, `อนุมัติหลายรายการ · ${ok} รายการ`);
  revalidatePath("/review"); revalidatePath("/my"); revalidatePath("/sales"); revalidatePath("/");
  return ok;
}
