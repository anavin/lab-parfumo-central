"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/require-user";
import { normalizeBranch } from "@/lib/branches";
import { logAudit } from "@/lib/audit";

// สาขาที่ขายจริง (EVENT_SCS นับเป็น SCS) — ใช้บน sales และ sales_draft (คอลัมน์ source เหมือนกัน)
const SOLD_BRANCH = `upper(case when source='EVENT_SCS' then 'SCS' else coalesce(nullif(source,''),'CTW') end)`;
const MONTH_RE = /^\d{4}-\d{2}$/;

/** คัดลอกยอดขายจริงของเดือน (ตามช่วงวันที่) มาเป็น "ฉบับร่าง" — เขียนที่ sales_draft เท่านั้น
 *  กดซ้ำ = รีเซ็ตฉบับร่างของเดือน+สาขานั้นให้เท่ายอดจริงอีกครั้ง (ของจริงไม่ถูกแตะ). */
export async function snapshotSalesDraft(month: string, branch: string): Promise<{ ok: boolean; count?: number; error?: string }> {
  await requirePermission("sales_draft");
  const m = String(month || "").match(MONTH_RE)?.[0];
  if (!m) return { ok: false, error: "เดือนไม่ถูกต้อง (YYYY-MM)" };
  const b = normalizeBranch(branch);
  try {
    await q(`delete from sales_draft where draft_month=$1 and ${SOLD_BRANCH}=$2`, [m, b]);
    const ins = await q<{ id: number }>(
      `insert into sales_draft (draft_month, source, receipt_no, sale_date, sale_time, ba, item, barcode, size,
                               qty, unit_price, discount, total, payment_channel, nation, src_sales_id)
       select $1, source, receipt_no, sale_date, sale_time, ba, item, barcode, size,
              qty, unit_price, discount, total, payment_channel, nation, id
       from sales
       where sale_date >= ($1 || '-01')::date
         and sale_date <  (($1 || '-01')::date + interval '1 month')
         and ${SOLD_BRANCH}=$2
       returning id`, [m, b]);
    await logAudit("create", "sale", null, `สร้างฉบับร่างยอดขาย ${m} ${b}: ${ins.length} รายการ`);
    revalidatePath("/sales/draft");
    return { ok: true, count: ins.length };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้สร้างตาราง (รัน migration 0040)" };
    console.error("[snapshotSalesDraft]", e);
    return { ok: false, error: "สร้างฉบับร่างไม่สำเร็จ" };
  }
}

/** แก้รายการในฉบับร่าง (เฉพาะ sales_draft) — total คำนวณใหม่จาก qty×ราคา−ส่วนลด */
export async function updateDraftLine(id: number, input: { item?: string; qty?: number; unit_price?: number; discount?: number }): Promise<{ ok: boolean; total?: number; error?: string }> {
  await requirePermission("sales_draft");
  try {
    const [cur] = await q<{ qty: number; unit_price: number; discount: number }>(
      `select qty::float qty, unit_price::float unit_price, discount::float discount from sales_draft where id=$1`, [id]);
    if (!cur) return { ok: false, error: "ไม่พบรายการ" };
    const qty = input.qty ?? Number(cur.qty);
    const up = input.unit_price ?? Number(cur.unit_price);
    const sub = qty * up;
    const disc = Math.min(sub, Math.max(0, input.discount ?? Number(cur.discount)));
    const total = Math.max(0, sub - disc);
    await q(`update sales_draft set item=coalesce($2,item), qty=$3, unit_price=$4, discount=$5, total=$6 where id=$1`,
      [id, input.item ?? null, qty, up, disc, total]);
    revalidatePath("/sales/draft");
    return { ok: true, total };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้สร้างตาราง" };
    console.error("[updateDraftLine]", e);
    return { ok: false, error: "แก้ไขไม่สำเร็จ" };
  }
}

/** ลบรายการเดียวในฉบับร่าง */
export async function deleteDraftLine(id: number): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("sales_draft");
  try {
    await q(`delete from sales_draft where id=$1`, [id]);
    revalidatePath("/sales/draft");
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้สร้างตาราง" };
    console.error("[deleteDraftLine]", e);
    return { ok: false, error: "ลบไม่สำเร็จ" };
  }
}

/** ลบทั้งบิลในฉบับร่าง (ทุกรายการของเลขบิลนั้น ในเดือน+สาขาที่เลือก) */
export async function deleteDraftBill(month: string, branch: string, receiptNo: string): Promise<{ ok: boolean; removed?: number; error?: string }> {
  await requirePermission("sales_draft");
  const m = String(month || "").match(MONTH_RE)?.[0];
  if (!m || !receiptNo) return { ok: false, error: "ข้อมูลไม่ครบ" };
  const b = normalizeBranch(branch);
  try {
    const r = await q<{ id: number }>(`delete from sales_draft where draft_month=$1 and ${SOLD_BRANCH}=$2 and receipt_no=$3 returning id`, [m, b, receiptNo]);
    revalidatePath("/sales/draft");
    return { ok: true, removed: r.length };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้สร้างตาราง" };
    console.error("[deleteDraftBill]", e);
    return { ok: false, error: "ลบไม่สำเร็จ" };
  }
}
