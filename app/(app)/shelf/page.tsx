import { Store } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { requireAnyPermission } from "@/lib/auth/require-user";
import { can } from "@/lib/auth/permissions";
import { shelfCaptureReview, stockLive, skuUnits, salesAfterDate, shelfCaptureDate } from "@/lib/queries";
import { isBranch, DEFAULT_BRANCH, branchName } from "@/lib/branches";
import { BranchTabs } from "@/components/BranchTabs";
import { ShelfStockReview, type ShelfRow } from "@/components/ShelfStockReview";
import { SkuCutPanel } from "@/components/SkuCutPanel";

export const dynamic = "force-dynamic";

// สต็อกหน้าร้าน — เช็คข้อมูลที่เก็บ (เมนู "เก็บข้อมูลใหม่") เทียบกับระบบ แล้วกดปุ่มเดียวอัปเข้าระบบทั้งหมด
export default async function ShelfPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const user = await requireAnyPermission(["requisitions", "stock"]);
  const sp = await searchParams;
  const branch = sp.branch === "all" ? null : (isBranch(sp.branch) ? sp.branch! : DEFAULT_BRANCH);

  const captureDate = await shelfCaptureDate(branch);   // e.g. "2026-10-30" (วันที่นับ)
  // sold AFTER the capture date = today's (post-count) sales — to mark & to subtract in "ยอด ณ วันที่นับ"
  const soldAfter = branch && captureDate ? await salesAfterDate(branch, captureDate) : new Map<string, number>();
  const [caps, live, skus] = await Promise.all([
    shelfCaptureReview(branch), stockLive(branch), skuUnits(branch),
  ]);
  const remByBc = new Map(live.map((r) => [r.barcode, Math.round(Number(r.remaining) || 0)]));
  const skuInByBc = new Map<string, number>();
  const inStockSkus: { sku: string; scent: string | null; size: string | null; barcode: string | null }[] = [];
  for (const u of skus) if (u.status === "in_stock") {
    if (u.barcode) skuInByBc.set(u.barcode, (skuInByBc.get(u.barcode) || 0) + 1);
    inStockSkus.push({ sku: u.sku, scent: u.scent, size: u.size, barcode: u.barcode });
  }

  const rows: ShelfRow[] = caps.map((c) => ({
    barcode: c.barcode,
    scent: c.scent || c.barcode,
    size: c.size || "",
    captured: c.captured,
    remaining: remByBc.get(c.barcode) ?? 0,
    skuInStock: skuInByBc.get(c.barcode) ?? 0,
    soldToday: Math.round(Number(soldAfter.get(c.barcode) || 0)),
    skus: Array.isArray(c.skus) ? c.skus.filter(Boolean) : [],
  }));
  // สินค้าที่ระบบมีสต๊อก แต่ไม่ได้ถูกนับ (อาจขายหมด/ไม่อยู่บนชั้น) — ต้องรีวิวก่อนตั้งเป็น 0
  const capSet = new Set(caps.map((c) => c.barcode));
  const missing = live
    .map((r) => ({ barcode: r.barcode, scent: r.scent || r.barcode, size: r.size || "", remaining: Math.round(Number(r.remaining) || 0) }))
    .filter((r) => r.remaining > 0 && !capSet.has(r.barcode))
    .sort((a, b) => b.remaining - a.remaining);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader icon={Store} title="สต็อกหน้าร้าน"
        subtitle={`เช็คข้อมูลที่เก็บ${branch ? ` · ${branchName(branch)}` : " · ทุกสาขา"} แล้วอัปเข้าระบบให้ใช้ข้อมูลชุดเดียวกัน`} />
      <div className="mb-4"><BranchTabs withAll defaultValue={DEFAULT_BRANCH} /></div>
      <ShelfStockReview rows={rows} branch={branch} canApply={can(user, "requisitions")} captureDate={captureDate} missing={missing} />
      {branch && inStockSkus.length > 0 && (
        <div className="mt-4"><SkuCutPanel skus={inStockSkus} branch={branch} /></div>
      )}
    </div>
  );
}
