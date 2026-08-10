import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { q } from "@/lib/db";

// Full product catalog as one GET JSON, fetched once and cached in the client so
// scan-to-add resolves instantly (no per-scan network hop — big deal on the SUNMI
// over LTE). Small payload (~a few hundred rows).
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await q<{ id: number; barcode: string; scent: string; grade: string; size: string; sku: string; price: number }>(
    `select id, barcode, scent, grade, size, sku, price::float from products where barcode is not null`);
  return NextResponse.json(rows);
}
