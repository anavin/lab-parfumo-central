"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { q } from "@/lib/db";
import { loginWithPassword } from "@/lib/auth/login";
import { createSession, deleteSession, setSessionCookie, clearSessionCookie, getCurrentUser } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { hashBcrypt, validatePassword } from "@/lib/auth/password";
import { requirePermission } from "@/lib/auth/require-user";
import { can, landingFor, permissionForPath, ROLE_PRESETS, ALL_PERM_KEYS, ROLE_LABEL, type RoleKey, type PermKey } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit";

// ---- login / logout -------------------------------------------------------
export async function signIn(_prev: unknown, formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  const res = await loginWithPassword(username, password);
  if (!res.ok || !res.user) {
    await logAudit("login_failed", "auth", username || null, res.error ?? "เข้าระบบไม่สำเร็จ",
      { username: username || "-", full_name: username || "(ไม่ทราบ)", role: "-" });
    return { error: res.error ?? "เข้าสู่ระบบไม่สำเร็จ", attemptsRemaining: res.attemptsRemaining };
  }
  const token = await createSession(res.user.id);
  await setSessionCookie(token);
  await logAudit("login", "auth", res.user.username, "เข้าสู่ระบบ", res.user);
  // Return success and let the client do a full navigation (window.location) so
  // the page always renders with the new cookie (a server-action redirect()'s
  // soft navigation can render blank right after login). Resolve the FINAL
  // destination here by the user's permissions, so they land straight on a page
  // they can see instead of hitting "/" and bouncing through the layout guard
  // (that extra hop is what left non-admins on a blank page needing a refresh).
  const wanted = next.startsWith("/") ? next : "/";
  const wantedPerm = permissionForPath(wanted);
  const dest = wantedPerm == null || can(res.user, wantedPerm) ? wanted : landingFor(res.user);
  return { ok: true as const, next: dest };
}

export async function signOut() {
  const me = await getCurrentUser();
  if (me) await logAudit("logout", "auth", me.username, "ออกจากระบบ", me);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  await clearSessionCookie();
  redirect("/login");
}

// ---- user management (admin) ----------------------------------------------
function normRole(role: string): RoleKey {
  return (ROLE_PRESETS as any)[role] ? (role as RoleKey) : "staff";
}

export async function createUser(input: { username: string; full_name: string; role: string; password: string }) {
  await requirePermission("users");
  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new Error("username ใช้ได้เฉพาะ a-z 0-9 . _ - (3-40 ตัว)");
  if (!input.full_name.trim()) throw new Error("กรุณากรอกชื่อ-นามสกุล");
  const v = validatePassword(input.password, username);
  if (!v.ok) throw new Error(v.message);
  const [dup] = await q<{ id: number }>(`select id from users where username = $1`, [username]);
  if (dup) throw new Error("username นี้มีอยู่แล้ว");
  const role = normRole(input.role);
  const hash = await hashBcrypt(input.password);
  await q(`insert into users (username, password_hash, full_name, role) values ($1,$2,$3,$4)`,
    [username, hash, input.full_name.trim(), role]);
  await logAudit("create", "user", username, `${input.full_name.trim()} · ${ROLE_LABEL[role] ?? role}`);
  revalidatePath("/users");
}

// Change a user's role and/or custom permission set. permissions = null clears
// the override (inherit the role preset); an array stores explicit access.
export async function updateUserAccess(id: number, role: string, permissions: string[] | null) {
  const me = await requirePermission("users");
  const nextRole = normRole(role);
  const nextPerms = permissions == null
    ? null
    : permissions.filter((k) => (ALL_PERM_KEYS as string[]).includes(k)) as PermKey[];

  // Don't let an admin lock themselves out of user management.
  if (me.id === id) {
    const stillAdmin = nextRole === "admin";
    const keepsUsers = stillAdmin || (nextPerms ? nextPerms.includes("users") : (ROLE_PRESETS[nextRole] as string[]).includes("users"));
    if (!keepsUsers) throw new Error("เปลี่ยนสิทธิ์ตัวเองจนออกจากการจัดการผู้ใช้ไม่ได้");
  }

  const [u] = await q<{ username: string }>(`select username from users where id = $1`, [id]);
  if (!u) throw new Error("ไม่พบผู้ใช้");
  await q(`update users set role = $2, permissions = $3 where id = $1`, [id, nextRole, nextPerms]);
  // changing access invalidates the cached role in live sessions → force re-login
  await q(`delete from user_sessions where user_id = $1 and $1 <> $2`, [id, me.id]);
  await logAudit("update", "user", u.username, `สิทธิ์: ${ROLE_LABEL[nextRole] ?? nextRole}${nextPerms ? ` · กำหนดเอง ${nextPerms.length} เมนู` : ""}`);
  revalidatePath("/users");
}

export async function setUserActive(id: number, active: boolean) {
  const me = await requirePermission("users");
  if (me.id === id && !active) throw new Error("ปิดบัญชีตัวเองไม่ได้");
  const [u] = await q<{ username: string }>(`select username from users where id = $1`, [id]);
  await q(`update users set is_active = $2 where id = $1`, [id, active]);
  if (!active) await q(`delete from user_sessions where user_id = $1`, [id]); // kick out
  await logAudit("update", "user", u?.username, active ? "เปิดบัญชี" : "ปิดบัญชี");
  revalidatePath("/users");
}

export async function resetPassword(id: number, password: string) {
  await requirePermission("users");
  const [u] = await q<{ username: string }>(`select username from users where id = $1`, [id]);
  const v = validatePassword(password, u?.username ?? "");
  if (!v.ok) throw new Error(v.message);
  await q(`update users set password_hash = $2 where id = $1`, [id, await hashBcrypt(password)]);
  await q(`delete from user_sessions where user_id = $1`, [id]); // force re-login
  await logAudit("password", "user", u?.username, "รีเซ็ตรหัสผ่าน");
  revalidatePath("/users");
}

export async function changeMyPassword(current: string, next: string) {
  const me = await getCurrentUser();
  if (!me) throw new Error("ไม่ได้เข้าสู่ระบบ");
  const login = await loginWithPassword(me.username, current);
  if (!login.ok) throw new Error("รหัสผ่านปัจจุบันไม่ถูกต้อง");
  const v = validatePassword(next, me.username);
  if (!v.ok) throw new Error(v.message);
  await q(`update users set password_hash = $2 where id = $1`, [me.id, await hashBcrypt(next)]);
  revalidatePath("/");
}
