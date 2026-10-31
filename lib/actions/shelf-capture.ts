"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAnyPermission } from "@/lib/auth/require-user";
import { normalizeBranch, branchName } from "@/lib/branches";
import { logAudit } from "@/lib/audit";

const NORM = (col: string) => `upper(regexp_replace(${col}, '\\s', '', 'g'))`;

export type CaptureResult =
  | { ok: true; scent: string | null; size: string | null; warn?: string }
  | { ok: false; error: string; dup?: boolean };

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
    if (dup) return { ok: false, error: `SKU "${sku}" เก็บไปแล้วในรอบนี้`, dup: true };
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

/** Bulk-enroll every captured SKU of a branch into sku_units as in_stock (one row per normalized SKU
 *  not already present). Non-destructive: does NOT change aggregate stock (sku_units ≠ STOCK_CTE),
 *  and a SKU the system has as 'sold' but that was found on the shelf is flagged (anomaly), not revived.
 *  Idempotent — safe to run again. Manager/ops only. */
export async function enrollCapturedSkus(branch: string): Promise<{ ok: boolean; added?: number; flagged?: number; already?: number; error?: string }> {
  const me = await requireAnyPermission(["requisitions", "stock"]);
  const b = normalizeBranch(branch);
  if (!b) return { ok: false, error: "ไม่ได้ระบุสาขา" };
  try {
    const [tot] = await q<{ n: number }>(`select count(distinct ${NORM("sku")})::int n from shelf_capture where branch = upper($1) and coalesce(sku,'') <> ''`, [b]);
    const ins = await q<{ sku: string }>(
      `insert into sku_units (sku, barcode, scent, size, branch, received_by, status, received_at)
       select distinct on (${NORM("sc.sku")}) sc.sku, sc.barcode, sc.scent, sc.size, upper($1), $2, 'in_stock', now()
       from shelf_capture sc
       where sc.branch = upper($1) and coalesce(sc.sku,'') <> ''
         and not exists (select 1 from sku_units u where ${NORM("u.sku")} = ${NORM("sc.sku")})
       order by ${NORM("sc.sku")}, sc.id
       on conflict (sku) do nothing
       returning sku`, [b, me.id]);
    const flag = await q<{ sku: string }>(
      `update sku_units set shelf_flag_at = now(), shelf_flag_by = $2
       where status = 'sold' and shelf_flag_at is null
         and exists (select 1 from shelf_capture sc where sc.branch = upper($1) and ${NORM("sc.sku")} = ${NORM("sku_units.sku")})
       returning sku`, [b, me.id]);
    const added = ins.length, flagged = flag.length;
    const already = Math.max(0, (tot?.n || 0) - added - flagged);
    await logAudit("create", "stock", null, `ลงทะเบียน SKU จากที่เก็บ ${branchName(b)}: ใหม่ ${added} · ซ้ำ ${already} · ติดธง ${flagged}`);
    revalidatePath("/stock");
    return { ok: true, added, flagged, already };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งตาราง (sku_units/shelf_capture)" };
    console.error("[enrollCapturedSkus]", e);
    return { ok: false, error: "ลงทะเบียนไม่สำเร็จ" };
  }
}

const IS_4ML = (s: string | null) => /^\s*4\s*ml/i.test(String(s || ""));   // 4ml = ของแจก ไม่มี SKU

/** Sync sku_units to the ACTUAL remaining stock per product (2-way): per barcode
 *   - in_stock SKU > remaining → ตัดส่วนเกิน (เก่าสุดก่อน) เป็น sold
 *   - in_stock SKU < remaining → คืนตัวที่ "เดาตัด" (sold ไม่ผูกบิล) ของสินค้านั้นกลับ in_stock
 *  → จำนวน SKU = ยอดคงเหลือทุกตัว. serial-only (ยอดคงเหลือถูกอยู่แล้ว). ข้าม 4ml (ไม่มี SKU). Manager/ops. */
export async function reconcileSkusToStock(branch: string): Promise<{ ok: boolean; cleared?: number; restored?: number; kept?: number; error?: string }> {
  await requireAnyPermission(["requisitions", "stock"]);
  const b = normalizeBranch(branch);
  if (!b) return { ok: false, error: "ไม่ได้ระบุสาขา" };
  try {
    const { stockLive } = await import("@/lib/queries");
    const live = await stockLive(b);
    const rem = new Map<string, number>();
    for (const r of live) if (r.barcode && !IS_4ML(r.size)) rem.set(r.barcode, Math.round(Number(r.remaining) || 0));
    // in_stock newest-first (keep newest, sell older excess); guessed-cuts oldest-first (restore pool)
    const inStock = await q<{ sku: string; barcode: string | null }>(
      `select sku, barcode from sku_units where status='in_stock' and branch=upper($1) order by received_at desc nulls last, sku`, [b]);
    const guessed = await q<{ sku: string; barcode: string | null }>(
      `select sku, barcode from sku_units where status='sold' and sold_submission_id is null and branch=upper($1) order by received_at asc nulls last, sku`, [b]);
    const grp = (rows: { sku: string; barcode: string | null }[]) => { const m = new Map<string, string[]>(); for (const r of rows) { const k = r.barcode || ""; if (!k) continue; (m.get(k) ?? m.set(k, []).get(k)!).push(r.sku); } return m; };
    const inByBc = grp(inStock), guByBc = grp(guessed);
    const toSell: string[] = [], toRestore: string[] = [];
    for (const [bc, target] of rem) {
      const cur = inByBc.get(bc)?.length ?? 0;
      if (cur > target) toSell.push(...(inByBc.get(bc) || []).slice(target));                    // ตัดส่วนเกิน (ตัวเก่า)
      else if (cur < target) toRestore.push(...(guByBc.get(bc) || []).slice(0, target - cur));   // คืนส่วนขาดจากที่เดาตัด
    }
    if (toSell.length) await q(`update sku_units set status='sold', sold_at=now(), sold_branch=upper($2) where sku = any($1::text[]) and status='in_stock'`, [toSell, b]);
    if (toRestore.length) await q(`update sku_units set status='in_stock', sold_at=null, sold_branch=null, sold_receipt_no=null where sku = any($1::text[]) and status='sold' and sold_submission_id is null`, [toRestore]);
    const [kept] = await q<{ n: number }>(`select count(*)::int n from sku_units where status='in_stock' and branch=upper($1)`, [b]);
    await logAudit("update", "stock", null, `ซิงก์ SKU ให้ตรงสต๊อก ${branchName(b)}: ตัด ${toSell.length} · คืน ${toRestore.length} · เหลือ ${kept?.n || 0}`);
    revalidatePath("/shelf"); revalidatePath("/stock"); revalidatePath("/my/stock");
    return { ok: true, cleared: toSell.length, restored: toRestore.length, kept: kept?.n || 0 };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งตาราง" };
    console.error("[reconcileSkusToStock]", e);
    return { ok: false, error: "ซิงก์ไม่สำเร็จ" };
  }
}

/** Undo serial cuts that were NOT tied to a real bill — i.e. the FIFO "ตัด SKU ส่วนเกิน" guesses and
 *  manual "ตัด SKU ที่ขายออก" (both leave sold_submission_id null). Restores them to in_stock so SKU
 *  counts go back above the real stock, letting staff attach the EXACT SKU per bill instead of guesses.
 *  Keeps real bill-linked sales (scanned at checkout / added on /review) sold. Manager/ops only. */
export async function undoGuessedSkuCuts(branch: string): Promise<{ ok: boolean; restored?: number; error?: string }> {
  await requireAnyPermission(["requisitions", "stock"]);
  const b = normalizeBranch(branch);
  if (!b) return { ok: false, error: "ไม่ได้ระบุสาขา" };
  try {
    // เฉพาะที่ "ตัดวันนี้" (เวลาไทย) — ของเก่า (เมื่อวาน/ก่อนหน้า) finalize แล้ว อย่าแตะ
    const upd = await q<{ sku: string }>(
      `update sku_units set status='in_stock', sold_at=null, sold_branch=null, sold_receipt_no=null
       where status='sold' and sold_submission_id is null and branch=upper($1)
         and sold_at is not null
         and (sold_at at time zone 'Asia/Bangkok')::date = (now() at time zone 'Asia/Bangkok')::date
       returning sku`, [b]);
    await logAudit("update", "stock", null, `คืน SKU ที่ตัดแบบเดา (วันนี้) ${branchName(b)}: ${upd.length} ตัว กลับ in_stock`);
    revalidatePath("/shelf"); revalidatePath("/stock"); revalidatePath("/my/stock"); revalidatePath("/review");
    return { ok: true, restored: upd.length };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งตาราง" };
    console.error("[undoGuessedSkuCuts]", e);
    return { ok: false, error: "คืนไม่สำเร็จ" };
  }
}

/** Clear the whole capture round for a branch (start fresh). Manager-only so staff can't wipe
 *  a round by accident. Returns how many rows were removed. Does NOT touch sku_units. */
export async function clearShelfCaptures(branch: string): Promise<{ ok: boolean; cleared?: number; error?: string }> {
  await requireAnyPermission(["requisitions", "stock"]);
  const b = normalizeBranch(branch);
  if (!b) return { ok: false, error: "ไม่ได้ระบุสาขา" };
  try {
    const rows = await q<{ id: number }>(`delete from shelf_capture where branch = upper($1) returning id`, [b]);
    revalidatePath("/my/count"); revalidatePath("/stock");
    return { ok: true, cleared: rows.length };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ไม่มีตาราง" };
    console.error("[clearShelfCaptures]", e);
    return { ok: false, error: "ล้างข้อมูลไม่สำเร็จ" };
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
