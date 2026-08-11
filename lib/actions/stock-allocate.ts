"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/require-user";
import { logAudit } from "@/lib/audit";
import { normalizeBranch, branchStoreCode, branchName } from "@/lib/branches";
import { ALLOC_STATUS } from "@/lib/stock-alloc";

export type AllocItem = { barcode: string; scent: string; size: string; qty: number; product_id?: number | null };

async function nextAllocNo(code: string, date: string): Promise<string> {
  const [y, m, d] = date.split("-");
  const prefix = `STK-${code}-${(y || "").slice(2)}${(m || "").padStart(2, "0")}${(d || "").padStart(2, "0")}-`;
  const [row] = await q<{ n: number }>(
    `select coalesce(max(substring(po_number from '[0-9]+$')::int), 0) n
     from purchase_orders where po_number like $1`, [`${prefix}%`]);
  return prefix + String((row?.n ?? 0) + 1).padStart(2, "0");
}

/** Allocate stock (scent + qty lines) to a branch — recorded as a mini purchase order. */
export async function allocateBranchStock(branch: string, date: string, items: AllocItem[]): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("stock");
  const br = normalizeBranch(branch);
  const label = branchStoreCode(br);
  const orderDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);
  const lines = (items || [])
    .map((i) => ({ ...i, qty: Math.round(Number(i.qty) || 0) }))
    .filter((i) => (i.barcode || i.scent) && i.qty > 0);
  if (!lines.length) return { ok: false, error: "ยังไม่มีรายการ (เลือกกลิ่น + ใส่จำนวน)" };
  try {
    const poNo = await nextAllocNo(br, orderDate);
    const [po] = await q<{ id: number }>(
      `insert into purchase_orders (po_number, version, order_date, branch_label, status)
       values ($1,$2,$3,$4,$5) returning id`,
      [poNo, `${poNo}-1`, orderDate, label, ALLOC_STATUS]);
    let ln = 0;
    for (const i of lines) {
      await q(`insert into po_items (po_id, line_no, barcode, product_id, scent, size, qty) values ($1,$2,$3,$4,$5,$6,$7)`,
        [po.id, ++ln, i.barcode || null, i.product_id ?? null, i.scent || null, i.size || null, i.qty]);
    }
    // backfill product_id from barcode where the caller didn't supply it
    await q(`update po_items i set product_id = p.id from products p
             where i.po_id = $1 and i.product_id is null and p.barcode = i.barcode`, [po.id]);
    await logAudit("create", "requisition", po.id, `จัดสต๊อกเข้า ${branchName(br)} · ${lines.length} รายการ · ${lines.reduce((s, i) => s + i.qty, 0)} ชิ้น`);
    revalidatePath("/stock"); revalidatePath("/stock/allocate");
    return { ok: true };
  } catch (e: any) {
    console.error("[allocateBranchStock] failed", e);
    return { ok: false, error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
}

/** Remove an allocation (soft-delete so it stops counting toward branch stock). */
export async function deleteAllocation(poId: number): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("stock");
  try {
    await q(`update purchase_orders set deleted_at = now() where id = $1 and status = $2`, [poId, ALLOC_STATUS]);
    revalidatePath("/stock"); revalidatePath("/stock/allocate");
    return { ok: true };
  } catch (e) { console.error("[deleteAllocation] failed", e); return { ok: false, error: "ลบไม่สำเร็จ" }; }
}
