"use server";
import { q } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-user";
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
    const [u] = await q<{ barcode: string | null; scent: string | null; size: string | null; status: string; branch: string; sold_receipt_no: string | null }>(
      `select barcode, scent, size, status, branch, sold_receipt_no from sku_units where sku = $1`, [code]);
    if (!u) return { ok: false, error: `ไม่พบ SKU "${code}" ในระบบ` };
    if (u.status === "sold") return { ok: false, error: `SKU นี้ขายไปแล้ว${u.sold_receipt_no ? ` (บิล ${u.sold_receipt_no})` : ""}` };
    if (u.status !== "in_stock") return { ok: false, error: `SKU นี้สถานะ ${u.status} ขายไม่ได้` };
    if (normalizeBranch(u.branch) !== normalizeBranch(branch)) return { ok: false, error: `SKU นี้อยู่สาขา ${branchName(u.branch)} ไม่ใช่สาขานี้` };
    const want = String(barcode || "").trim();
    if (want && u.barcode && u.barcode !== want) return { ok: false, error: "SKU นี้เป็นของสินค้าอื่น (บาร์โค้ดไม่ตรง)" };
    return { ok: true, sku: code, barcode: u.barcode, scent: u.scent, size: u.size };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งระบบ SKU" };
    console.error("[checkSku]", e);
    return { ok: false, error: "ตรวจ SKU ไม่สำเร็จ ลองใหม่" };
  }
}
