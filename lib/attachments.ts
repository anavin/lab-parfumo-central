// Server-only helpers for moving attachment images out of the DB (base64 in the
// `data` column) and into Supabase Storage. Everything degrades gracefully:
//  - if Storage env isn't set, or the bucket / storage_path column isn't there yet,
//    images stay as base64 in the DB and keep working (no downtime, deploy-first safe)
//  - the serve path prefers Storage, falls back to base64
// So this is safe to ship before the bucket exists and before the migration runs.
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { q } from "@/lib/db";

export const ATTACH_BUCKET = "attachments";
export type AttachTable = "bill_attachments" | "cash_attachments" | "po_attachments";
export type AttachKind = "bill" | "cash" | "po";

/** Storage is usable only when both env vars are present (set on Vercel). */
export function storageEnabled(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function decodeDataUri(uri: string): { bytes: Buffer; mime: string } {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(uri);
  if (!m) return { bytes: Buffer.from(uri, "base64"), mime: "image/jpeg" };
  return { mime: m[1] || "image/jpeg", bytes: Buffer.from(m[2], "base64") };
}

function extFor(mime: string): string {
  return mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
}
function mimeForPath(path: string): string {
  return path.endsWith(".png") ? "image/png" : path.endsWith(".webp") ? "image/webp" : "image/jpeg";
}

/** Right after inserting an attachment row (base64 still in `data`), push the image
 *  to Storage and null out `data`. No-op that KEEPS the base64 if Storage isn't
 *  configured, the bucket is missing, the column isn't migrated, or the upload fails. */
export async function offloadToStorage(table: AttachTable, kind: AttachKind, id: number, dataUri: string): Promise<void> {
  if (!storageEnabled()) return;
  try {
    const { bytes, mime } = decodeDataUri(dataUri);
    const path = `${kind}/${id}.${extFor(mime)}`;
    const up = await getSupabaseAdmin().storage.from(ATTACH_BUCKET).upload(path, bytes, { contentType: mime, upsert: true });
    if (up.error) throw up.error;
    await q(`update ${table} set storage_path=$1, data=null where id=$2`, [path, id]);
  } catch (e) {
    console.error(`[offloadToStorage] ${table}#${id} kept as base64:`, (e as any)?.message || e);
  }
}

type Bytes = { bytes: Buffer; mime: string };
/** Serve-path read: Storage first, base64 fallback, tolerant of a pre-migration schema. */
export async function readAttachmentBytes(table: AttachTable, id: number, canSeeAll: boolean, userId: number):
  Promise<Bytes | "not_found" | "forbidden"> {
  let row: { data: string | null; created_by: number | null; storage_path: string | null } | undefined;
  try {
    [row] = await q(`select data, created_by, storage_path from ${table} where id=$1`, [id]);
  } catch (e: any) {
    if (e?.code !== "42703") throw e;   // storage_path column not migrated yet → data-only
    const [r] = await q<{ data: string | null; created_by: number | null }>(
      `select data, created_by from ${table} where id=$1`, [id]);
    row = r ? { ...r, storage_path: null } : undefined;
  }
  if (!row) return "not_found";
  if (!canSeeAll && Number(row.created_by) !== Number(userId)) return "forbidden";

  if (row.storage_path) {
    const dl = await getSupabaseAdmin().storage.from(ATTACH_BUCKET).download(row.storage_path);
    if (dl.error || !dl.data) return "not_found";
    return { bytes: Buffer.from(await dl.data.arrayBuffer()), mime: mimeForPath(row.storage_path) };
  }
  if (!row.data) return "not_found";
  return decodeDataUri(row.data);
}

/** Delete an attachment row and its Storage object (if any). Returns rows deleted.
 *  `ownerId` (when given) scopes the delete to that uploader. Tolerates a
 *  pre-migration schema (no storage_path column). */
export async function deleteAttachment(table: AttachTable, id: number, ownerId?: number): Promise<number> {
  const scope = typeof ownerId === "number" ? ` and created_by = ${Number(ownerId)}` : "";
  let path: string | null = null;
  let n = 0;
  try {
    const rows = await q<{ storage_path: string | null }>(
      `delete from ${table} where id = $1${scope} returning storage_path`, [id]);
    n = rows.length; path = rows[0]?.storage_path ?? null;
  } catch (e: any) {
    if (e?.code !== "42703") throw e;   // no storage_path column yet
    const rows = await q(`delete from ${table} where id = $1${scope} returning id`, [id]);
    n = rows.length;
  }
  if (path && storageEnabled()) {
    try { await getSupabaseAdmin().storage.from(ATTACH_BUCKET).remove([path]); }
    catch (e) { console.error("[deleteAttachment] storage remove failed:", (e as any)?.message || e); }
  }
  return n;
}
