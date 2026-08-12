import type { Viewport } from "next";
import { cookies } from "next/headers";
import { Boxes } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { isBranch, DEFAULT_BRANCH, branchName } from "@/lib/branches";
import { stockLive } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { BranchStockPanel } from "@/components/BranchStockPanel";

export const dynamic = "force-dynamic";

// mobile-only like /my — lock zoom so the layout doesn't shift on tap
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false };

const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

export default async function MyStockPage() {
  await requireUser();
  const today = bkkToday();
  const jar = await cookies();
  const [bCode, bDate] = (jar.get("my_branch")?.value || "").split(":");
  const branch = bDate === today && isBranch(bCode) ? bCode : DEFAULT_BRANCH;
  const stock = await stockLive(branch);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[900px] mx-auto">
      <PageHeader icon={Boxes} title="สตอกสาขา" subtitle={`คงเหลือของ ${branchName(branch)} วันนี้`} />
      <BranchStockPanel rows={stock} branchName={branchName(branch)} defaultOpen />
    </div>
  );
}
