"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAnyPermission } from "@/lib/auth/require-user";
import { normalizeBranch } from "@/lib/branches";

const NORM = (col: string) => `upper(regexp_replace(${col}, '\\s', '', 'g'))`;

export type CaptureResult =
  | { ok: true; scent: string | null; size: string | null; warn?: string }
  | { ok: false; error: string };

/** Capture one physical bottle (barcode + SKU) into the fresh shelf dataset. Resolves the product
 *  for display, flags a sticker whose SKU the system already ties to a different product, and
 *  rejects a SKU already captured this round. Does NOT touch sku_units. */
export async function captureShelfUnit(input: { barcode: string; sku: string; branch: string }): Promise<CaptureResult> {
  const me = await requireAnyPermission(["my_sales", "requisitions", "stock"]);
  const barcode = String(input.barcode || "").trim();
  const sku = String(input.sku || "").trim();
  const branch = normalizeBranch(input.branch);
  if (!barcode) return { ok: false, error: "ยังไม่ได้ยิงบาร์โค้ดสินค้า" };
  if (!sku) return { ok: false, error: "ยังไม่ได้ยิง SKU" };
  try {
    const [dup] = await q<{ one: number }>(`select 1 one from shelf_capture where ${NORM("sku")} = ${NORM("$1")} and branch = upper($2) limit 1`, [sku, branch]);
    if (dup) return { ok: false, error: `SKU "${sku}" เก็บไปแล้วในรอบนี้` };
    const [p] = await q<{ scent: string | null; size: string | null }>(`select scent, size from products where barcode = $1`, [barcode]);
    let warn: string | undefined;
    try {
      const [u] = await q<{ barcode: string | null }>(`select barcode from sku_units where ${NORM("sku")} = ${NORM("$1")} limit 1`, [sku]);
      if (u && u.barcode && u.barcode !== barcode) warn = "⚠ SKU นี้ระบบผูกกับสินค้าอื่น (สติกเกอร์อาจติดผิดขวด)";
    } catch { /* sku_units not migrated — skip the cross-check */ }
    if (!p) warn = warn || "⚠ ไม่พบสินค้าตามบาร์โค้ดนี้ (เก็บไว้ แต่ยังไม่รู้กลิ่น)";
    await q(`insert into shelf_capture (branch, barcode, sku, scent, size, captured_by) values ($1,$2,$3,$4,$5,$6)`,
      [branch, barcode, sku, p?.scent ?? null, p?.size ?? null, me.id]);
    revalidatePath("/my/count"); revalidatePath("/stock");
    return { ok: true, scent: p?.scent ?? null, size: p?.size ?? null, warn };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งตาราง (รัน migration 0038)" };
    console.error("[captureShelfUnit]", e);
    return { ok: false, error: "เก็บไม่สำเร็จ ลองใหม่" };
  }
}

/** Edit a captured row: fix its SKU and/or re-point it to the right product (by barcode). */
export async function updateShelfCapture(input: { id: number; sku?: string; barcode?: string }): Promise<{ ok: boolean; error?: string }> {
  await requireAnyPermission(["my_sales", "requisitions", "stock"]);
  try {
    const [row] = await q<{ branch: string }>(`select branch from shelf_capture where id = $1`, [input.id]);
    if (!row) return { ok: false, error: "ไม่พบรายการ" };
    const sets: string[] = []; const args: any[] = [input.id]; let i = 2;
    const sku = input.sku != null ? String(input.sku).trim() : undefined;
    if (sku) {
      const [dup] = await q<{ one: number }>(`select 1 one from shelf_capture where id <> $1 and branch = $2 and ${NORM("sku")} = ${NORM("$3")} limit 1`, [input.id, row.branch, sku]);
      if (dup) return { ok: false, error: `SKU "${sku}" มีในรายการแล้ว` };
      sets.push(`sku=$${i++}`); args.push(sku);
    }
    const barcode = input.barcode != null ? String(input.barcode).trim() : undefined;
    if (barcode) {
      const [p] = await q<{ scent: string | null; size: string | null }>(`select scent, size from products where barcode = $1`, [barcode]);
      if (!p) return { ok: false, error: "ไม่พบสินค้าตามบาร์โค้ด" };
      sets.push(`barcode=$${i++}`, `scent=$${i++}`, `size=$${i++}`); args.push(barcode, p.scent, p.size);
    }
    if (!sets.length) return { ok: true };
    await q(`update shelf_capture set ${sets.join(", ")} where id = $1`, args);
    revalidatePath("/my/count"); revalidatePath("/stock");
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ไม่มีตาราง" };
    console.error("[updateShelfCapture]", e);
    return { ok: false, error: "แก้ไขไม่สำเร็จ" };
  }
}

/** Remove one captured row (wrong scan). */
export async function deleteShelfCapture(id: number): Promise<{ ok: boolean; error?: string }> {
  await requireAnyPermission(["my_sales", "requisitions", "stock"]);
  try {
    await q(`delete from shelf_capture where id = $1`, [id]);
    revalidatePath("/my/count"); revalidatePath("/stock");
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ไม่มีตาราง" };
    console.error("[deleteShelfCapture]", e);
    return { ok: false, error: "ลบไม่สำเร็จ" };
  }
}
