import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { q } from "@/lib/db";

// Streams one bill_attachment's image bytes by id. List pages no longer embed the
// base64 `data` (that pulled the DB's heaviest column on every force-dynamic render
// and blew up Supabase egress) — they lazy-load through this route instead, and the
// long immutable Cache-Control means a reviewer's repeated /review loads hit the DB
// at most once per image per browser.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { id } = await params;
  const nid = Number(id);
  if (!Number.isInteger(nid) || nid <= 0) return new Response("bad id", { status: 400 });

  const [row] = await q<{ data: string; created_by: number | null }>(
    `select data, created_by from bill_attachments where id = $1`, [nid]);
  if (!row) return new Response("not found", { status: 404 });

  // Reviewers see every slip; everyone else only the ones they uploaded.
  if (!can(user, "review") && row.created_by !== user.id)
    return new Response("forbidden", { status: 403 });

  // `data` is a data: URI (data:image/jpeg;base64,....) — decode to raw bytes.
  let mime = "image/jpeg";
  let b64 = row.data;
  const m = /^data:([^;]+);base64,(.*)$/s.exec(row.data);
  if (m) { mime = m[1] || mime; b64 = m[2]; }
  const buf = Buffer.from(b64, "base64");

  return new Response(buf, {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(buf.length),
      // slips never change once uploaded → cache hard (per-user, since it's auth-gated)
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
