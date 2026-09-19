"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/require-user";
import { logAudit } from "@/lib/audit";

export type Promotion = {
  id: number; name: string; start_date: string; end_date: string; active: boolean;
  prices: Record<string, number>; created_by_name?: string | null; updated_at?: string;
};

const cleanPrices = (p: any): Record<string, number> => {
  const out: Record<string, number> = {};
  if (p && typeof p === "object") for (const [k, v] of Object.entries(p)) {
    const n = Math.round(Number(v) || 0);
    if (n > 0 && /\|/.test(k)) out[k] = n;   // keep only "grade|size" → positive price
  }
  return out;
};

/** All promotions for the admin list (newest first). */
export async function listPromotions(): Promise<Promotion[]> {
  await requirePermission("products");
  try {
    return await q<Promotion>(`
      select p.id, p.name, p.start_date::text start_date, p.end_date::text end_date, p.active,
             p.prices, u.full_name created_by_name, p.updated_at::text updated_at
      from promotions p left join users u on u.id = p.created_by
      order by p.active desc, p.start_date desc, p.id desc`);
  } catch (e: any) { if (e?.code === "42P01") return []; throw e; }
}

/** Create or update a promotion. */
export async function savePromotion(input: {
  id?: number; name: string; start_date: string; end_date: string; active: boolean; prices: Record<string, number>;
}): Promise<{ ok: boolean; error?: string; id?: number }> {
  const me = await requirePermission("products");
  const name = (input.name || "").trim();
  if (!name) return { ok: false, error: "กรุณาตั้งชื่อโปรโมชัน" };
  if (!input.start_date || !input.end_date) return { ok: false, error: "กรุณาระบุช่วงวันที่" };
  if (input.end_date < input.start_date) return { ok: false, error: "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม" };
  const prices = cleanPrices(input.prices);
  try {
    if (input.id) {
      await q(`update promotions set name=$2, start_date=$3, end_date=$4, active=$5, prices=$6, updated_at=now() where id=$1`,
        [input.id, name, input.start_date, input.end_date, !!input.active, JSON.stringify(prices)]);
      await logAudit("update", "promotion", input.id, `แก้โปรโมชัน ${name}`);
      revalidatePath("/promotions"); revalidatePath("/my");
      return { ok: true, id: input.id };
    }
    const [r] = await q<{ id: number }>(
      `insert into promotions (name, start_date, end_date, active, prices, created_by) values ($1,$2,$3,$4,$5,$6) returning id`,
      [name, input.start_date, input.end_date, !!input.active, JSON.stringify(prices), me.id]);
    await logAudit("create", "promotion", r.id, `สร้างโปรโมชัน ${name}`);
    revalidatePath("/promotions"); revalidatePath("/my");
    return { ok: true, id: r.id };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งตาราง (รัน SQL 0035)" };
    console.error("[savePromotion]", e);
    return { ok: false, error: "บันทึกไม่สำเร็จ" };
  }
}

export async function setPromotionActive(id: number, active: boolean): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("products");
  try {
    await q(`update promotions set active=$2, updated_at=now() where id=$1`, [id, !!active]);
    await logAudit("update", "promotion", id, active ? "เปิดโปรโมชัน" : "ปิดโปรโมชัน");
    revalidatePath("/promotions"); revalidatePath("/my");
    return { ok: true };
  } catch (e: any) { console.error("[setPromotionActive]", e); return { ok: false, error: "ทำรายการไม่สำเร็จ" }; }
}

export async function deletePromotion(id: number): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("products");
  try {
    await q(`delete from promotions where id=$1`, [id]);
    await logAudit("delete", "promotion", id, "ลบโปรโมชัน");
    revalidatePath("/promotions"); revalidatePath("/my");
    return { ok: true };
  } catch (e: any) { console.error("[deletePromotion]", e); return { ok: false, error: "ลบไม่สำเร็จ" }; }
}
