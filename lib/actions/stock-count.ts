"use server";
import { q, tx } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser, requirePermission, requireAnyPermission } from "@/lib/auth/require-user";
import { resolveBranch, branchName } from "@/lib/branches";
import { isNonStock } from "@/lib/product-class";
import { logAudit } from "@/lib/audit";
import { stockRawForBarcodes, stockLive, salesAfterDate } from "@/lib/queries";
import { enrollCapturedSkus } from "@/lib/actions/shelf-capture";

export type CountLineInput = { barcode: string; scent: string; size: string; expected: number; counted: number; verified?: boolean };
export type CountLine = CountLineInput & { id: number; verified: boolean };
export type StockCount = {
  id: number; branch: string; status: string; note: string | null;
  counted_by_name: string | null; created_at: string; reviewed_by_name: string | null;
  reviewed_at: string | null; review_note: string | null; lines_count: number; diff_count: number;
  short: number; over: number; verified_count: number;
};

/** Salesperson submits a physical count for their branch → status 'pending' (awaits admin). */
export async function submitStockCount(branch: string, lines: CountLineInput[], note?: string): Promise<{ ok: boolean; error?: string; id?: number }> {
  const me = await requireAnyPermission(["my_sales", "requisitions", "stock"]);
  const b = resolveBranch(branch);
  const clean = (lines || []).filter((l) => l.barcode);
  if (!clean.length) return { ok: false, error: "ยังไม่มีรายการนับ" };
  try {
    // header + all count lines in one tx so a partial count is never saved.
    // `verified` = the salesperson physically counted this row (not left at pre-fill);
    // guarded so a pre-0033 DB still saves (retry without the column).
    const build = (withV: boolean) => tx<number>(async (run) => {
      const [c] = await run<{ id: number }>(
        `insert into stock_counts (branch, status, note, counted_by) values ($1,'pending',$2,$3) returning id`,
        [b, (note || "").trim() || null, me.id]);
      for (const l of clean) {
        const base = [c.id, l.barcode, l.scent || null, l.size || null,
          Math.max(0, Math.round(Number(l.expected) || 0)), Math.max(0, Math.round(Number(l.counted) || 0))];
        if (withV) await run(`insert into stock_count_lines (count_id, barcode, scent, size, expected, counted, verified) values ($1,$2,$3,$4,$5,$6,$7)`, [...base, !!l.verified]);
        else await run(`insert into stock_count_lines (count_id, barcode, scent, size, expected, counted) values ($1,$2,$3,$4,$5,$6)`, base);
      }
      return c.id;
    });
    let id: number;
    try { id = await build(true); }
    catch (e: any) { if (e?.code === "42703") id = await build(false); else throw e; }
    await logAudit("create", "stock", id, `ส่งนับสต๊อก ${branchName(b)} (${clean.length} รายการ)`);
    revalidatePath("/stock/counts"); revalidatePath("/my/count");
    return { ok: true, id };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งตาราง (รัน SQL 0024)" };
    console.error("[submitStockCount]", e);
    return { ok: false, error: "ส่งผลนับไม่สำเร็จ" };
  }
}

/** Build a pending stock count straight from the shelf-capture data: counted = number of captured
 *  bottles per product, expected = current system remaining. Goes through the normal approve flow
 *  (/stock/counts) so a manager reviews the variance before any stock_adjustments post — nothing
 *  touches live stock until approval, and it stays reversible. Only captured products are included,
 *  so products that weren't counted keep their current stock untouched. */
export async function createCountFromCaptures(branch: string, asOfDate?: string, zeroUncaptured = false): Promise<{ ok: boolean; id?: number; products?: number; error?: string }> {
  await requireAnyPermission(["requisitions", "stock"]);
  const b = resolveBranch(branch);
  try {
    const caps = await q<{ barcode: string; scent: string | null; size: string | null; cnt: number }>(
      `select barcode, max(scent) scent, max(size) size, count(*)::int cnt
       from shelf_capture where branch = upper($1) and coalesce(barcode,'') <> '' group by barcode`, [b]);
    if (!caps.length) return { ok: false, error: "ยังไม่มีข้อมูลที่เก็บ (ที่มีบาร์โค้ด)" };
    const live = await stockLive(b);
    const rem = new Map(live.map((r) => [r.barcode, Math.round(Number(r.remaining) || 0)]));
    // "ยอด ณ วันที่นับ": subtract sales made AFTER the count date so today's sales aren't added back.
    const after = asOfDate ? await salesAfterDate(b, asOfDate) : null;
    const lines: CountLineInput[] = caps.map((c) => {
      const counted = after ? Math.max(0, c.cnt - Math.round(after.get(c.barcode) || 0)) : c.cnt;
      return { barcode: c.barcode, scent: c.scent || "", size: c.size || "", expected: rem.get(c.barcode) ?? 0, counted, verified: true };
    });
    // optionally set products that have system stock but were NOT counted → 0 (ไม่อยู่บนชั้น = หมด)
    // ยกเว้น เทสเตอร์ (TRY ME) + ถุง/บรรจุภัณฑ์ — ไม่ได้นับบนชั้นน้ำหอม จึงไม่ควรโดนตั้ง 0
    if (zeroUncaptured) {
      const capSet = new Set(caps.map((c) => c.barcode));
      const skipZero = (s: string) => isNonStock(s);
      for (const r of live) {
        const rr = Math.round(Number(r.remaining) || 0);
        if (rr > 0 && !capSet.has(r.barcode) && !skipZero(r.scent || "")) lines.push({ barcode: r.barcode, scent: r.scent || "", size: r.size || "", expected: rr, counted: 0, verified: true });
      }
    }
    const note = `ปรับยอดจากการเก็บ SKU${asOfDate ? ` (ยอด ณ ${asOfDate})` : ""}${zeroUncaptured ? " +ตัดที่ไม่ได้นับ=0" : ""}`;
    const r = await submitStockCount(b, lines, note);
    return r.ok ? { ok: true, id: r.id, products: lines.length } : r;
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งตาราง" };
    console.error("[createCountFromCaptures]", e);
    return { ok: false, error: "สร้างใบนับไม่สำเร็จ" };
  }
}

/** One-click "อัปข้อมูลเข้าระบบทั้งหมด" for the สต็อกหน้าร้าน page: make the whole system use the
 *  captured shelf data as the single source of truth — (1) enroll every captured SKU as in_stock,
 *  (2) build a stock count from the captured quantities AND approve it, so remaining = counted.
 *  Admin/manager only (writes stock). Auditable + reversible (the count can be reversed). */
export async function applyCapturesToSystem(branch: string, asOfDate?: string, zeroUncaptured = false): Promise<{ ok: boolean; error?: string; added?: number; flagged?: number; already?: number; countId?: number; products?: number }> {
  await requirePermission("requisitions");
  try {
    const en = await enrollCapturedSkus(branch);               // serials (non-destructive)
    const cr = await createCountFromCaptures(branch, asOfDate, zeroUncaptured); // build the count (optionally ณ วันที่นับ + ตัดที่ไม่ได้นับ=0)
    if (!cr.ok) return { ok: false, error: cr.error, added: en.added, flagged: en.flagged, already: en.already };
    const ap = await approveStockCount(cr.id!, "อัปจากสต็อกหน้าร้าน (ข้อมูลที่เก็บ)");  // post adjustments → remaining = counted
    if (!ap.ok) return { ok: false, error: `ลง SKU แล้ว แต่ปรับยอดไม่สำเร็จ: ${ap.error} (ใบนับ #${cr.id} รออนุมัติที่ /stock/counts)`, added: en.added, flagged: en.flagged, already: en.already, countId: cr.id };
    return { ok: true, added: en.added, flagged: en.flagged, already: en.already, countId: cr.id, products: cr.products };
  } catch (e: any) {
    console.error("[applyCapturesToSystem]", e);
    return { ok: false, error: "อัปข้อมูลไม่สำเร็จ" };
  }
}

/** Count sessions for the admin review list (optionally by status). */
export async function listStockCounts(status: string | null = null): Promise<StockCount[]> {
  await requireAnyPermission(["requisitions", "stock"]);
  const where = status ? `where c.status = $1` : ``;
  const args = status ? [status] : [];
  const sql = (verifiedCol: string) => `
      select c.id, c.branch, c.status, c.note, cu.full_name counted_by_name,
             c.created_at::text created_at, ru.full_name reviewed_by_name,
             c.reviewed_at::text reviewed_at, c.review_note,
             count(l.id)::int lines_count,
             count(l.id) filter (where l.counted <> l.expected)::int diff_count,
             coalesce(sum(greatest(0, l.expected - l.counted)),0)::int short,
             coalesce(sum(greatest(0, l.counted - l.expected)),0)::int "over",
             ${verifiedCol} verified_count
      from stock_counts c
      left join stock_count_lines l on l.count_id = c.id
      left join users cu on cu.id = c.counted_by
      left join users ru on ru.id = c.reviewed_by
      ${where} group by c.id, cu.full_name, ru.full_name
      order by (c.status='pending') desc, c.created_at desc limit 100`;
  try {
    try { return await q<StockCount>(sql(`count(l.id) filter (where l.verified)::int`), args); }
    catch (e: any) { if (e?.code === "42703") return await q<StockCount>(sql(`0::int`), args); throw e; }  // pre-0033
  } catch (e: any) { if (e?.code === "42P01") return []; throw e; }
}

export async function getStockCountLines(id: number): Promise<CountLine[]> {
  await requireAnyPermission(["requisitions", "stock"]);
  const sql = (verifiedCol: string) => `select id, barcode, scent, size, expected::float expected, counted::float counted, ${verifiedCol} verified
    from stock_count_lines where count_id = $1 order by scent, size`;
  try {
    try { return await q<CountLine>(sql("verified"), [Number(id)]); }
    catch (e: any) { if (e?.code === "42703") return await q<CountLine>(sql("false"), [Number(id)]); throw e; }  // pre-0033
  } catch (e: any) { if (e?.code === "42P01") return []; throw e; }
}

/** Admin approves → post stock_adjustments for every variance, mark 'approved'. */
export async function approveStockCount(id: number, reviewNote?: string): Promise<{ ok: boolean; error?: string }> {
  const me = await requirePermission("requisitions");
  try {
    // Read header + lines + RAW balance BEFORE the tx — stockRawForBarcodes uses its own DB
    // connection, so it must NOT run inside tx() (would clash on PGlite's single connection).
    const [head] = await q<{ branch: string; status: string }>(`select branch, status from stock_counts where id=$1`, [id]);
    if (!head) return { ok: false, error: "ไม่พบรายการนับ" };
    if (head.status !== "pending") return { ok: false, error: "รายการนี้ถูกตรวจแล้ว" };
    const lines = await q<{ barcode: string; scent: string | null; size: string | null; counted: number }>(
      `select barcode, scent, size, counted::float counted from stock_count_lines where count_id=$1`, [id]);
    // delta = counted − RAW balance (un-floored) so remaining truly becomes `counted`, even for
    // products that sold more than they received (raw < 0). Using the floored current stock would
    // under-correct those and leave them stuck at 0.
    const raw = await stockRawForBarcodes(head.branch, lines.map((l) => l.barcode).filter(Boolean));

    // The tx re-checks status under FOR UPDATE (guards a double-click) and posts atomically.
    const res = await tx<{ ok: boolean; error?: string }>(async (run) => {
      const [c] = await run<{ status: string }>(`select status from stock_counts where id=$1 for update`, [id]);
      if (!c) return { ok: false, error: "ไม่พบรายการนับ" };
      if (c.status !== "pending") return { ok: false, error: "รายการนี้ถูกตรวจแล้ว" };
      for (const l of lines) {
        if (!l.barcode) continue;
        const delta = Math.round(Number(l.counted) - (raw.get(l.barcode) ?? 0));
        if (!delta) continue;   // already at target → nothing to post
        const [p] = await run<{ id: number }>(`select id from products where barcode=$1 limit 1`, [l.barcode]);
        await run(`insert into stock_adjustments (branch, product_id, barcode, scent, size, qty, note, created_by)
                 values ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [head.branch, p?.id ?? null, l.barcode, l.scent, l.size, delta, `นับสต๊อก #${id}`, me.id]);
      }
      await run(`update stock_counts set status='approved', reviewed_by=$2, reviewed_at=now(), review_note=$3 where id=$1`,
        [id, me.id, (reviewNote || "").trim() || null]);
      return { ok: true };
    });
    if (!res.ok) return { ok: false, error: res.error };
    await logAudit("approve", "stock", id, `อนุมัติผลนับ ${branchName(head.branch)}`);
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
