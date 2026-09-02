import { PageHeader, Stat, Card } from "@/components/ui";
import { num, baht } from "@/lib/format";
import { q } from "@/lib/db";
import { stockLive, stockSummary, reorderSuggestions, negativeStock, stockValuation } from "@/lib/queries";
import { listStockAdjustments } from "@/lib/actions/stock";
import { ExportButton } from "@/components/ExportButton";
import { StockMatrix } from "@/components/StockMatrix";
import { StockAdjust } from "@/components/StockAdjust";
import { BranchStockClose } from "@/components/BranchStockClose";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { BranchTabs } from "@/components/BranchTabs";
import { isBranch, branchName } from "@/lib/branches";
import { Package, AlertTriangle, PackagePlus, ChevronDown } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StockPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const sp = await searchParams;
  const branch = isBranch(sp.branch) ? sp.branch! : null;   // null = all branches combined
  const [rows, s, user, adjustments, reorder, negatives, valuation] = await Promise.all([
    stockLive(branch), stockSummary(branch), getCurrentUser(), listStockAdjustments(branch),
    reorderSuggestions(branch), negativeStock(branch), stockValuation(branch),
  ]);
  const lowCount = (s.low ?? 0) + (s.out ?? 0);
  const canRequisition = !!user && can(user, "requisitions");

  // scents that are fully deactivated ("ปิดกลิ่น") → the matrix sinks them to the bottom.
  // Own guard: `active` column may not be migrated yet (0032).
  let inactiveScents: string[] = [];
  try {
    const pa = await q<{ scent: string; active: boolean }>(`select scent, bool_or(active) active from products group by scent`);
    inactiveScents = pa.filter((r) => !r.active).map((r) => r.scent);
  } catch { /* pre-0032 → treat all as active */ }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader icon={Package} title="สต๊อกคงเหลือ"
        subtitle={`คงเหลือแต่ละกลิ่น · ${branch ? branchName(branch) : "ทุกสาขา"}`}
        action={<div className="flex items-center gap-2">
          <BranchTabs withAll />
          {canRequisition && (
            <Link href="/stock/allocate" className="btn btn-brand">
              <PackagePlus className="w-4 h-4" /> จัดสต๊อกเข้าสาขา
            </Link>
          )}
          <ExportButton kind="stock" />
        </div>} />

      {/* PRIMARY: the stock matrix (คงเหลือแต่ละกลิ่น). Admin edits qty inline + closes scents. */}
      <Card title={`คงเหลือแต่ละกลิ่น · ${rows.length} SKU`}>
        <StockMatrix rows={rows} branch={branch} canEdit={canRequisition} inactiveScents={inactiveScents} />
      </Card>

      {/* SECONDARY: everything else, collapsed — click to expand */}
      <details className="mt-6 rounded-xl border border-line bg-surface group">
        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none text-sm font-semibold text-ink hover:bg-canvas/60 rounded-xl">
          <ChevronDown className="w-4 h-4 text-muted transition-transform group-open:rotate-180" />
          เครื่องมือ & รายงานเพิ่มเติม
          <span className="text-xs font-normal text-muted">(สรุป · มูลค่า · ควรเติม · สต๊อกติดลบ · ปรับสต๊อก)</span>
        </summary>
        <div className="px-4 pb-4 pt-1 space-y-6 border-t border-line-soft">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4">
            <Stat label="คงเหลือรวม" value={num(s.remaining)} tone="success" />
            <Stat label="ส่งไปทั้งหมด" value={num(s.shipped)} />
            <Stat label="ขายไปแล้ว" value={num(s.sold)} />
            <Stat label="ใกล้หมด (≤3)" value={String(s.low)} tone="brand" />
            <Stat label="หมดสต๊อก" value={String(s.out)} tone="danger" />
          </div>
          {valuation && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Stat label="มูลค่าสต๊อก (ต้นทุน)" value={baht(valuation.cost)} tone="success" />
              <Stat label="มูลค่าสต๊อก (ราคาขาย)" value={baht(valuation.retail)} />
              <Stat label="ยังไม่ได้ใส่ต้นทุน" value={`${valuation.uncosted} / ${valuation.skus} SKU`} tone={valuation.uncosted > 0 ? "warn" : undefined} />
            </div>
          )}
          {lowCount > 0 && (
            <div className="alert-warn flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-ink">
                <AlertTriangle className="w-5 h-5 text-warn shrink-0" />
                มีสินค้าใกล้หมด/หมด <b>{lowCount}</b> รายการ — ควรเบิกเพิ่ม
              </div>
              {canRequisition && (
                <a href="/requisitions/new?prefill=lowstock" className="btn btn-brand shrink-0">สร้างใบเบิกของที่ใกล้หมด</a>
              )}
            </div>
          )}
          {canRequisition && branch && (
            <BranchStockClose branch={branch} branchLabel={branchName(branch)} remainingUnits={Math.round(s.remaining)} skus={rows.length} />
          )}
          {canRequisition && <StockAdjust defaultBranch={branch} adjustments={adjustments} />}

          {reorder.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ink mb-2">ควรเติมสต๊อก ({reorder.length}) · เหลือ &lt; 14 วัน</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted border-b border-line">
                    <th className="py-2 pr-3">สินค้า</th>{!branch && <th className="py-2 pr-3">สาขา</th>}
                    <th className="py-2 pr-3 text-right">คงเหลือ</th><th className="py-2 pr-3 text-right">ขาย/วัน</th><th className="py-2 pr-3 text-right">เหลือกี่วัน</th>
                  </tr></thead>
                  <tbody>
                    {reorder.map((r, i) => (
                      <tr key={`${r.barcode}-${r.branch}-${i}`} className="border-b border-line/60">
                        <td className="py-2 pr-3">{r.scent}{r.size ? <span className="text-muted"> · {r.size}</span> : null}</td>
                        {!branch && <td className="py-2 pr-3 text-muted">{branchName(r.branch)}</td>}
                        <td className="py-2 pr-3 text-right tabular-nums">{num(r.remaining)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{r.velocity}</td>
                        <td className="py-2 pr-3 text-right"><span className={(r.days_cover ?? 99) <= 7 ? "chip-danger" : "chip-warn"}>{r.days_cover == null ? "—" : `${r.days_cover} วัน`}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {negatives.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ink mb-2">สต๊อกติดลบ ({negatives.length}) · ขาย/คืนเกินที่รับเข้า</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-muted border-b border-line">
                    <th className="py-2 pr-3">สินค้า</th>{!branch && <th className="py-2 pr-3">สาขา</th>}
                    <th className="py-2 pr-3 text-right">รับเข้า</th><th className="py-2 pr-3 text-right">ปรับ</th><th className="py-2 pr-3 text-right">ขาย</th><th className="py-2 pr-3 text-right">คืน</th><th className="py-2 pr-3 text-right">คงเหลือจริง</th>
                  </tr></thead>
                  <tbody>
                    {negatives.map((r, i) => (
                      <tr key={`${r.barcode}-${r.branch}-${i}`} className="border-b border-line/60">
                        <td className="py-2 pr-3">{r.scent}{r.size ? <span className="text-muted"> · {r.size}</span> : null}</td>
                        {!branch && <td className="py-2 pr-3 text-muted">{branchName(r.branch)}</td>}
                        <td className="py-2 pr-3 text-right tabular-nums">{num(r.shipped)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{num(r.adjusted)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{num(r.sold)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{num(r.returned)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-danger font-semibold">{num(r.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
