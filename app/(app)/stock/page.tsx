import { PageHeader, Stat, Card } from "@/components/ui";
import { num, baht } from "@/lib/format";
import { q } from "@/lib/db";
import { stockPageBundle, stockMovement, countVariance, lossSignals, stockTrendTotals } from "@/lib/queries";
import { listStockAdjustments } from "@/lib/actions/stock";
import { ExportButton } from "@/components/ExportButton";
import { StockMatrix } from "@/components/StockMatrix";
import { StockTabs } from "@/components/StockTabs";
import { StockMovement, type MovRow } from "@/components/StockMovement";
import { StockTrend } from "@/components/StockTrend";
import { StockLoss, type LossRow } from "@/components/StockLoss";
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
  // last 30 days axis (Bangkok time) for the movement heatmap — build from y-m-d to avoid tz drift
  const bkkToday = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const [Y, M, D] = bkkToday.split("-").map(Number);
  const baseUtc = Date.UTC(Y, M - 1, D);
  const moveDates = Array.from({ length: 30 }, (_, i) => new Date(baseUtc - (29 - i) * 86400000).toISOString().slice(0, 10));
  const [bundle, user, adjustments, moves, variance, signals, trend] = await Promise.all([
    stockPageBundle(branch), getCurrentUser(), listStockAdjustments(branch),
    stockMovement(branch, moveDates[0]), countVariance(branch), lossSignals(branch),
    stockTrendTotals(branch, 60),
  ]);
  // one STOCK_CTE pass → derive คงเหลือ / ควรเติม / ติดลบ / มูลค่า (was 4 separate CTE queries)
  const { rows, reorder, negatives, valuation } = bundle;
  // build movement rows keyed by scent+size (aggregate barcodes), merging daily sold + remaining
  const soldByBarcode = new Map<string, Map<string, number>>();
  for (const m of moves) {
    let bc = soldByBarcode.get(m.barcode);
    if (!bc) { bc = new Map(); soldByBarcode.set(m.barcode, bc); }
    bc.set(m.d, (bc.get(m.d) || 0) + (m.q || 0));
  }
  const movMap = new Map<string, MovRow>();
  for (const r of rows) {
    const key = `${r.scent}|${r.size}`;
    let mv = movMap.get(key);
    if (!mv) { mv = { scent: r.scent, size: r.size, remaining: 0, sold: {} }; movMap.set(key, mv); }
    mv.remaining += r.remaining || 0;
    const bc = soldByBarcode.get(r.barcode);
    if (bc) for (const [d, q] of bc) mv.sold[d] = (mv.sold[d] || 0) + q;
  }
  const mlOf = (z?: string) => { const mm = String(z || "").match(/(\d+(?:\.\d+)?)/); return mm ? parseFloat(mm[1]) : 0; };
  const isBag = (n?: string) => /ถุง/.test(String(n || ""));
  const movRows = [...movMap.values()].sort((a, b) =>
    (isBag(a.scent) ? 1 : 0) - (isBag(b.scent) ? 1 : 0)
    || a.scent.localeCompare(b.scent, "th") || mlOf(a.size) - mlOf(b.size));

  // ---- ป้องกันของหาย: เทียบผลนับล่าสุด (คาด vs จริง) + เตือนของที่ยังไม่ได้นับนาน ----
  const daysSince = (iso: string) => Math.floor((baseUtc - Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))) / 86400000);
  type VarAgg = { expected: number; counted: number; value: number; countedAt: string | null };
  const varAgg = new Map<string, VarAgg>();
  for (const v of variance) {
    const key = `${v.scent}|${v.size}`;
    const a = varAgg.get(key) || { expected: 0, counted: 0, value: 0, countedAt: null };
    a.expected += v.expected || 0; a.counted += v.counted || 0;
    a.value += (v.counted - v.expected) * (v.unit_cost || 0);   // ต้นทุนของส่วนที่ขาด/เกิน (ติดลบ=หาย)
    const d = v.counted_at ? v.counted_at.slice(0, 10) : null;
    if (d && (!a.countedAt || d > a.countedAt)) a.countedAt = d;
    varAgg.set(key, a);
  }
  const lossRows: LossRow[] = [];
  const keys = new Set<string>([...varAgg.keys(), ...[...movMap.values()].filter((m) => m.remaining > 0).map((m) => `${m.scent}|${m.size}`)]);
  for (const key of keys) {
    const [scent, size] = key.split("|");
    const remaining = movMap.get(key)?.remaining ?? 0;
    const a = varAgg.get(key);
    if (a) {
      const diff = Math.round(a.counted - a.expected);
      const stale = a.countedAt ? daysSince(a.countedAt) > 14 : false;
      lossRows.push({ scent, size, expected: a.expected, counted: a.counted, diff, value: a.value, remaining, countedAt: a.countedAt, stale, neverCounted: false });
    } else {
      lossRows.push({ scent, size, expected: null, counted: null, diff: null, value: 0, remaining, countedAt: null, stale: false, neverCounted: true });
    }
  }
  // จัดเรียง: ของขาดก่อน (ขาดมากสุดบน) → ยังไม่นับ/ค้างนาน → เกิน → ตรง
  const rank = (r: LossRow) => r.diff != null && r.diff < 0 ? 0 : (r.neverCounted || r.stale) ? 1 : r.diff != null && r.diff > 0 ? 2 : 3;
  lossRows.sort((x, y) => rank(x) - rank(y) || (x.diff ?? 0) - (y.diff ?? 0) || x.scent.localeCompare(y.scent, "th") || mlOf(x.size) - mlOf(y.size));
  const lossSummary = {
    shortN: lossRows.filter((r) => r.diff != null && r.diff < 0).length,
    shortUnits: lossRows.reduce((a, r) => a + (r.diff != null && r.diff < 0 ? -r.diff : 0), 0),
    negativeN: negatives.length,
    notCountedN: lossRows.filter((r) => r.neverCounted || r.stale).length,
  };
  const cashShortN = signals.cash.filter((c) => c.diff < 0).length;
  const lossAlert = lossSummary.shortN > 0 || lossSummary.negativeN > 0 || cashShortN > 0 || signals.bills.length > 0;

  // ---- ชั้น 4: นับตามรอบ (count coverage) — คำนวณจาก movMap (คงเหลือ+ขาย) + varAgg (นับล่าสุด) ----
  const inStock = [...movMap.values()].filter((m) => m.remaining > 0 && !isBag(m.scent));
  const covRows = inStock.map((m) => {
    const a = varAgg.get(`${m.scent}|${m.size}`);
    const countedAt = a?.countedAt ?? null;
    const ds = countedAt ? daysSince(countedAt) : null;
    return { scent: m.scent, size: m.size, remaining: m.remaining, velocity: Object.values(m.sold).reduce((s, q) => s + q, 0), countedAt, daysSince: ds };
  });
  const coverage = {
    total: covRows.length,
    countedRecent: covRows.filter((r) => r.daysSince != null && r.daysSince <= 30).length,
    neverN: covRows.filter((r) => r.countedAt == null).length,
    staleN: covRows.filter((r) => r.daysSince != null && r.daysSince > 14).length,
    // ควรนับก่อน: ยังไม่ครบรอบ (ไม่เคยนับ/ค้าง>14) เรียง ไม่เคยนับ → ค้างนาน → ของเยอะ → ขายเร็ว
    suggest: covRows
      .filter((r) => r.countedAt == null || (r.daysSince != null && r.daysSince > 14))
      .sort((x, y) =>
        (x.countedAt == null ? 0 : 1) - (y.countedAt == null ? 0 : 1)
        || (y.daysSince ?? 9999) - (x.daysSince ?? 9999)
        || y.remaining - x.remaining || y.velocity - x.velocity)
      .slice(0, 40),
  };
  // derive the summary from the rows we already fetched (saves one full STOCK_CTE recompute)
  const s = {
    shipped: rows.reduce((a, r) => a + (r.shipped || 0), 0),
    sold: rows.reduce((a, r) => a + (r.sold || 0), 0),
    remaining: rows.reduce((a, r) => a + (r.remaining || 0), 0),
    skus: rows.length,
    out: rows.filter((r) => r.remaining <= 0).length,
    low: rows.filter((r) => r.remaining > 0 && r.remaining <= 3).length,
  };
  const lowCount = s.low + s.out;
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

      {/* PRIMARY: คงเหลือ (matrix) + การเคลื่อนไหว (heatmap ขายรายวัน) as tabs */}
      <Card title={`คงเหลือแต่ละกลิ่น · ${rows.length} SKU`}>
        <StockTabs
          lossAlert={lossAlert}
          matrix={<StockMatrix rows={rows} branch={branch} canEdit={canRequisition} inactiveScents={inactiveScents} />}
          movement={<><StockTrend data={trend} canManage={canRequisition} /><StockMovement dates={moveDates} rows={movRows} /></>}
          /* ป้องกันของหายมีข้อมูลอ่อนไหว → เฉพาะผู้จัดการ/แอดมิน/ปฏิบัติการ (สิทธิ์ requisitions) */
          loss={canRequisition ? <StockLoss rows={lossRows} summary={lossSummary} branch={branch} signals={signals} coverage={coverage} /> : null}
        />
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
