"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requisitionSchema } from "./schemas";
import { logAudit } from "@/lib/audit";
import { requirePermission, requireUser } from "@/lib/auth/require-user";

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
  await requirePermission("requisitions");
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
         data.address || null, data.remark || null, data.status || "draft"]);
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
  await requirePermission("requisitions");
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

/** Admin override: force a requisition to any status. Stamps approved/received
 *  timestamps so downstream logic (stock, sync) stays consistent. */
export async function setRequisitionStatus(id: number, status: string): Promise<{ ok: boolean; error?: string }> {
  const me = await requirePermission("requisitions");
  try {
    // keep the lifecycle timestamps in sync with the forced status
    const stamp =
      status === "approved" ? `, approved_at = coalesce(approved_at, now()), approved_by = coalesce(approved_by, ${me.id})`
      : status === "received" ? `, received_at = coalesce(received_at, now()), received_by = coalesce(received_by, ${me.id})`
      : "";
    await q(`update purchase_orders set status=$2 ${stamp} where id=$1`, [id, status]);
    await logAudit("update", "requisition", id, `สถานะ → ${status}`);
    revalidatePath(`/requisitions/${id}`); revalidatePath("/requisitions");
    revalidatePath("/my"); revalidatePath("/stock");   // received affects branch stock
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "42703") return { ok: false, error: "ยังไม่ได้ติดตั้งคอลัมน์ (รัน SQL 0021)" };
    console.error("[setRequisitionStatus]", e);
    return { ok: false, error: "เปลี่ยนสถานะไม่สำเร็จ" };
  }
}

/** Admin approves a requisition → status 'approved', sent to the branch to receive. */
export async function approveRequisition(id: number): Promise<{ ok: boolean; error?: string }> {
  const me = await requirePermission("requisitions");
  try {
    await q(`update purchase_orders set status='approved', approved_at=now(), approved_by=$2
             where id=$1 and coalesce(status,'') in ('draft','issued','delivered')`, [id, me.id]);
    await logAudit("update", "requisition", id, "อนุมัติใบเบิก");
    revalidatePath(`/requisitions/${id}`); revalidatePath("/requisitions"); revalidatePath("/my");
    return { ok: true };
  } catch (e: any) { if (e?.code === "42703") return { ok: false, error: "ยังไม่ได้ติดตั้งคอลัมน์ (รัน SQL 0021)" }; console.error("[approveRequisition]", e); return { ok: false, error: "อนุมัติไม่สำเร็จ" }; }
}

/** Admin un-approves (only before the branch receives) → back to draft. */
export async function unapproveRequisition(id: number): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("requisitions");
  try {
    const res = await q<{ id: number }>(`update purchase_orders set status='draft', approved_at=null, approved_by=null
             where id=$1 and status='approved' returning id`, [id]);
    if (!res.length) return { ok: false, error: "ยกเลิกไม่ได้ (รับของแล้ว หรือยังไม่อนุมัติ)" };
    await logAudit("update", "requisition", id, "ยกเลิกการอนุมัติใบเบิก");
    revalidatePath(`/requisitions/${id}`); revalidatePath("/requisitions"); revalidatePath("/my");
    return { ok: true };
  } catch (e) { console.error("[unapproveRequisition]", e); return { ok: false, error: "ยกเลิกไม่สำเร็จ" }; }
}

/** Branch staff confirms receipt → records received qty per line + remark, marks
 *  the requisition 'received' (which is what makes it count toward branch stock). */
export async function receiveRequisition(id: number, lines: { id: number; received_qty: number; remark?: string }[], remark?: string): Promise<{ ok: boolean; error?: string }> {
  const me = await requireUser();
  try {
    const [po] = await q<{ status: string }>(`select status from purchase_orders where id=$1 and deleted_at is null`, [id]);
    if (!po) return { ok: false, error: "ไม่พบใบเบิก" };
    if (!["delivered", "approved"].includes(po.status)) return { ok: false, error: "ใบเบิกนี้รับไม่ได้ (ยังไม่ส่ง/อนุมัติ หรือรับแล้ว)" };
    for (const l of lines || []) {
      await q(`update po_items set received_qty=$2, line_remark=$3 where id=$1 and po_id=$4`,
        [l.id, Math.max(0, Math.round(Number(l.received_qty) || 0)), (l.remark || "").trim() || null, id]);
    }
    await q(`update purchase_orders set status='received', received_at=now(), received_by=$2,
             remark = coalesce(nullif($3,''), remark) where id=$1`, [id, me.id, (remark || "").trim()]);
    await logAudit("update", "requisition", id, `รับของเข้าสาขา (${(lines || []).length} รายการ)`);
    revalidatePath(`/requisitions/${id}`); revalidatePath("/requisitions"); revalidatePath("/my"); revalidatePath("/my/stock"); revalidatePath("/stock");
    return { ok: true };
  } catch (e: any) { if (e?.code === "42703") return { ok: false, error: "ยังไม่ได้ติดตั้งคอลัมน์ (รัน SQL 0021)" }; console.error("[receiveRequisition]", e); return { ok: false, error: "รับของไม่สำเร็จ ลองใหม่" }; }
}

/** Soft delete → moves the requisition to ถังขยะ (restorable). */
export async function deleteRequisition(id: number) {
  await requirePermission("requisitions");
  const [po] = await q<{ po_number: string }>(`select po_number from purchase_orders where id=$1`, [id]);
  await q(`update purchase_orders set deleted_at = now() where id=$1`, [id]);
  await logAudit("delete", "requisition", id, po?.po_number);
  revalidatePath("/requisitions");
  revalidatePath("/trash");
  redirect("/requisitions");
}

export async function restoreRequisition(id: number) {
  await requirePermission("requisitions");
  const [po] = await q<{ po_number: string }>(`select po_number from purchase_orders where id=$1`, [id]);
  await q(`update purchase_orders set deleted_at = null where id=$1`, [id]);
  await logAudit("restore", "requisition", id, po?.po_number);
  revalidatePath("/requisitions");
  revalidatePath("/trash");
}

/** Permanent delete from ถังขยะ. */
export async function purgeRequisition(id: number) {
  await requirePermission("requisitions");
  const [po] = await q<{ po_number: string }>(`select po_number from purchase_orders where id=$1`, [id]);
  await q(`delete from purchase_orders where id=$1`, [id]);
  await logAudit("purge", "requisition", id, po?.po_number);
  revalidatePath("/trash");
}
