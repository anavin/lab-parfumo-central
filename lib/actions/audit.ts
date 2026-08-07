"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/require-user";
import { logAudit } from "@/lib/audit";

/** Permanently clear the whole activity log. Leaves a single record of the clear
 *  itself (who + when + how many removed) so the wipe is never silent. */
export async function clearAuditLog(): Promise<{ ok: boolean; error?: string; cleared?: number }> {
  await requirePermission("audit");
  try {
    const [c] = await q<{ n: number }>(`select count(*)::int n from audit_log`);
    await q(`delete from audit_log`);
    await logAudit("delete", "auth", null, `ล้างบันทึกกิจกรรมทั้งหมด (${c?.n ?? 0} รายการ)`);
    revalidatePath("/audit");
    return { ok: true, cleared: c?.n ?? 0 };
  } catch (e) {
    console.error("[clearAuditLog] failed", e);
    return { ok: false, error: "ล้างไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
}
