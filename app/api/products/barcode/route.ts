import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { q } from "@/lib/db";

// Exact barcode lookup as a plain GET (WebView-friendly). Old Android WebViews
// (SUNMI) can't run Next.js server actions, so scan-to-add used to silently fail;
// the scanner fetches this instead. Returns the product or null.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const code = (req.nextUrl.searchParams.get("code") || "").trim();
  if (!code) return NextResponse.json(null);
  const [p] = await q<{ id: number; barcode: string; scent: string; grade: string; size: string; sku: string; price: number }>(
    `select id, barcode, scent, grade, size, sku, price::float from products where barcode = $1 limit 1`, [code]);
  return NextResponse.json(p ?? null);
}
