"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requisitionSchema } from "./schemas";
import { logAudit } from "@/lib/audit";

export type ReqItemInput = { barcode: string; scent: string; size: string; qty: number; product_id?: number | null };
export type ReqInput = {
  order_date: string;
  branch_label: string;
  store_no?: string;
  delivery_number?: string;
  phone?: string;
  shipping_name?: string;
  address?: string;
  remark?: string;
  status?: string;
  items: ReqItemInput[];
};

/** Generate WPO{yy}{mm}{dd}{seq3} unique per day. Uses MAX(sequence)+1 (not
 * count) so a purge or a gap never reuses an existing number; date parts come
 * from the string to stay timezone-stable. */
async function nextPoNumber(orderDate: string): Promise<string> {
  const [y, m, dd] = orderDate.split("-");
  const prefix = `WPO${y.slice(2)}${(m || "").padStart(2, "0")}${(dd || "").padStart(2, "0")}`;
  const [row] = await q<{ n: number }>(
    `select coalesce(max(substring(po_number from '[0-9]{3}$')::int), 0) n
     from purchase_orders where po_number like $1`, [`${prefix}%`]);
  const seq = String((row?.n ?? 0) + 1).padStart(3, "0");
  return `${prefix}${seq}`;
}

async function replaceItems(poId: number, items: ReqItemInput[]) {
  await q(`delete from po_items where po_id = $1`, [poId]);
  let line = 1;
  for (const it of items) {
    if (!it.scent && !it.barcode) continue;
    await q(
      `insert into po_items (po_id, line_no, barcode, product_id, scent, size, qty)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [poId, line++, it.barcode || null, it.product_id ?? null, it.scent || null, it.size || null, Number(it.qty) || 0]);
  }
  await q(
    `update po_items i set product_id = p.id from products p
     where p.barcode = i.barcode and i.po_id = $1 and i.product_id is null`, [poId]);
}

export async function createRequisition(input: ReqInput) {
  const parsed = requisitionSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const data = parsed.data;
  // Two same-day requisitions can compute the same next number concurrently;
  // the unique(po_number,version) constraint then throws 23505. Retry with a
  // freshly-computed number a few times instead of surfacing a raw DB error.
  let po: { id: number } | undefined;
  let po_number = "";
  for (let attempt = 0; attempt < 6; attempt++) {
    po_number = await nextPoNumber(data.order_date);
    try {
      [po] = await q<{ id: number }>(
        `insert into purchase_orders
           (po_number, version, order_date, branch_label, store_no, delivery_number, phone, shipping_name, address, remark, status)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id`,
        [po_number, `${po_number}-1`, data.order_date, data.branch_label, data.store_no || null,
         data.delivery_number || null, data.phone || null, data.shipping_name || null,
         data.address || null, data.remark || null, data.status || "issued"]);
      break;
    } catch (e: any) {
      if (e?.code === "23505" && attempt < 5) continue;   // number taken → try next
      throw e;
    }
  }
  if (!po) throw new Error("สร้างเลขใบเบิกไม่สำเร็จ กรุณาลองใหม่");
  await replaceItems(po.id, data.items);
  await logAudit("create", "requisition", po.id, `${po_number} · ${data.branch_label} · ${data.items.length} รายการ`);
  revalidatePath("/requisitions");
  redirect(`/requisitions/${po.id}`);
}

export async function updateRequisition(id: number, input: ReqInput) {
  const parsed = requisitionSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const data = parsed.data;
  await q(
    `update purchase_orders set order_date=$2, branch_label=$3, store_no=$4,
       delivery_number=$5, phone=$6, shipping_name=$7, address=$8, remark=$9, status=$10
     where id=$1`,
    [id, data.order_date, data.branch_label, data.store_no || null,
     data.delivery_number || null, data.phone || null, data.shipping_name || null,
     data.address || null, data.remark || null, data.status || "issued"]);
  await replaceItems(id, data.items);
  const [po] = await q<{ po_number: string }>(`select po_number from purchase_orders where id=$1`, [id]);
  await logAudit("update", "requisition", id, po?.po_number);
  revalidatePath(`/requisitions/${id}`);
  revalidatePath("/requisitions");
  redirect(`/requisitions/${id}`);
}

export async function setRequisitionStatus(id: number, status: string) {
  await q(`update purchase_orders set status=$2 where id=$1`, [id, status]);
  await logAudit("update", "requisition", id, `สถานะ → ${status}`);
  revalidatePath(`/requisitions/${id}`);
  revalidatePath("/requisitions");
}

/** Soft delete → moves the requisition to ถังขยะ (restorable). */
export async function deleteRequisition(id: number) {
  const [po] = await q<{ po_number: string }>(`select po_number from purchase_orders where id=$1`, [id]);
  await q(`update purchase_orders set deleted_at = now() where id=$1`, [id]);
  await logAudit("delete", "requisition", id, po?.po_number);
  revalidatePath("/requisitions");
  revalidatePath("/trash");
  redirect("/requisitions");
}

export async function restoreRequisition(id: number) {
  const [po] = await q<{ po_number: string }>(`select po_number from purchase_orders where id=$1`, [id]);
  await q(`update purchase_orders set deleted_at = null where id=$1`, [id]);
  await logAudit("restore", "requisition", id, po?.po_number);
  revalidatePath("/requisitions");
  revalidatePath("/trash");
}

/** Permanent delete from ถังขยะ. */
export async function purgeRequisition(id: number) {
  const [po] = await q<{ po_number: string }>(`select po_number from purchase_orders where id=$1`, [id]);
  await q(`delete from purchase_orders where id=$1`, [id]);
  await logAudit("purge", "requisition", id, po?.po_number);
  revalidatePath("/trash");
}
