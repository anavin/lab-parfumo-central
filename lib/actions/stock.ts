"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/require-user";
import { resolveBranch, branchName } from "@/lib/branches";
import { logAudit } from "@/lib/audit";
import { stockLive } from "@/lib/queries";

export type StockAdjustment = {
  id: number; branch: string; barcode: string; scent: string; size: string;
  qty: number; note: string | null; created_by_name: string | null; created_at: string;
};

/** Admin manual stock adjustment — a signed delta for one product at one branch
 *  (used to enter existing/opening stock, or correct counts). Folds into stockLive. */
export async function addStockAdjustment(input: { branch: string; barcode: string; qty: number; note?: string }): Promise<{ ok: boolean; error?: string }> {
  const me = await requirePermission("requisitions");
  const branch = resolveBranch(input.branch);
  const barcode = (input.barcode || "").trim();
  const qty = Math.round(Number(input.qty) || 0);
  if (!barcode) return { ok: false, error: "กรุณาเลือกสินค้า" };
  if (!qty) return { ok: false, error: "กรุณาระบุจำนวน (บวก = เพิ่ม, ลบ = ลด)" };
  try {
    const [p] = await q<{ id: number; scent: string; size: string }>(`select id, scent, size from products where barcode = $1 limit 1`, [barcode]);
    if (!p) return { ok: false, error: "ไม่พบสินค้าตามบาร์โค้ดนี้" };
    await q(`insert into stock_adjustments (branch, product_id, barcode, scent, size, qty, note, created_by)
             values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [branch, p.id, barcode, p.scent, p.size, qty, (input.note || "").trim() || null, me.id]);
    await logAudit("create", "stock", null, `ปรับสต๊อก ${branchName(branch)} · ${p.scent} ${p.size} · ${qty > 0 ? "+" : ""}${qty}`);
    revalidatePath("/stock"); revalidatePath("/my");
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งตาราง (รัน SQL 0023)" };
    console.error("[addStockAdjustment]", e);
    return { ok: false, error: "บันทึกไม่สำเร็จ" };
  }
}

/** Close a branch's stock: return everything still on hand to the central warehouse. Posts a
 *  negative stock_adjustment (= −remaining) for every product with stock left, zeroing the
 *  branch. The central warehouse is restocked via the requisition flow (not tracked here), so
 *  this only removes from the branch. Idempotent-ish: a second run finds remaining=0 → no-op. */
export async function returnBranchStock(branchInput: string, dateStr: string): Promise<{ ok: boolean; error?: string; items?: number; units?: number }> {
  const me = await requirePermission("requisitions");
  const branch = resolveBranch(branchInput);
  try {
    const rows = (await stockLive(branch)).filter((r) => (Number(r.remaining) || 0) > 0);
    if (!rows.length) return { ok: true, items: 0, units: 0 };
    const note = `คืนเข้าคลัง ${dateStr}`;
    const payload = rows.map((r) => ({ barcode: r.barcode, scent: r.scent, size: r.size, remaining: Math.round(Number(r.remaining) || 0) }));
    // one atomic INSERT … SELECT from the JSON so a partial failure can't half-return the branch
    await q(
      `insert into stock_adjustments (branch, product_id, barcode, scent, size, qty, note, created_by)
       select $1, (select id from products where barcode = r.barcode limit 1), r.barcode, r.scent, r.size, -r.remaining, $3, $4
       from json_to_recordset($2::json) as r(barcode text, scent text, size text, remaining int)`,
      [branch, JSON.stringify(payload), note, me.id]);
    const units = payload.reduce((s, r) => s + r.remaining, 0);
    await logAudit("update", "stock", null, `คืนสต๊อกเข้าคลัง ${branchName(branch)} · ${rows.length} รายการ · ${units} ชิ้น`);
    revalidatePath("/stock"); revalidatePath("/my");
    return { ok: true, items: rows.length, units };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งตาราง (รัน SQL 0023)" };
    console.error("[returnBranchStock]", e);
    return { ok: false, error: "คืนสต๊อกไม่สำเร็จ" };
  }
}

/** Recent adjustments (optionally for one branch) for the admin list. */
export async function listStockAdjustments(branch: string | null = null): Promise<StockAdjustment[]> {
  try {
    const where = branch ? `where a.branch = $1` : ``;
    const args = branch ? [resolveBranch(branch)] : [];
    return await q<StockAdjustment>(`
      select a.id, a.branch, a.barcode, a.scent, a.size, a.qty::float qty, a.note,
             u.full_name created_by_name, a.created_at::text created_at
      from stock_adjustments a left join users u on u.id = a.created_by
      ${where} order by a.created_at desc, a.id desc limit 100`, args);
  } catch (e: any) { if (e?.code === "42P01") return []; throw e; }
}

export async function deleteStockAdjustment(id: number): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("requisitions");
  try {
    await q(`delete from stock_adjustments where id = $1`, [Number(id)]);
    await logAudit("delete", "stock", id, "ลบรายการปรับสต๊อก");
    revalidatePath("/stock"); revalidatePath("/my");
    return { ok: true };
  } catch (e) { console.error("[deleteStockAdjustment]", e); return { ok: false, error: "ลบไม่สำเร็จ" }; }
}
