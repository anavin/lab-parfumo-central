import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, deleteSession, clearSessionCookie, getCurrentUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Used by the client idle-logout timer (and can serve as a generic logout).
export async function POST(req: Request) {
  const me = await getCurrentUser();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  let reason = "ออกจากระบบ";
  try { const b = await req.json(); if (b?.reason === "idle") reason = "ออกจากระบบอัตโนมัติ (ไม่มีการใช้งาน 5 นาที)"; } catch {}
  if (me) await logAudit("logout", "auth", me.username, reason, me);
  if (token) await deleteSession(token);
  await clearSessionCookie();
  const resp = NextResponse.json({ ok: true });
  resp.cookies.delete("lp_remember");
  return resp;
}
