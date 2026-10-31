import { Store } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { requireAnyPermission } from "@/lib/auth/require-user";
import { can } from "@/lib/auth/permissions";
import { shelfCaptureReview, stockLive, skuUnits } from "@/lib/queries";
import { isBranch, DEFAULT_BRANCH, branchName } from "@/lib/branches";
import { BranchTabs } from "@/components/BranchTabs";
import { ShelfStockReview, type ShelfRow } from "@/components/ShelfStockReview";

export const dynamic = "force-dynamic";

// สต็อกหน้าร้าน — เช็คข้อมูลที่เก็บ (เมนู "เก็บข้อมูลใหม่") เทียบกับระบบ แล้วกดปุ่มเดียวอัปเข้าระบบทั้งหมด
export default async function ShelfPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const user = await requireAnyPermission(["requisitions", "stock"]);
  const sp = await searchParams;
  const branch = sp.branch === "all" ? null : (isBranch(sp.branch) ? sp.branch! : DEFAULT_BRANCH);

  const [caps, live, skus] = await Promise.all([
    shelfCaptureReview(branch), stockLive(branch), skuUnits(branch),
  ]);
  const remByBc = new Map(live.map((r) => [r.barcode, Math.round(Number(r.remaining) || 0)]));
  const skuInByBc = new Map<string, number>();
  for (const u of skus) if (u.status === "in_stock" && u.barcode) skuInByBc.set(u.barcode, (skuInByBc.get(u.barcode) || 0) + 1);

  const rows: ShelfRow[] = caps.map((c) => ({
    barcode: c.barcode,
    scent: c.scent || c.barcode,
    size: c.size || "",
    captured: c.captured,
    remaining: remByBc.get(c.barcode) ?? 0,
    skuInStock: skuInByBc.get(c.barcode) ?? 0,
    skus: Array.isArray(c.skus) ? c.skus.filter(Boolean) : [],
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader icon={Store} title="สต็อกหน้าร้าน"
        subtitle={`เช็คข้อมูลที่เก็บ${branch ? ` · ${branchName(branch)}` : " · ทุกสาขา"} แล้วอัปเข้าระบบให้ใช้ข้อมูลชุดเดียวกัน`} />
      <div className="mb-4"><BranchTabs withAll defaultValue={DEFAULT_BRANCH} /></div>
      <ShelfStockReview rows={rows} branch={branch} canApply={can(user, "requisitions")} />
    </div>
  );
}
