import type { Viewport } from "next";
import { cookies } from "next/headers";
import { PackageCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { isBranch, DEFAULT_BRANCH, branchName } from "@/lib/branches";
import { pendingReceipts } from "@/lib/queries";
import { ReceivingPanel } from "@/components/ReceivingPanel";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false };

const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

// PO delivered to the branch → the salesperson receives it into stock here.
export default async function MyReceivePage() {
  const user = await requireUser();
  const today = bkkToday();
  const jar = await cookies();
  const [bCode, bDate] = (jar.get("my_branch")?.value || "").split(":");
  const home = isBranch(user.branch) ? user.branch! : DEFAULT_BRANCH;
  const branch = bDate === today && isBranch(bCode) ? bCode : home;   // for the subtitle only
  const receipts = await pendingReceipts(user.id, branch);   // assigned to this person (falls back to branch pre-0029)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader icon={PackageCheck} title="รับสินค้า"
        subtitle={`${branchName(branch)} · ใบเบิกที่มอบหมายให้คุณรับ กดรับเพื่อนำเข้าสต๊อก`} />
      {receipts.length
        ? <ReceivingPanel pending={receipts} />
        : <div className="rounded-xl border border-line bg-surface p-10 text-center text-sm text-muted">ยังไม่มีสินค้ารอรับเข้าสต๊อก</div>}
    </div>
  );
}
