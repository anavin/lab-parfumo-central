import { q } from "@/lib/db";

// Trims the append-only tables that otherwise grow forever (and inflate DB size +
// read egress). Guarded by CRON_SECRET so only a scheduled caller can run it —
// point an external cron (e.g. cron-job.org) at:
//   GET /api/cron/cleanup   header: Authorization: Bearer <CRON_SECRET>
// Retention: audit_log 365d, login_attempts 30d, user_sessions idle > 30d.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  if (!secret || auth !== `Bearer ${secret}`) return new Response("unauthorized", { status: 401 });

  const out: Record<string, number | string> = {};
  const del = async (label: string, sql: string) => {
    try { out[label] = (await q<{ n: number }>(sql))[0]?.n ?? 0; }
    catch (e: any) { out[label] = e?.code === "42P01" ? "no table" : `error: ${e?.code || e?.message}`; }
  };
  await del("audit_log", `with d as (delete from audit_log where created_at < now() - interval '365 days' returning 1) select count(*)::int n from d`);
  await del("login_attempts", `with d as (delete from login_attempts where created_at < now() - interval '30 days' returning 1) select count(*)::int n from d`);
  await del("user_sessions", `with d as (delete from user_sessions where last_activity_at < now() - interval '30 days' returning 1) select count(*)::int n from d`);

  return Response.json({ ok: true, deleted: out });
}
