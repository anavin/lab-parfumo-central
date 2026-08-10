import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { q } from "@/lib/db";
import { PRODUCT_SEARCH_ORDER } from "@/lib/product-order";

// Plain GET JSON search — WebView-friendly (old Android WebViews choke on the
// Next.js server-action fetch used by the client component). Same prefix match
// as searchProducts(): "ขึ้นต้นด้วย" on scent / barcode / sku.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const term = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!term) return NextResponse.json([]);
  const t = `${term}%`;
  const rows = await q<{ id: number; barcode: string; scent: string; grade: string; size: string; sku: string; price: number }>(
    `select id, barcode, scent, grade, size, sku, price::float
     from products
     where scent ilike $1 or barcode ilike $1 or sku ilike $1
     ${PRODUCT_SEARCH_ORDER}`, [t]);
  return NextResponse.json(rows);
}
