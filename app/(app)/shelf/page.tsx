import { Store } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { requireAnyPermission } from "@/lib/auth/require-user";
import { can } from "@/lib/auth/permissions";
import { shelfCaptureReview, stockLive, skuUnits, salesAfterDate, shelfCaptureDate, guessedSkuCutsToday } from "@/lib/queries";
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
  // ซิงก์ 2 ทาง: ส่วนเกิน (in_stock > คงเหลือ) ตัด · ส่วนขาด (in_stock < คงเหลือ) คืนจากที่เดาตัด
  // ข้าม 4ml (ไม่มี SKU)
  const is4ml = (s: string | null) => /^\s*4\s*ml/i.test(String(s || ""));
  const bc4ml = new Set(live.filter((r) => is4ml(r.size)).map((r) => r.barcode));
  const guessedByBc = new Map<string, number>();
  for (const u of skus) if (u.status === "sold" && !u.sold_receipt_no && u.barcode) guessedByBc.set(u.barcode, (guessedByBc.get(u.barcode) || 0) + 1);
  let phantomTotal = 0, restoreTotal = 0;
  for (const bc of new Set([...remByBc.keys(), ...skuInByBc.keys()])) {
    if (!bc || bc4ml.has(bc)) continue;
    const r = remByBc.get(bc) ?? 0, ins = skuInByBc.get(bc) ?? 0;
    if (ins > r) phantomTotal += ins - r;
    else if (ins < r) restoreTotal += Math.min(r - ins, guessedByBc.get(bc) ?? 0);
  }
  // SKU ที่ถูก "ตัดแบบเดา วันนี้" (sold ไม่ผูกบิล + sold_at วันนี้) → คืนได้ เพื่อไปใส่ SKU จริงรายบิล
  const guessedCut = branch ? await guessedSkuCutsToday(branch) : 0;

  // สินค้าที่ระบบมีสต๊อก แต่ไม่ได้ถูกนับ (อาจขายหมด/ไม่อยู่บนชั้น) — ต้องรีวิวก่อนตั้งเป็น 0
  const capSet = new Set(caps.map((c) => c.barcode));
  const missing = live
    .map((r) => ({ barcode: r.barcode, scent: r.scent || r.barcode, size: r.size || "", remaining: Math.round(Number(r.remaining) || 0) }))
    // ไม่รวมเทสเตอร์ (TRY ME) + ถุง/บรรจุภัณฑ์ — ไม่ได้นับบนชั้น ไม่ควรถูกตั้ง 0
    .filter((r) => r.remaining > 0 && !capSet.has(r.barcode) && !/try\s*me/i.test(r.scent) && !/ถุง/.test(r.scent))
    .sort((a, b) => b.remaining - a.remaining);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader icon={Store} title="สต็อกหน้าร้าน"
        subtitle={`เช็คข้อมูลที่เก็บ${branch ? ` · ${branchName(branch)}` : " · ทุกสาขา"} แล้วอัปเข้าระบบให้ใช้ข้อมูลชุดเดียวกัน`} />
      <div className="mb-4"><BranchTabs withAll defaultValue={DEFAULT_BRANCH} /></div>
      <ShelfStockReview rows={rows} branch={branch} canApply={can(user, "requisitions")} captureDate={captureDate} missing={missing} phantomTotal={phantomTotal} restoreTotal={restoreTotal} guessedCut={guessedCut} />
      {branch && inStockSkus.length > 0 && (
        <div className="mt-4"><SkuCutPanel skus={inStockSkus} branch={branch} /></div>
      )}
    </div>
  );
}
