import { NextResponse } from "next/server";
import { loginWithPassword } from "@/lib/auth/login";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { can, landingFor, permissionForPath } from "@/lib/auth/permissions";

// Login via a plain route handler (not a Server Action). A server action's
// implicit post-action router refresh races with the client's hard navigation
// and can trap the destination page in an RSC refetch loop (blank page needing a
// manual refresh). A route handler + fetch has no such refresh, so the client
// can window.location.assign() cleanly.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const username = String(body.username ?? "");
  const password = String(body.password ?? "");
  const next = typeof body.next === "string" ? body.next : "/";

  const res = await loginWithPassword(username, password);
  if (!res.ok || !res.user) {
    await logAudit("login_failed", "auth", username || null, res.error ?? "เข้าระบบไม่สำเร็จ",
      { username: username || "-", full_name: username || "(ไม่ทราบ)", role: "-" });
    return NextResponse.json({ ok: false, error: res.error ?? "เข้าสู่ระบบไม่สำเร็จ", attemptsRemaining: res.attemptsRemaining });
  }

  const token = await createSession(res.user.id);
  await setSessionCookie(token);
  await logAudit("login", "auth", res.user.username, "เข้าสู่ระบบ", res.user);

  // Resolve the final destination by the user's permissions so they land on a
  // page they can actually see.
  const wanted = next.startsWith("/") ? next : "/";
  const wantedPerm = permissionForPath(wanted);
  const dest = wantedPerm == null || can(res.user, wantedPerm) ? wanted : landingFor(res.user);
  return NextResponse.json({ ok: true, next: dest });
}
