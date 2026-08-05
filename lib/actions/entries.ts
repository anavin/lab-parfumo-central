"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { saleSchema, customerDaySchema, cashSchema } from "./schemas";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/require-user";
import { monthLabel } from "@/lib/month";

export async function createSale(input: unknown) {
  const user = await requirePermission("sales");
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const d = parsed.data;
  const total = d.qty * (d.unit_price ?? 0) - (d.discount ?? 0);
  await q(
    `insert into sales (source, month, sale_date, sale_time, ba, receipt_no, item, barcode, size, qty, unit_price, discount, total, paid, payment_channel, nation, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13,$14,$15,$16)`,
    [d.source || "CTW", monthLabel(d.sale_date), d.sale_date, d.sale_time || null, d.ba || null,
     d.receipt_no || null, d.item, d.barcode || null, d.size || null,
     d.qty, d.unit_price ?? 0, d.discount ?? 0, total, d.payment_channel || null, d.nation || null, user.id]);
  await q(`update sales s set product_id = p.id from products p where p.barcode = s.barcode and s.product_id is null`);
  await logAudit("create", "sale", null, `${d.item} · ${d.qty} ชิ้น · ฿${Math.round(total).toLocaleString()}`);
  revalidatePath("/sales"); revalidatePath("/stock"); revalidatePath("/");
}

export async function createCustomerDay(input: unknown) {
  const user = await requirePermission("sales");
  const parsed = customerDaySchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const d = parsed.data;
  await q(
    `insert into daily_customers (month, cust_date, ba, customers, sell_amount, thai, foreign_cnt, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [monthLabel(d.cust_date), d.cust_date, d.ba || null, d.customers, d.sell_amount ?? 0, d.thai ?? null, d.foreign ?? null, user.id]);
  await logAudit("create", "customer", null, `${d.cust_date} · ${d.customers} ราย`);
  revalidatePath("/sales"); revalidatePath("/");
}

export async function createCashEntry(input: unknown) {
  await requirePermission("cash");
  const parsed = cashSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const d = parsed.data;
  await q(`insert into cash_entries (cash_date, description, amount, type) values ($1,$2,$3,$4)`,
    [d.cash_date, d.description, d.amount, d.type || null]);
  await logAudit("create", "cash", null, `${d.description} · ฿${Math.round(d.amount).toLocaleString()}`);
  revalidatePath("/cash"); revalidatePath("/");
}
