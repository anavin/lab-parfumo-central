"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requirePermission, requireAnyPermission } from "@/lib/auth/require-user";
import { normalizeBranch, branchName } from "@/lib/branches";

export type SkuCheck =
  | { ok: true; sku: string; barcode: string | null; scent: string | null; size: string | null }
  | { ok: false; error: string };

/** Live validation when the cashier scans a SKU on the sale page. Confirms the unit exists, is
 *  still in_stock, sits at this branch, and (when the unit carries a barcode) matches the product
 *  on the line. Returns a friendly Thai error otherwise. */
export async function checkSku(sku: string, branch: string, barcode?: string): Promise<SkuCheck> {
  await requirePermission("my_sales");
  const code = String(sku || "").trim();
  if (!code) return { ok: false, error: "ไม่มีรหัส SKU" };
  try {
    // match ignoring spaces + case so a sticker read as "LAB03696A" still finds "LAB 03696 A".
    // Return the STORED sku so the bill links to the exact canonical value.
    const [u] = await q<{ sku: string; barcode: string | null; scent: string | null; size: string | null; status: string; branch: string; sold_receipt_no: string | null }>(
      `select sku, barcode, scent, size, status, branch, sold_receipt_no from sku_units
       where upper(regexp_replace(sku, '\\s', '', 'g')) = upper(regexp_replace($1, '\\s', '', 'g')) limit 1`, [code]);
    if (!u) return { ok: false, error: `ไม่พบ SKU "${code}" ในระบบ` };
    if (u.status === "sold") return { ok: false, error: `SKU นี้ขายไปแล้ว${u.sold_receipt_no ? ` (บิล ${u.sold_receipt_no})` : ""}` };
    if (u.status !== "in_stock") return { ok: false, error: `SKU นี้สถานะ ${u.status} ขายไม่ได้` };
    if (normalizeBranch(u.branch) !== normalizeBranch(branch)) return { ok: false, error: `SKU นี้อยู่สาขา ${branchName(u.branch)} ไม่ใช่สาขานี้` };
    const want = String(barcode || "").trim();
    if (want && u.barcode && u.barcode !== want) return { ok: false, error: "SKU นี้เป็นของสินค้าอื่น (บาร์โค้ดไม่ตรง)" };
    return { ok: true, sku: u.sku, barcode: u.barcode, scent: u.scent, size: u.size };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งระบบ SKU" };
    console.error("[checkSku]", e);
    return { ok: false, error: "ตรวจ SKU ไม่สำเร็จ ลองใหม่" };
  }
}

export type SkuAdd = { ok: true; scent: string | null; size: string | null; already?: boolean } | { ok: false; error: string };
/** Manually register an existing SKU sticker into stock at a branch (for stock that didn't arrive
 *  with a SKU from the warehouse). Picks the product by barcode, records the unit as in_stock.
 *  Manager-only. Rejects a SKU that already exists (so a sold unit can't be silently reset). */
export async function addSkuUnit(input: { sku: string; barcode: string; branch: string }): Promise<SkuAdd> {
  // sales staff enroll SKUs while counting stock; managers add them from the /stock SKU tab
  const me = await requireAnyPermission(["my_sales", "requisitions"]);
  const sku = String(input.sku || "").trim();
  const barcode = String(input.barcode || "").trim();
  const branch = normalizeBranch(input.branch);
  if (!sku) return { ok: false, error: "ไม่มีรหัส SKU" };
  if (!barcode) return { ok: false, error: "กรุณาเลือกสินค้าก่อน" };
  try {
    const [p] = await q<{ scent: string | null; size: string | null }>(`select scent, size from products where barcode = $1`, [barcode]);
    if (!p) return { ok: false, error: "ไม่พบสินค้าตามบาร์โค้ดนี้" };
    const [ex] = await q<{ status: string; scent: string | null; size: string | null }>(
      `select status, scent, size from sku_units where upper(regexp_replace(sku, '\\s', '', 'g')) = upper(regexp_replace($1, '\\s', '', 'g')) limit 1`, [sku]);
    if (ex) {
      if (ex.status === "sold") return { ok: false, error: `SKU "${sku}" ขายไปแล้ว` };
      // already in_stock → nothing to do, but it's fine (the bottle is already tracked), not an error
      return { ok: true, scent: ex.scent, size: ex.size, already: true };
    }
    await q(`insert into sku_units (sku, barcode, scent, size, branch, received_by, status, received_at)
             values ($1,$2,$3,$4,$5,$6,'in_stock', now())`,
      [sku, barcode, p.scent, p.size, branch, me.id]);
    revalidatePath("/stock");
    return { ok: true, scent: p.scent, size: p.size };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งระบบ SKU (รัน migration 0036)" };
    console.error("[addSkuUnit]", e);
    return { ok: false, error: "เพิ่ม SKU ไม่สำเร็จ ลองใหม่" };
  }
}

/** Edit one SKU unit (manager-only): reassign product (by barcode), move branch, or change status.
 *  Setting any status other than 'sold' also clears the sold bill link (so reverting a mistaken
 *  sale frees the unit). `sku` must be the exact stored value. */
export async function updateSkuUnit(input: { sku: string; barcode?: string; branch?: string; status?: string }): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("requisitions");
  const sku = String(input.sku || "").trim();
  if (!sku) return { ok: false, error: "ไม่มีรหัส SKU" };
  try {
    const [u] = await q<{ sku: string }>(`select sku from sku_units where sku = $1`, [sku]);
    if (!u) return { ok: false, error: "ไม่พบ SKU นี้" };
    const sets: string[] = []; const args: any[] = [sku]; let i = 2;
    if (input.barcode) {
      const [p] = await q<{ scent: string | null; size: string | null }>(`select scent, size from products where barcode = $1`, [input.barcode]);
      if (!p) return { ok: false, error: "ไม่พบสินค้าตามบาร์โค้ด" };
      sets.push(`barcode=$${i++}`, `scent=$${i++}`, `size=$${i++}`); args.push(input.barcode, p.scent, p.size);
    }
    if (input.branch) { sets.push(`branch=$${i++}`); args.push(normalizeBranch(input.branch)); }
    if (input.status) {
      sets.push(`status=$${i++}`); args.push(input.status);
      if (input.status !== "sold") sets.push(`sold_submission_id=null`, `sold_receipt_no=null`, `sold_branch=null`, `sold_at=null`);
    }
    if (!sets.length) return { ok: true };
    await q(`update sku_units set ${sets.join(", ")} where sku = $1`, args);
    revalidatePath("/stock");
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ไม่มีตาราง SKU" };
    console.error("[updateSkuUnit]", e);
    return { ok: false, error: "แก้ไขไม่สำเร็จ ลองใหม่" };
  }
}

/** Delete one SKU unit (manager-only). For a wrongly-added / lost / damaged unit. */
export async function deleteSkuUnit(sku: string): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("requisitions");
  const s = String(sku || "").trim();
  if (!s) return { ok: false, error: "ไม่มีรหัส SKU" };
  try {
    await q(`delete from sku_units where sku = $1`, [s]);
    revalidatePath("/stock");
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ไม่มีตาราง SKU" };
    console.error("[deleteSkuUnit]", e);
    return { ok: false, error: "ลบไม่สำเร็จ ลองใหม่" };
  }
}
