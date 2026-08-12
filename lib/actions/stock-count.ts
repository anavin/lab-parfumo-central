"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser, requirePermission } from "@/lib/auth/require-user";
import { resolveBranch, branchName } from "@/lib/branches";
import { logAudit } from "@/lib/audit";

export type CountLineInput = { barcode: string; scent: string; size: string; expected: number; counted: number };
export type CountLine = CountLineInput & { id: number };
export type StockCount = {
  id: number; branch: string; status: string; note: string | null;
  counted_by_name: string | null; created_at: string; reviewed_by_name: string | null;
  reviewed_at: string | null; review_note: string | null; lines_count: number; diff_count: number;
};

/** Salesperson submits a physical count for their branch → status 'pending' (awaits admin). */
export async function submitStockCount(branch: string, lines: CountLineInput[], note?: string): Promise<{ ok: boolean; error?: string; id?: number }> {
  const me = await requireUser();
  const b = resolveBranch(branch);
  const clean = (lines || []).filter((l) => l.barcode);
  if (!clean.length) return { ok: false, error: "ยังไม่มีรายการนับ" };
  try {
    const [c] = await q<{ id: number }>(
      `insert into stock_counts (branch, status, note, counted_by) values ($1,'pending',$2,$3) returning id`,
      [b, (note || "").trim() || null, me.id]);
    for (const l of clean) {
      await q(`insert into stock_count_lines (count_id, barcode, scent, size, expected, counted)
               values ($1,$2,$3,$4,$5,$6)`,
        [c.id, l.barcode, l.scent || null, l.size || null,
         Math.max(0, Math.round(Number(l.expected) || 0)), Math.max(0, Math.round(Number(l.counted) || 0))]);
    }
    await logAudit("create", "stock", c.id, `ส่งนับสต๊อก ${branchName(b)} (${clean.length} รายการ)`);
    revalidatePath("/stock/counts"); revalidatePath("/my/count");
    return { ok: true, id: c.id };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งตาราง (รัน SQL 0024)" };
    console.error("[submitStockCount]", e);
    return { ok: false, error: "ส่งผลนับไม่สำเร็จ" };
  }
}

/** Count sessions for the admin review list (optionally by status). */
export async function listStockCounts(status: string | null = null): Promise<StockCount[]> {
  try {
    const where = status ? `where c.status = $1` : ``;
    const args = status ? [status] : [];
    return await q<StockCount>(`
      select c.id, c.branch, c.status, c.note, cu.full_name counted_by_name,
             c.created_at::text created_at, ru.full_name reviewed_by_name,
             c.reviewed_at::text reviewed_at, c.review_note,
             count(l.id)::int lines_count,
             count(l.id) filter (where l.counted <> l.expected)::int diff_count
      from stock_counts c
      left join stock_count_lines l on l.count_id = c.id
      left join users cu on cu.id = c.counted_by
      left join users ru on ru.id = c.reviewed_by
      ${where} group by c.id, cu.full_name, ru.full_name
      order by (c.status='pending') desc, c.created_at desc limit 100`, args);
  } catch (e: any) { if (e?.code === "42P01") return []; throw e; }
}

export async function getStockCountLines(id: number): Promise<CountLine[]> {
  try {
    return await q<CountLine>(`select id, barcode, scent, size, expected::float expected, counted::float counted
      from stock_count_lines where count_id = $1 order by scent, size`, [Number(id)]);
  } catch (e: any) { if (e?.code === "42P01") return []; throw e; }
}

/** Admin approves → post stock_adjustments for every variance, mark 'approved'. */
export async function approveStockCount(id: number, reviewNote?: string): Promise<{ ok: boolean; error?: string }> {
  const me = await requirePermission("requisitions");
  try {
    const [c] = await q<{ branch: string; status: string }>(`select branch, status from stock_counts where id=$1`, [id]);
    if (!c) return { ok: false, error: "ไม่พบรายการนับ" };
    if (c.status !== "pending") return { ok: false, error: "รายการนี้ถูกตรวจแล้ว" };
    const lines = await q<CountLine>(`select barcode, scent, size, expected::float expected, counted::float counted
      from stock_count_lines where count_id=$1`, [id]);
    for (const l of lines) {
      const delta = Math.round(Number(l.counted) - Number(l.expected));
      if (!delta || !l.barcode) continue;   // no variance → nothing to post
      const [p] = await q<{ id: number }>(`select id from products where barcode=$1 limit 1`, [l.barcode]);
      await q(`insert into stock_adjustments (branch, product_id, barcode, scent, size, qty, note, created_by)
               values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [c.branch, p?.id ?? null, l.barcode, l.scent, l.size, delta, `นับสต๊อก #${id}`, me.id]);
    }
    await q(`update stock_counts set status='approved', reviewed_by=$2, reviewed_at=now(), review_note=$3 where id=$1`,
      [id, me.id, (reviewNote || "").trim() || null]);
    await logAudit("approve", "stock", id, `อนุมัติผลนับ ${branchName(c.branch)}`);
    revalidatePath("/stock/counts"); revalidatePath("/stock"); revalidatePath("/my/stock");
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งตาราง (รัน SQL 0023 + 0024)" };
    console.error("[approveStockCount]", e);
    return { ok: false, error: "อนุมัติไม่สำเร็จ" };
  }
}

export async function rejectStockCount(id: number, reviewNote?: string): Promise<{ ok: boolean; error?: string }> {
  const me = await requirePermission("requisitions");
  try {
    const res = await q<{ id: number }>(`update stock_counts set status='rejected', reviewed_by=$2, reviewed_at=now(), review_note=$3
             where id=$1 and status='pending' returning id`, [id, me.id, (reviewNote || "").trim() || null]);
    if (!res.length) return { ok: false, error: "รายการนี้ถูกตรวจแล้ว" };
    await logAudit("reject", "stock", id, "ปฏิเสธผลนับสต๊อก");
    revalidatePath("/stock/counts");
    return { ok: true };
  } catch (e) { console.error("[rejectStockCount]", e); return { ok: false, error: "ปฏิเสธไม่สำเร็จ" }; }
}
