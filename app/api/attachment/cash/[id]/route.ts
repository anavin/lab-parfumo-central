import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { readAttachmentBytes } from "@/lib/attachments";

// Streams one cash_attachments (bank-deposit slip) image by id — Storage when
// migrated, else legacy base64. Same lazy/cache approach as the bill route.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { id } = await params;
  const nid = Number(id);
  if (!Number.isInteger(nid) || nid <= 0) return new Response("bad id", { status: 400 });

  // Cash reviewers (admin drawer) see every slip; staff only their own deposits.
  const res = await readAttachmentBytes("cash_attachments", nid, can(user, "cash"), Number(user.id));
  if (res === "not_found") return new Response("not found", { status: 404 });
  if (res === "forbidden") return new Response("forbidden", { status: 403 });

  return new Response(new Uint8Array(res.bytes), {
    headers: {
      "Content-Type": res.mime,
      "Content-Length": String(res.bytes.length),
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
