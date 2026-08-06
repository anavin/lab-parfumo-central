import { cache } from "react";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { q } from "@/lib/db";
import { SESSION_COOKIE, SESSION_IDLE_MIN, SESSION_COOKIE_MAX_AGE_DAYS, type User } from "./constants";

export { SESSION_COOKIE, type User };

const missingCol = (e: any) => e?.code === "42703" || /column .*remember.* does not exist/i.test(String(e?.message || ""));

export async function createSession(userId: number, remember = false): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  try {
    await q(`insert into user_sessions (token, user_id, remember) values ($1, $2, $3)`, [token, userId, remember]);
  } catch (e) {
    // migration 0009 (remember column) not applied yet → insert without it
    if (!missingCol(e)) throw e;
    await q(`insert into user_sessions (token, user_id) values ($1, $2)`, [token, userId]);
  }
  return token;
}

export async function getUserFromToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const sql = (permCol: string) => `
    select u.id, u.username, u.full_name, u.role, ${permCol} as permissions, u.is_active, u.last_login_at, u.created_at,
           s.last_activity_at
    from user_sessions s join users u on u.id = s.user_id
    where s.token = $1 and u.is_active = true`;
  let rows: (User & { last_activity_at: string })[];
  try {
    rows = await q<User & { last_activity_at: string }>(sql("u.permissions"), [token]);
  } catch (e: any) {
    // Migration 0005 (users.permissions) not applied yet → fall back to role
    // presets so the whole app doesn't hard-crash. (Postgres 42703 = undefined_column.)
    if (e?.code !== "42703" && !/permissions.*does not exist/i.test(String(e?.message || ""))) throw e;
    rows = await q<User & { last_activity_at: string }>(sql("null::text[]"), [token]);
  }
  const row = rows[0];
  if (!row) return null;

  // "remember me" sessions skip the idle auto-logout (resilient if column absent)
  let remember = false;
  try {
    const r = await q<{ remember: boolean }>(`select coalesce(remember,false) remember from user_sessions where token = $1`, [token]);
    remember = !!r[0]?.remember;
  } catch (e) { if (!missingCol(e)) throw e; }

  const idleMin = (Date.now() - new Date(row.last_activity_at).getTime()) / 60_000;
  if (!remember && idleMin > SESSION_IDLE_MIN) {
    await q(`delete from user_sessions where token = $1`, [token]).catch(() => {});
    return null;
  }
  // touch (fire-and-forget)
  q(`update user_sessions set last_activity_at = now() where token = $1`, [token]).catch(() => {});

  const { last_activity_at, ...user } = row;
  return user as User;
}

export async function deleteSession(token: string): Promise<void> {
  await q(`delete from user_sessions where token = $1`, [token]);
}

/** React.cache dedupes this within a single request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return getUserFromToken(token);
});

export async function setSessionCookie(token: string, remember = false): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // remember → persistent (survives browser restart); otherwise a session cookie
    ...(remember ? { maxAge: 60 * 60 * 24 * SESSION_COOKIE_MAX_AGE_DAYS } : {}),
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
