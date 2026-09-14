import { snapshotStockNow } from "@/lib/queries";

// Nightly stock snapshot → stock_daily (powers the trend chart / leak detector).
// Guarded by CRON_SECRET like /api/cron/cleanup. Point an external scheduler at:
//   GET /api/cron/snapshot   header: Authorization: Bearer <CRON_SECRET>
// Idempotent per day (upsert) — safe to hit more than once; a later run just refreshes
// today's figures. Hit it once manually to seed the first data point.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  if (!secret || auth !== `Bearer ${secret}`) return new Response("unauthorized", { status: 401 });
  try {
    const r = await snapshotStockNow();
    return Response.json(r, { status: r.ok ? 200 : 500 });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.code || e?.message || "error" }, { status: 500 });
  }
}
