"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/require-user";
import { logAudit } from "@/lib/audit";

export type PoAttachment = { id: number; data: string };

/** Files attached to a requisition (packing slip photos, etc.). */
export async function getPoAttachments(poId: number): Promise<PoAttachment[]> {
  try {
    return await q<PoAttachment>(`select id, data from po_attachments where po_id = $1 order by id`, [poId]);
  } catch (e: any) { if (e?.code === "42P01") return []; throw e; }
}

export async function addPoAttachments(poId: number, images: string[]): Promise<{ ok: boolean; error?: string }> {
  const me = await requirePermission("requisitions");
  const imgs = (images || []).filter((s) => typeof s === "string" && s.startsWith("data:image/") && s.length <= 3_000_000).slice(0, 8);
  if (!imgs.length) return { ok: false, error: "ไม่มีรูปที่ถูกต้อง" };
  try {
    for (const a of imgs) await q(`insert into po_attachments (po_id, created_by, data) values ($1,$2,$3)`, [poId, me.id, a]);
    await logAudit("update", "requisition", poId, `แนบไฟล์ ${imgs.length} รูป`);
    revalidatePath(`/requisitions/${poId}`);
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "42P01") return { ok: false, error: "ยังไม่ได้ติดตั้งตารางแนบไฟล์ (รัน SQL 0021)" };
    console.error("[addPoAttachments] failed", e);
    return { ok: false, error: "แนบไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
}

export async function deletePoAttachment(id: number, poId: number): Promise<{ ok: boolean }> {
  await requirePermission("requisitions");
  try {
    await q(`delete from po_attachments where id = $1`, [id]);
    revalidatePath(`/requisitions/${poId}`);
    return { ok: true };
  } catch (e) { console.error("[deletePoAttachment] failed", e); return { ok: false }; }
}
