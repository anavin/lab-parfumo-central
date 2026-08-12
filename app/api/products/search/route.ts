import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { searchProductsForSale } from "@/lib/queries";
import { isBranch, DEFAULT_BRANCH } from "@/lib/branches";

// Plain GET JSON search — WebView-friendly (old Android WebViews choke on the
// Next.js server-action fetch used by the client component). Same prefix match
// as before, but a stock-gated branch (SCS) only returns products in stock there.
export const dynamic = "force-dynamic";

const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const term = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!term) return NextResponse.json([]);

  // Branch: explicit ?branch= wins; else the salesperson's daily-picked branch (cookie
  // my_branch=CODE:YYYY-MM-DD, only for today). Unknown → default (unfiltered) branch.
  const today = bkkToday();
  const qBranch = req.nextUrl.searchParams.get("branch");
  const [bCode, bDate] = (req.cookies.get("my_branch")?.value || "").split(":");
  const cookieBranch = bDate === today && isBranch(bCode) ? bCode : null;
  const branch = qBranch && isBranch(qBranch) ? qBranch : cookieBranch ?? DEFAULT_BRANCH;

  const rows = await searchProductsForSale(term, branch);
  return NextResponse.json(rows);
}
