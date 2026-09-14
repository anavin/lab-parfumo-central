"use server";
import { q, tx } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/require-user";
import { resolveBranch, branchName } from "@/lib/branches";
import { logAudit } from "@/lib/audit";
import { stockLive, stockRawForBarcodes } from "@/lib/queries";

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
    // one atomic INSERT … SELECT from the JSON so a partial failure can't half-return the branch;
    // `where not exists` makes a re-run / double-click for the same branch+date a no-op (idempotent).
    const done = await tx<{ one: number }[]>(async (run) => {
      await run(`select pg_advisory_xact_lock(hashtext($1))`, [`return-${branch}`]);   // serialize concurrent runs
      return run(
        `insert into stock_adjustments (branch, product_id, barcode, scent, size, qty, note, created_by)
         select $1, (select id from products where barcode = r.barcode limit 1), r.barcode, r.scent, r.size, -r.remaining, $3, $4
         from json_to_recordset($2::json) as r(barcode text, scent text, size text, remaining int)
         where not exists (select 1 from stock_adjustments where branch=$1 and note=$3)
         returning 1 as one`,
        [branch, JSON.stringify(payload), note, me.id]);
    });
    if (!done.length) return { ok: true, items: 0, units: 0 };   // already returned for this date
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

/** Admin: SET a product's remaining at a branch to an exact number (inline edit on /stock).
 *  Posts a signed adjustment = target − RAW balance so remaining lands exactly on `target`
 *  even for negative-stock products (sold > shipped). */
export async function setStockQty(branchInput: string, barcode: string, target: number): Promise<{ ok: boolean; error?: string }> {
  const me = await requirePermission("requisitions");
  const branch = resolveBranch(branchInput);
  const bc = (barcode || "").trim();
  const t = Math.max(0, Math.round(Number(target) || 0));
  if (!bc) return { ok: false, error: "ไม่มีบาร์โค้ด" };
  try {
    const raw = Math.round((await stockRawForBarcodes(branch, [bc])).get(bc) ?? 0);
    const delta = t - raw;
    if (delta !== 0) {
      const [p] = await q<{ id: number; scent: string; size: string }>(`select id, scent, size from products where barcode = $1 limit 1`, [bc]);
      await q(`insert into stock_adjustments (branch, product_id, barcode, scent, size, qty, note, created_by)
               values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [branch, p?.id ?? null, bc, p?.scent ?? null, p?.size ?? null, delta, `ตั้งคงเหลือ = ${t}`, me.id]);
    }
    await logAudit("update", "stock", null, `ตั้งคงเหลือ ${branchName(branch)} · ${bc} = ${t}`);
    revalidatePath("/stock"); revalidatePath("/my");
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งตาราง (รัน SQL 0023)" };
    console.error("[setStockQty]", e);
    return { ok: false, error: "ตั้งคงเหลือไม่สำเร็จ" };
  }
}

/** Admin: activate / deactivate a whole scent ("ปิดกลิ่น"). Inactive scents sink to the
 *  bottom of the stock matrix (and can later be hidden from the sale form). */
export async function setScentActive(scent: string, active: boolean): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("requisitions");
  const s = (scent || "").trim();
  if (!s) return { ok: false, error: "ไม่มีชื่อกลิ่น" };
  try {
    await q(`update products set active = $2 where scent = $1`, [s, active]);
    await logAudit("update", "product", null, `${active ? "เปิด" : "ปิด"}กลิ่น ${s}`);
    revalidatePath("/stock"); revalidatePath("/products");
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "42703") return { ok: false, error: "ยังไม่ได้ติดตั้งคอลัมน์ (รัน SQL 0032)" };
    console.error("[setScentActive]", e);
    return { ok: false, error: "เปลี่ยนสถานะกลิ่นไม่สำเร็จ" };
  }
}

/** Recent adjustments (optionally for one branch) for the admin list. */
export async function listStockAdjustments(branch: string | null = null): Promise<StockAdjustment[]> {
  await requirePermission("requisitions");
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

// ── ป้องกันของหาย: สาวหาต้นตอ ────────────────────────────────────────────────
// กดกลิ่นที่ "ขาด" → ดึงทุกเหตุการณ์ที่กระทบสต๊อกในช่วงระหว่างนับ 2 ครั้งล่าสุด
// (ขาย/ปรับมือ/คืน) + ใครเข้าเวรช่วงนั้น เพื่อสาวว่าของหายตรงไหน/ใคร
export type LossEvent = { at: string; kind: "sale" | "adjust" | "return" | "count"; who: string | null; detail: string; qty: string; flag: boolean };
export type LossDrilldown = { ok: boolean; error?: string; from?: string | null; to?: string | null; events?: LossEvent[]; shifts?: { name: string; bills: number }[] };

// map source → รหัสสาขา (เหมือน SOLD_BRANCH ใน queries.ts)
const SRC_BR = `upper(case when source='EVENT_SCS' then 'SCS' else coalesce(nullif(source,''),'CTW') end)`;

export async function lossDrilldown(branchInput: string | null, scent: string, size: string): Promise<LossDrilldown> {
  await requirePermission("requisitions");
  try {
    const branch = branchInput ? resolveBranch(branchInput) : null;
    const prods = await q<{ barcode: string }>(
      `select barcode from products where scent=$1 and size=$2 and coalesce(barcode,'')<>''`, [scent, size]);
    const codes = prods.map((p) => p.barcode);
    if (!codes.length) return { ok: true, from: null, to: null, events: [], shifts: [] };

    // ช่วงเวลา = ตั้งแต่นับครั้งก่อน → นับล่าสุด (ที่รวมกลิ่น/ขนาดนี้). ไม่มีครั้งก่อน → ย้อน 90 วัน
    const cnts = await q<{ ra: string }>(
      `select distinct c.reviewed_at::text ra from stock_counts c
       join stock_count_lines l on l.count_id=c.id
       where c.status='approved' and l.scent=$1 and l.size=$2 and ($3::text is null or c.branch=$3) and c.reviewed_at is not null
       order by c.reviewed_at desc limit 2`, [scent, size, branch]);
    const toD = (cnts[0]?.ra || new Date().toISOString()).slice(0, 10);
    const fromD = cnts[1]?.ra ? cnts[1].ra.slice(0, 10)
      : new Date(new Date(toD + "T00:00:00").getTime() - 90 * 86400000).toISOString().slice(0, 10);

    const brSales = branch ? `and ${SRC_BR}=$4` : ``;
    const salesArgs: any[] = branch ? [codes, fromD, toD, branch] : [codes, fromD, toD];

    // ขาย (อนุมัติ + pending)
    const sales = await q<{ d: string; t: string; who: string | null; ref: string | null; item: string | null; qty: number; up: number; disc: number }>(
      `select sale_date::text d, coalesce(sale_time::text,'') t, u.full_name who,
              nullif(receipt_no,'') ref, item, qty::float qty, coalesce(unit_price,0)::float up, coalesce(discount,0)::float disc
       from sales s left join users u on u.id=s.created_by
       where barcode = any($1) and sale_date >= $2::date and sale_date <= $3::date ${brSales}
       union all
       select entry_date::text d, coalesce(sale_time::text,'') t, u.full_name who,
              nullif(receipt_no,'') ref, item, qty::float qty, coalesce(unit_price,0)::float up, coalesce(discount,0)::float disc
       from submissions s left join users u on u.id=s.created_by
       where kind='sale' and status='pending' and deleted_at is null and barcode = any($1)
         and entry_date >= $2::date and entry_date <= $3::date ${brSales}`, salesArgs);

    // ปรับมือ
    const adjArgs: any[] = branch ? [codes, fromD, toD, branch] : [codes, fromD, toD];
    const adjusts = await q<{ at: string; who: string | null; qty: number; note: string | null }>(
      `select created_at::text at, u.full_name who, qty::float qty, note
       from stock_adjustments a left join users u on u.id=a.created_by
       where barcode = any($1) and created_at::date >= $2::date and created_at::date <= $3::date
         ${branch ? "and upper(a.branch)=$4" : ""} order by created_at desc`, adjArgs);

    // คืนสินค้า (รายชิ้น)
    const returns = await q<{ at: string; name: string | null; sku: string | null; status: string | null }>(
      `select return_date::text at, name, sku, receive_status status
       from return_items where serial = any($1) and return_date >= $2::date and return_date <= $3::date
       order by return_date desc`, [codes, fromD, toD]);

    const events: LossEvent[] = [];
    for (const s of sales) {
      const full = s.up > 0 && s.disc >= s.up * s.qty;
      events.push({
        at: `${s.d} ${s.t}`.trim(), kind: "sale", who: s.who,
        detail: `บิล ${s.ref || "—"} · ${s.item || "รายการ"} ×${s.qty}${s.disc > 0 ? ` · ลด ${Math.round(s.disc)}` : ""}`,
        qty: `−${s.qty}`, flag: s.up === 0 || full,
      });
    }
    for (const a of adjusts) {
      const isCount = /นับสต๊อก/.test(a.note || "");
      events.push({
        at: a.at.slice(0, 16).replace("T", " "), kind: isCount ? "count" : "adjust", who: a.who,
        detail: isCount ? `ปรับจากผลนับ (${a.qty > 0 ? "+" : ""}${a.qty})` : `ปรับมือ ${a.qty > 0 ? "+" : ""}${a.qty}${a.note ? ` · ${a.note}` : ""}`,
        qty: `${a.qty > 0 ? "+" : ""}${a.qty}`, flag: !isCount && a.qty < 0,
      });
    }
    for (const r of returns) {
      events.push({
        at: r.at, kind: "return", who: null,
        detail: `คืน ${r.name || ""}${r.sku ? ` · ${r.sku}` : " · ไม่มีเลขอ้างอิง"}`,
        qty: "คืน", flag: !r.sku,
      });
    }
    events.sort((x, y) => (x.at < y.at ? 1 : x.at > y.at ? -1 : 0));

    // ใครเข้าเวร (ขายกลิ่นนี้กี่บิลในช่วง)
    const shifts = await q<{ name: string; bills: number }>(
      `select coalesce(u.full_name,'—') name, count(distinct coalesce(nullif(receipt_no,''),'#'||s.id::text))::int bills
       from sales s left join users u on u.id=s.created_by
       where barcode = any($1) and sale_date >= $2::date and sale_date <= $3::date ${brSales}
       group by u.full_name order by bills desc`, salesArgs);

    return { ok: true, from: fromD, to: toD, events: events.slice(0, 60), shifts };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: true, from: null, to: null, events: [], shifts: [] };
    console.error("[lossDrilldown]", e);
    return { ok: false, error: "ดึงข้อมูลไม่สำเร็จ" };
  }
}
