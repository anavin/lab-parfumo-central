import type { Viewport } from "next";
import { cookies } from "next/headers";
import { Boxes } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { isBranch, DEFAULT_BRANCH, branchName } from "@/lib/branches";
import { stockLive, skuUnits } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { BranchStockPanel } from "@/components/BranchStockPanel";

export const dynamic = "force-dynamic";

// mobile-only like /my — lock zoom so the layout doesn't shift on tap
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false };

const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

export default async function MyStockPage() {
  const user = await requireUser();
  const today = bkkToday();
  const jar = await cookies();
  const [bCode, bDate] = (jar.get("my_branch")?.value || "").split(":");
  const home = isBranch(user.branch) ? user.branch! : DEFAULT_BRANCH;
  const branch = bDate === today && isBranch(bCode) ? bCode : home;
  const [stock, skus] = await Promise.all([stockLive(branch), skuUnits(branch)]);
  // SKU ที่ยังมีของ (in_stock) จัดกลุ่มตามบาร์โค้ด เพื่อโชว์ใต้แต่ละสินค้า
  const skusByBc: Record<string, string[]> = {};
  for (const u of skus) if (u.status === "in_stock" && u.barcode) (skusByBc[u.barcode] ??= []).push(u.sku);
  for (const k in skusByBc) skusByBc[k].sort();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader icon={Boxes} title="สต๊อกสาขา" subtitle={`คงเหลือของ ${branchName(branch)} วันนี้`} />
      <BranchStockPanel rows={stock} branchName={branchName(branch)} skusByBc={skusByBc} defaultOpen />
    </div>
  );
}
