"use server";
import { q, tx } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser, requirePermission, requireAnyPermission } from "@/lib/auth/require-user";
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
  const me = await requireAnyPermission(["my_sales", "requisitions", "stock"]);
  const b = resolveBranch(branch);
  const clean = (lines || []).filter((l) => l.barcode);
  if (!clean.length) return { ok: false, error: "ยังไม่มีรายการนับ" };
  try {
    // header + all count lines in one tx so a partial count is never saved
    const id = await tx<number>(async (run) => {
      const [c] = await run<{ id: number }>(
        `insert into stock_counts (branch, status, note, counted_by) values ($1,'pending',$2,$3) returning id`,
        [b, (note || "").trim() || null, me.id]);
      for (const l of clean) {
        await run(`insert into stock_count_lines (count_id, barcode, scent, size, expected, counted)
                 values ($1,$2,$3,$4,$5,$6)`,
          [c.id, l.barcode, l.scent || null, l.size || null,
           Math.max(0, Math.round(Number(l.expected) || 0)), Math.max(0, Math.round(Number(l.counted) || 0))]);
      }
      return c.id;
    });
    await logAudit("create", "stock", id, `ส่งนับสต๊อก ${branchName(b)} (${clean.length} รายการ)`);
    revalidatePath("/stock/counts"); revalidatePath("/my/count");
    return { ok: true, id };
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
    // One transaction + FOR UPDATE on the count row: serializes concurrent approves
    // and makes the variance postings + status flip all-or-nothing, so a mid-loop
    // failure or a double-click can't post the adjustments twice.
    const res = await tx<{ ok: boolean; error?: string; branch?: string }>(async (run) => {
      const [c] = await run<{ branch: string; status: string }>(`select branch, status from stock_counts where id=$1 for update`, [id]);
      if (!c) return { ok: false, error: "ไม่พบรายการนับ" };
      if (c.status !== "pending") return { ok: false, error: "รายการนี้ถูกตรวจแล้ว" };
      const lines = await run<CountLine>(`select barcode, scent, size, expected::float expected, counted::float counted
        from stock_count_lines where count_id=$1`, [id]);
      for (const l of lines) {
        const delta = Math.round(Number(l.counted) - Number(l.expected));
        if (!delta || !l.barcode) continue;   // no variance → nothing to post
        const [p] = await run<{ id: number }>(`select id from products where barcode=$1 limit 1`, [l.barcode]);
        await run(`insert into stock_adjustments (branch, product_id, barcode, scent, size, qty, note, created_by)
                 values ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [c.branch, p?.id ?? null, l.barcode, l.scent, l.size, delta, `นับสต๊อก #${id}`, me.id]);
      }
      await run(`update stock_counts set status='approved', reviewed_by=$2, reviewed_at=now(), review_note=$3 where id=$1`,
        [id, me.id, (reviewNote || "").trim() || null]);
      return { ok: true, branch: c.branch };
    });
    if (!res.ok) return { ok: false, error: res.error };
    await logAudit("approve", "stock", id, `อนุมัติผลนับ ${branchName(res.branch!)}`);
    revalidatePath("/stock/counts"); revalidatePath("/stock"); revalidatePath("/my/stock");
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งตาราง (รัน SQL 0023 + 0024)" };
    console.error("[approveStockCount]", e);
    return { ok: false, error: "อนุมัติไม่สำเร็จ" };
  }
}

/** Reverse an APPROVED count: delete the stock_adjustments it posted (note "นับสต๊อก #id")
 *  and mark it reversed. Used to undo a mistaken/duplicate approval — stock returns to what it
 *  was before, since remaining is computed live. */
export async function reverseStockCount(id: number): Promise<{ ok: boolean; error?: string; removed?: number }> {
  const me = await requirePermission("requisitions");
  try {
    const res = await tx<{ ok: boolean; error?: string; removed?: number; branch?: string }>(async (run) => {
      const [c] = await run<{ status: string; branch: string }>(`select status, branch from stock_counts where id=$1 for update`, [id]);
      if (!c) return { ok: false, error: "ไม่พบรายการนับ" };
      if (c.status !== "approved") return { ok: false, error: "ย้อนได้เฉพาะใบที่อนุมัติแล้ว" };
      const del = await run<{ n: number }>(
        `with d as (delete from stock_adjustments where note = $1 returning 1) select count(*)::int n from d`, [`นับสต๊อก #${id}`]);
      await run(`update stock_counts set status='reversed', reviewed_by=$2, reviewed_at=now(),
                 review_note = coalesce(nullif(review_note,''),'') || ' · ย้อนผลนับ' where id=$1`, [id, me.id]);
      return { ok: true, removed: del[0]?.n ?? 0, branch: c.branch };
    });
    if (!res.ok) return { ok: false, error: res.error };
    await logAudit("update", "stock", id, `ย้อนผลนับ #${id} ${branchName(res.branch!)} · ลบการปรับ ${res.removed} รายการ`);
    revalidatePath("/stock/counts"); revalidatePath("/stock"); revalidatePath("/my/stock");
    return { ok: true, removed: res.removed };
  } catch (e: any) { console.error("[reverseStockCount]", e); return { ok: false, error: "ย้อนไม่สำเร็จ" }; }
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
