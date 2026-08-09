"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/require-user";
import { dailyReport } from "@/lib/queries";
import { logAudit } from "@/lib/audit";

/** Admin: save the day's opening/deposit, recompute closing from that day's cash sales,
 *  mark it confirmed, and post the bank deposit into the cash ledger — once. */
export async function confirmDrawer(date: string, opening: number, deposit: number): Promise<{ ok: boolean; error?: string }> {
  const me = await requirePermission("cash");
  try {
    const rep = await dailyReport(date, "CTW");                 // that day's cash sales (shared drawer)
    const closing = Math.max(0, opening + rep.cash - deposit);
    await q(`insert into daily_cash (entry_date, opening, deposit, closing, updated_by, updated_at, confirmed)
             values ($1,$2,$3,$4,$5, now(), true)
             on conflict (entry_date) do update
               set opening=$2, deposit=$3, closing=$4, updated_by=$5, updated_at=now(), confirmed=true`,
      [date, opening, deposit, closing, me.id]);

    // post the bank deposit into the cash ledger once (posted_cash_id guards against dupes)
    const [row] = await q<{ posted: number | null }>(`select posted_cash_id posted from daily_cash where entry_date=$1`, [date]);
    if (!row?.posted && deposit > 0) {
      const [ins] = await q<{ id: number }>(
        `insert into cash_entries (cash_date, description, amount, type) values ($1,$2,$3,$4) returning id`,
        [date, "ฝากธนาคาร · เงินสดหน้าร้าน", deposit, "ฝากธนาคาร"]);
      await q(`update daily_cash set posted_cash_id=$2 where entry_date=$1`, [date, ins.id]);
    }
    await logAudit("update", "cash", date, `ยืนยันเงินสดหน้าร้าน ${date} · เข้าธนาคาร ฿${Math.round(deposit).toLocaleString()}`);
    revalidatePath("/cash"); revalidatePath("/my");
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "42703") return { ok: false, error: "ยังไม่ได้ติดตั้งคอลัมน์ยืนยัน (รัน SQL 0013 ก่อน)" };
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งตารางเงินสดหน้าร้าน (รัน SQL 0010 ก่อน)" };
    console.error("[confirmDrawer] failed", e);
    return { ok: false, error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
}

/** Attach bank-deposit slip photos to a day's shop-cash record. */
export async function addCashAttachments(date: string, images: string[]): Promise<{ ok: boolean; error?: string }> {
  const me = await requirePermission("cash");
  const imgs = (images || []).filter((s) => typeof s === "string" && s.startsWith("data:image/") && s.length <= 3_000_000).slice(0, 6);
  if (!imgs.length) return { ok: false, error: "ไม่มีรูปที่ถูกต้อง" };
  try {
    for (const a of imgs) await q(`insert into cash_attachments (entry_date, created_by, data) values ($1,$2,$3)`, [date, me.id, a]);
    await logAudit("update", "cash", date, `แนบสลิปเงินสด ${date} · ${imgs.length} รูป`);
    revalidatePath("/cash");
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งตารางแนบไฟล์ (รัน SQL 0015 ก่อน)" };
    console.error("[addCashAttachments] failed", e);
    return { ok: false, error: "แนบไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
}

/** Remove a bank-deposit slip photo. */
export async function deleteCashAttachment(id: number): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("cash");
  try {
    await q(`delete from cash_attachments where id = $1`, [id]);
    revalidatePath("/cash");
    return { ok: true };
  } catch (e) { console.error("[deleteCashAttachment] failed", e); return { ok: false, error: "ลบไม่สำเร็จ" }; }
}
