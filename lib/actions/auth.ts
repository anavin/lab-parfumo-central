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
import { isBranch, branchName } from "@/lib/branches";

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

const ADMIN_ONLY = "การจัดการบัญชีผู้ดูแลหรือให้สิทธิ์ระดับผู้ดูแล ทำได้เฉพาะผู้ดูแลระบบ";

// All admin actions RETURN { ok, error } (never throw for validation/permission/dup)
// so the Thai message survives Next's production error masking — a thrown error would
// reach the client only as a generic "Server Components render" digest.
export async function createUser(input: { username: string; full_name: string; role: string; password: string }): Promise<{ ok: boolean; error?: string }> {
  const me = await requirePermission("users");
  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9._-]{2,40}$/.test(username)) return { ok: false, error: "username ใช้ได้เฉพาะ a-z 0-9 . _ - (2-40 ตัว)" };
  if (!input.full_name.trim()) return { ok: false, error: "กรุณากรอกชื่อ-นามสกุล" };
  const v = validatePassword(input.password, username);
  if (!v.ok) return { ok: false, error: v.message };
  const role = normRole(input.role);
  // Only a real admin may mint another admin (otherwise the 'users' menu would
  // be a backdoor to full control).
  if (role === "admin" && me.role !== "admin") return { ok: false, error: ADMIN_ONLY };
  const [dup] = await q<{ id: number }>(`select id from users where username = $1`, [username]);
  if (dup) return { ok: false, error: "username นี้มีอยู่แล้ว" };
  const hash = await hashBcrypt(input.password);
  await q(`insert into users (username, password_hash, full_name, role) values ($1,$2,$3,$4)`,
    [username, hash, input.full_name.trim(), role]);
  await logAudit("create", "user", username, `${input.full_name.trim()} · ${ROLE_LABEL[role] ?? role}`);
  revalidatePath("/users");
  return { ok: true };
}

// Assign a user's home branch (admin). null = default branch; /my defaults to this but the
// salesperson can still switch for the day.
export async function setUserBranch(id: number, branch: string | null): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("users");
  const b = branch && isBranch(branch) ? branch : null;
  try {
    await q(`update users set branch = $2 where id = $1`, [id, b]);
  } catch (e: any) {
    if (e?.code === "42703") return { ok: false, error: "ยังไม่ได้รัน SQL 0026 (users.branch)" };
    throw e;
  }
  await logAudit("update", "user", String(id), `สาขา → ${b ? branchName(b) : "ค่าเริ่มต้น"}`);
  revalidatePath("/users");
  return { ok: true };
}

// Change a user's role and/or custom permission set. permissions = null clears
// the override (inherit the role preset); an array stores explicit access.
export async function updateUserAccess(id: number, role: string, permissions: string[] | null): Promise<{ ok: boolean; error?: string }> {
  const me = await requirePermission("users");
  const nextRole = normRole(role);
  const nextPerms = permissions == null
    ? null
    : (permissions.filter((k) => (ALL_PERM_KEYS as string[]).includes(k)) as PermKey[]);

  const [target] = await q<{ username: string; role: string }>(`select username, role from users where id = $1`, [id]);
  if (!target) return { ok: false, error: "ไม่พบผู้ใช้" };

  // Escalation guards — only a real admin may touch admin accounts, promote to
  // admin, or hand out the user-management menu.
  if (me.role !== "admin") {
    if (target.role === "admin") return { ok: false, error: ADMIN_ONLY };
    if (nextRole === "admin") return { ok: false, error: ADMIN_ONLY };
    if (nextPerms ? nextPerms.includes("users") : (ROLE_PRESETS[nextRole] as string[]).includes("users")) return { ok: false, error: ADMIN_ONLY };
  }

  // A non-admin role with an explicit but empty permission set can access
  // nothing (and would bounce in a redirect loop) — block it; use ปิดบัญชี to
  // suspend instead.
  if (nextRole !== "admin" && nextPerms !== null && nextPerms.length === 0)
    return { ok: false, error: "เลือกสิทธิ์อย่างน้อย 1 เมนู หรือใช้ “ปิดบัญชี” เพื่อระงับการใช้งาน" };

  // Don't let a user lock themselves out of user management.
  if (me.id === id) {
    const keepsUsers = nextRole === "admin" ||
      (nextPerms ? nextPerms.includes("users") : (ROLE_PRESETS[nextRole] as string[]).includes("users"));
    if (!keepsUsers) return { ok: false, error: "เปลี่ยนสิทธิ์ตัวเองจนออกจากการจัดการผู้ใช้ไม่ได้" };
  }

  await q(`update users set role = $2, permissions = $3 where id = $1`, [id, nextRole, nextPerms]);
  // changing access invalidates the cached role in live sessions → force re-login
  await q(`delete from user_sessions where user_id = $1 and $1 <> $2`, [id, me.id]);
  await logAudit("update", "user", target.username, `สิทธิ์: ${ROLE_LABEL[nextRole] ?? nextRole}${nextPerms ? ` · กำหนดเอง ${nextPerms.length} เมนู` : ""}`);
  revalidatePath("/users");
  return { ok: true };
}

// Permanently delete a user. Only allowed when they have NO sales/review history —
// those records reference the user (Postgres RESTRICT) and must be preserved; direct
// such accounts to "ปิดบัญชี" instead. Sessions/daily_cash cascade, audit/payments null out.
export async function deleteUser(id: number): Promise<{ ok: boolean; error?: string }> {
  const me = await requirePermission("users");
  if (me.id === id) return { ok: false, error: "ลบบัญชีตัวเองไม่ได้" };
  const [u] = await q<{ username: string; role: string }>(`select username, role from users where id = $1`, [id]);
  if (!u) return { ok: false, error: "ไม่พบผู้ใช้" };
  if (u.role === "admin" && me.role !== "admin") return { ok: false, error: ADMIN_ONLY };
  // best-effort history check for a friendly message (Postgres also RESTRICTs these)
  try {
    const [h] = await q<{ n: number }>(`
      select ((select count(*) from submissions where created_by = $1 or reviewed_by = $1)
            + (select count(*) from sales where created_by = $1)
            + (select count(*) from daily_customers where created_by = $1)
            + (select count(*) from bill_attachments where created_by = $1))::int n`, [id]);
    if ((h?.n ?? 0) > 0) return { ok: false, error: "ผู้ใช้นี้มีประวัติการขาย/ตรวจสอบ ลบถาวรไม่ได้ — ใช้ “ปิดบัญชี” แทนเพื่อเก็บประวัติ" };
  } catch { /* a missing table shouldn't block; the delete below still guards via FK */ }
  try {
    await q(`delete from user_sessions where user_id = $1`, [id]);
    await q(`delete from users where id = $1`, [id]);
  } catch (e: any) {
    if (e?.code === "23503") return { ok: false, error: "ผู้ใช้นี้มีประวัติการขาย/ตรวจสอบ ลบถาวรไม่ได้ — ใช้ “ปิดบัญชี” แทน" };
    console.error("[deleteUser] failed", e);
    return { ok: false, error: "ลบไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
  await logAudit("delete", "user", u.username, `ลบผู้ใช้ถาวร · ${u.username}`);
  revalidatePath("/users");
  return { ok: true };
}

export async function setUserActive(id: number, active: boolean): Promise<{ ok: boolean; error?: string }> {
  const me = await requirePermission("users");
  if (me.id === id && !active) return { ok: false, error: "ปิดบัญชีตัวเองไม่ได้" };
  const [u] = await q<{ username: string; role: string }>(`select username, role from users where id = $1`, [id]);
  if (!u) return { ok: false, error: "ไม่พบผู้ใช้" };
  if (u.role === "admin" && me.role !== "admin") return { ok: false, error: ADMIN_ONLY };
  await q(`update users set is_active = $2 where id = $1`, [id, active]);
  if (!active) await q(`delete from user_sessions where user_id = $1`, [id]); // kick out
  await logAudit("update", "user", u.username, active ? "เปิดบัญชี" : "ปิดบัญชี");
  revalidatePath("/users");
  return { ok: true };
}

// Returns a result (never throws for validation/dup) so the message survives Next's
// production error masking — throwing would show only a generic digest error.
export async function updateUserProfile(id: number, input: { full_name: string; username: string }): Promise<{ ok: boolean; error?: string }> {
  const me = await requirePermission("users");
  const [u] = await q<{ username: string; role: string }>(`select username, role from users where id = $1`, [id]);
  if (!u) return { ok: false, error: "ไม่พบผู้ใช้" };
  if (u.role === "admin" && me.role !== "admin") return { ok: false, error: ADMIN_ONLY };
  const full_name = input.full_name.trim();
  const username = input.username.trim().toLowerCase();
  if (!full_name) return { ok: false, error: "กรุณากรอกชื่อ-นามสกุล" };
  if (!/^[a-z0-9._-]{2,40}$/.test(username)) return { ok: false, error: "username ใช้ได้เฉพาะ a-z 0-9 . _ - (2-40 ตัว)" };
  const [dup] = await q<{ id: number }>(`select id from users where username = $1 and id <> $2`, [username, id]);
  if (dup) return { ok: false, error: "username นี้มีอยู่แล้ว" };
  await q(`update users set full_name = $2, username = $3 where id = $1`, [id, full_name, username]);
  const detail = username !== u.username ? `${full_name} · @${u.username} → @${username}` : full_name;
  await logAudit("update", "user", username, detail);
  revalidatePath("/users");
  return { ok: true };
}

export async function resetPassword(id: number, password: string): Promise<{ ok: boolean; error?: string }> {
  const me = await requirePermission("users");
  const [u] = await q<{ username: string; role: string }>(`select username, role from users where id = $1`, [id]);
  if (!u) return { ok: false, error: "ไม่พบผู้ใช้" };
  if (u.role === "admin" && me.role !== "admin") return { ok: false, error: ADMIN_ONLY };
  const v = validatePassword(password, u.username);
  if (!v.ok) return { ok: false, error: v.message };
  await q(`update users set password_hash = $2 where id = $1`, [id, await hashBcrypt(password)]);
  await q(`delete from user_sessions where user_id = $1`, [id]); // force re-login
  await logAudit("password", "user", u.username, "รีเซ็ตรหัสผ่าน");
  revalidatePath("/users");
  return { ok: true };
}

export async function changeMyPassword(current: string, next: string): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "ไม่ได้เข้าสู่ระบบ" };
  const login = await loginWithPassword(me.username, current);
  if (!login.ok) return { ok: false, error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  const v = validatePassword(next, me.username);
  if (!v.ok) return { ok: false, error: v.message };
  await q(`update users set password_hash = $2 where id = $1`, [me.id, await hashBcrypt(next)]);
  revalidatePath("/");
  return { ok: true };
}
