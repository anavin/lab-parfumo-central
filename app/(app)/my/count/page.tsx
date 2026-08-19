import type { Viewport } from "next";
import { cookies } from "next/headers";
import { ClipboardCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { isBranch, DEFAULT_BRANCH, branchName } from "@/lib/branches";
import { stockLive } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { StockCountForm } from "@/components/StockCountForm";

export const dynamic = "force-dynamic";
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false };

const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

export default async function MyCountPage() {
  const user = await requireUser();
  const today = bkkToday();
  const jar = await cookies();
  const [bCode, bDate] = (jar.get("my_branch")?.value || "").split(":");
  const home = isBranch(user.branch) ? user.branch! : DEFAULT_BRANCH;
  const branch = bDate === today && isBranch(bCode) ? bCode : home;

  // items to count: what's in stock (remaining>0) OR anything that has moved (sold>0) —
  // so a product sold down to 0 (or oversold) still shows under "มีความเคลื่อนไหว".
  const stock = await stockLive(branch);
  const expected = stock.filter((r) => (Number(r.remaining) || 0) > 0 || (Number(r.sold) || 0) > 0)
    .map((r) => ({ barcode: r.barcode, scent: r.scent, size: r.size, remaining: r.remaining, sold: r.sold }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[900px] mx-auto">
      <PageHeader icon={ClipboardCheck} title="นับสต๊อก"
        subtitle={`${branchName(branch)} · สแกนหรือกรอกจำนวนที่นับได้จริง`} />
      <StockCountForm expected={expected} branch={branch} />
    </div>
  );
}
