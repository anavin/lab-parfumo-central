import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { q } from "@/lib/db";

// Streams one cash_attachments (bank-deposit slip) image by id — same lazy/cache
// approach as /api/attachment/[id] for bill slips, so /cash and the daily report
// stop pulling base64 on every render.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { id } = await params;
  const nid = Number(id);
  if (!Number.isInteger(nid) || nid <= 0) return new Response("bad id", { status: 400 });

  const [row] = await q<{ data: string; created_by: number | null }>(
    `select data, created_by from cash_attachments where id = $1`, [nid]);
  if (!row) return new Response("not found", { status: 404 });

  // Cash reviewers (admin drawer) see every slip; staff only their own deposits.
  if (!can(user, "cash") && row.created_by !== user.id)
    return new Response("forbidden", { status: 403 });

  let mime = "image/jpeg";
  let b64 = row.data;
  const m = /^data:([^;]+);base64,(.*)$/s.exec(row.data);
  if (m) { mime = m[1] || mime; b64 = m[2]; }
  const buf = Buffer.from(b64, "base64");

  return new Response(buf, {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(buf.length),
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
