"use client";
import { useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { baht, num, compactBaht } from "@/lib/format";
import { natLabel } from "@/lib/nation";
import { branchName } from "@/lib/branches";
import { downloadCsv } from "@/lib/csv";
import type { SalesAnalytics as Data, AnalyticsKpis, DeadStockRow } from "@/lib/analytics";

const ymd = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const DOW_TH = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"];

// normalize ขนาด: ดึงเลข ml ออกมาเป็นค่ามาตรฐาน "N ml." (รวม 50 ML./50ml/50 ml. ให้เป็นอันเดียว) · ไม่ใช่ ml → null
const mlSize = (raw?: string | null): string | null => {
  const m = String(raw || "").match(/(\d+(?:\.\d+)?)\s*ml\b/i);
  return m ? `${Number(m[1])} ml.` : null;
};
const SIZE_ORDER = ["50 ml.", "30 ml.", "10 ml.", "4 ml."];
// ไม่ใช่น้ำหอม (ถุงผ้า/กระเป๋า/CYOC/เทสเตอร์/บรรจุภัณฑ์) — กรองออกจากตารางกลิ่น×ขนาด
const NON_PERFUME = /try\s*me|cloth|\bbag\b|cyoc|pouch|ถุง|กระเป๋า|ผ้า/i;
const pct = (n: number) => `${(n * 100).toFixed(n >= 0.1 ? 0 : 1)}%`;
const thDate = (iso: string) => { const [y, m, d] = iso.split("-"); return `${+d}/${+m}`; };

export function SalesAnalytics({ data, prev, prevRange, dead, branch, from, to }:
  { data: Data; prev: AnalyticsKpis; prevRange: { from: string; to: string }; dead: DeadStockRow[]; branch: string | null; from: string; to: string }) {
  const router = useRouter(); const pathname = usePathname(); const sp = useSearchParams();
  const { kpis, scents, sizes, hours, weekdays, staff, daily, payments, nations, staffDaily, scentSize, heatmap } = data;

  // heatmap เวลา×วัน: grid[dow][hour] = revenue
  const heat = useMemo(() => {
    const cell = new Map<string, { revenue: number; bills: number }>();
    let hLo = 23, hHi = 0, max = 0;
    for (const c of heatmap) {
      cell.set(`${c.dow}_${c.hour}`, { revenue: c.revenue, bills: c.bills });
      if (c.revenue > 0) { hLo = Math.min(hLo, c.hour); hHi = Math.max(hHi, c.hour); max = Math.max(max, c.revenue); }
    }
    if (max === 0) return null;
    const hoursAxis: number[] = [];
    for (let h = hLo; h <= hHi; h++) hoursAxis.push(h);
    const rows = [1, 2, 3, 4, 5, 6, 0].map((dow) => ({
      dow, cells: hoursAxis.map((h) => cell.get(`${dow}_${h}`) || { revenue: 0, bills: 0 }),
    }));
    return { hoursAxis, rows, max };
  }, [heatmap]);

  // อัตราเปลี่ยนเทียบช่วงก่อน (null = ช่วงก่อนไม่มียอด เทียบ % ไม่ได้)
  const delta = (cur: number, prv: number): number | null => (prv > 0 ? (cur - prv) / prv : null);

  // เมทริกซ์ กลิ่น × ขนาด (ช่อง = จำนวนชิ้น) · เรียงกลิ่น/ขนาดตาม "ยอดขาย"
  const ssm = useMemo(() => {
    const sizeRev = new Map<string, number>(), scentRev = new Map<string, number>();
    const scentQty = new Map<string, number>(), cell = new Map<string, number>();
    for (const r of scentSize) {
      const size = mlSize(r.size);
      if (!size || NON_PERFUME.test(r.scent)) continue;      // เฉพาะน้ำหอมที่มีขนาด ml เท่านั้น
      sizeRev.set(size, (sizeRev.get(size) || 0) + r.revenue);
      scentRev.set(r.scent, (scentRev.get(r.scent) || 0) + r.revenue);
      scentQty.set(r.scent, (scentQty.get(r.scent) || 0) + r.qty);
      cell.set(`${r.scent}__${size}`, (cell.get(`${r.scent}__${size}`) || 0) + r.qty);
    }
    const sizes = [...sizeRev.keys()].sort((a, b) => {
      const ia = SIZE_ORDER.indexOf(a), ib = SIZE_ORDER.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;               // 50 → 30 → 10 → 4
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return (sizeRev.get(b) || 0) - (sizeRev.get(a) || 0); // ขนาดอื่นที่ไม่รู้จัก เรียงตามยอด
    });
    const scentsTop = [...scentRev.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60).map(([s]) => s);
    const colTot = new Map<string, number>();
    const rows = scentsTop.map((sc) => {
      const vals = sizes.map((sz) => { const v = cell.get(`${sc}__${sz}`) || 0; colTot.set(sz, (colTot.get(sz) || 0) + v); return v; });
      return { scent: sc, vals, total: scentQty.get(sc) || 0, best: Math.max(0, ...vals) };
    });
    return { sizes, rows, colTotals: sizes.map((sz) => colTot.get(sz) || 0), grand: rows.reduce((a, r) => a + r.total, 0) };
  }, [scentSize]);

  // ตารางรายวัน × พนักงาน — แถว = วัน, คอลัมน์ = พนักงาน, ช่อง = ยอดบาท
  const matrix = useMemo(() => {
    const staffNames = staff.map((s) => s.staff);                 // เรียงตามยอดรวม (มาก→น้อย) อยู่แล้ว
    const cell = new Map<string, number>();
    for (const r of staffDaily) cell.set(`${r.d}__${r.staff}`, r.revenue);
    const rows = daily.map((d) => {
      const vals = staffNames.map((n) => cell.get(`${d.d}__${n}`) || 0);
      const best = Math.max(0, ...vals);
      return { d: d.d, vals, total: d.revenue, best };
    });
    const colTotals = staffNames.map((n) => staff.find((s) => s.staff === n)?.revenue || 0);
    return { staffNames, rows, colTotals };
  }, [staff, staffDaily, daily]);

  const go = (params: Record<string, string>) => {
    const p = new URLSearchParams(sp.toString());
    Object.entries(params).forEach(([k, v]) => p.set(k, v));
    router.push(`${pathname}?${p.toString()}`);
  };
  const setRange = (f: string, t: string) => go({ from: f, to: t });

  // พรีเซ็ตช่วงเวลา (คิดเป็นเวลาไทย)
  const presets = useMemo(() => {
    const now = new Date(); const today = ymd(now);
    const d = (x: Date) => ymd(x);
    const startOfMonth = today.slice(0, 8) + "01";
    const lastMonthEnd = new Date(today.slice(0, 8) + "01T00:00:00Z"); lastMonthEnd.setUTCDate(0);
    const lastMonthStart = ymd(lastMonthEnd).slice(0, 8) + "01";
    const ago = (n: number) => { const x = new Date(today + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() - n); return d(x); };
    return [
      { k: "เดือนนี้", f: startOfMonth, t: today },
      { k: "เดือนก่อน", f: lastMonthStart, t: ymd(lastMonthEnd) },
      { k: "7 วัน", f: ago(6), t: today },
      { k: "30 วัน", f: ago(29), t: today },
      { k: "ปีนี้", f: today.slice(0, 4) + "-01-01", t: today },
      { k: "ปีที่แล้ว", f: `${+today.slice(0, 4) - 1}-01-01`, t: `${+today.slice(0, 4) - 1}-12-31` },
      { k: "ทั้งหมด", f: "2000-01-01", t: today },
    ];
  }, []);
  const activePreset = presets.find((p) => p.f === from && p.t === to)?.k;

  const exportCsv = () => {
    const R: (string | number)[][] = [];
    R.push(["วิเคราะห์การขาย"]);
    R.push(["ช่วงวันที่", from, "ถึง", to]);
    R.push(["สาขา", branch ? branchName(branch) : "ทุกสาขา"]);
    R.push([]);
    R.push(["สรุป"]);
    R.push(["ยอดขายรวม", Math.round(kpis.revenue)]);
    R.push(["จำนวนบิล", kpis.bills]);
    R.push(["จำนวนชิ้น", Math.round(kpis.qty)]);
    R.push(["เฉลี่ย/บิล", Math.round(kpis.aov)]);
    R.push(["เฉลี่ย/ชิ้น", Math.round(kpis.per_item)]);
    R.push(["ชิ้น/บิล", kpis.items_per_bill.toFixed(2)]);
    R.push(["ส่วนลดรวม", Math.round(kpis.discount)]);
    R.push(["เฉลี่ย/วัน", Math.round(kpis.per_day)]);
    const sec = (title: string, head: string[], rows: (string | number)[][]) => {
      R.push([]); R.push([title]); R.push(head); rows.forEach((x) => R.push(x));
    };
    sec("กลิ่นขายดี", ["กลิ่น", "ชิ้น", "ยอด(บาท)", "บิล"], scents.map((s) => [s.scent, Math.round(s.qty), Math.round(s.revenue), s.bills]));
    sec("ตามขนาด", ["ขนาด", "ชิ้น", "ยอด(บาท)", "บิล"], sizes.map((s) => [s.size, Math.round(s.qty), Math.round(s.revenue), s.bills]));
    sec("ตามเวลา (ชม.)", ["ชั่วโมง", "ยอด(บาท)", "บิล", "ชิ้น"], hours.map((h) => [`${h.hour}:00`, Math.round(h.revenue), h.bills, Math.round(h.qty)]));
    sec("ตามวัน", ["วัน", "ยอด(บาท)", "บิล", "ชิ้น"], weekdays.map((w) => [DOW_TH[w.dow] || w.dow, Math.round(w.revenue), w.bills, Math.round(w.qty)]));
    sec("ตามพนักงาน", ["พนักงาน", "ยอด(บาท)", "บิล", "ชิ้น", "เฉลี่ย/บิล"], staff.map((s) => [s.staff, Math.round(s.revenue), s.bills, Math.round(s.qty), Math.round(s.aov)]));
    sec("ช่องทางชำระ", ["ช่องทาง", "ยอด(บาท)", "รายการ"], payments.map((p) => [p.channel, Math.round(p.revenue), p.n]));
    sec("สัญชาติ", ["สัญชาติ", "ยอด(บาท)", "บิล"], nations.map((n) => [natLabel(n.nation), Math.round(n.revenue), n.bills]));
    sec("รายวัน", ["วันที่", "ยอด(บาท)", "บิล", "ชิ้น"], daily.map((d) => [d.d, Math.round(d.revenue), d.bills, Math.round(d.qty)]));
    sec("รายวัน × พนักงาน (บาท)", ["วันที่", ...matrix.staffNames, "รวม/วัน"],
      matrix.rows.map((r) => [r.d, ...r.vals.map((v) => Math.round(v)), Math.round(r.total)]));
    sec("กลิ่น × ขนาด (ชิ้น)", ["กลิ่น", ...ssm.sizes, "รวม"],
      ssm.rows.map((r) => [r.scent, ...r.vals.map((v) => Math.round(v)), Math.round(r.total)]));
    if (heat) sec("ช่วงเวลาขายดี วัน×ชม. (บาท)", ["วัน", ...heat.hoursAxis.map((h) => `${h}:00`)],
      heat.rows.map((r) => [DOW_TH[r.dow], ...r.cells.map((c) => Math.round(c.revenue))]));
    sec("สินค้าขายช้า/ไม่ขยับ", ["กลิ่น", "ขนาด", "คงเหลือ", "ขายในช่วง", "ไม่ขายมา(วัน)", "บาร์โค้ด"],
      dead.map((r) => [r.scent, r.size, r.remaining, r.soldPeriod, r.daysIdle ?? "ยังไม่เคยขาย", r.barcode]));
    downloadCsv(`วิเคราะห์การขาย_${branch || "all"}_${from}_${to}.csv`, R);
  };

  const empty = kpis.bills === 0;

  return (
    <div className="space-y-5">
      {/* ── controls ── */}
      <div className="rounded-xl border border-line bg-surface p-3 flex flex-wrap items-end gap-2">
        <label className="text-sm"><span className="block text-[11px] text-muted mb-0.5">ตั้งแต่</span>
          <input type="date" value={from} max={to} onChange={(e) => setRange(e.target.value, to)}
            className="px-2.5 py-1.5 rounded-lg border border-line bg-surface text-ink text-sm focus:outline-none focus:border-brand" /></label>
        <label className="text-sm"><span className="block text-[11px] text-muted mb-0.5">ถึง</span>
          <input type="date" value={to} min={from} max={ymd(new Date())} onChange={(e) => setRange(from, e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-line bg-surface text-ink text-sm focus:outline-none focus:border-brand" /></label>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button key={p.k} onClick={() => setRange(p.f, p.t)}
              className={`px-2.5 py-1.5 rounded-lg text-[12.5px] border transition-colors ${activePreset === p.k ? "bg-brand text-white border-brand" : "bg-surface text-ink border-line hover:bg-canvas"}`}>{p.k}</button>
          ))}
        </div>
        <button onClick={exportCsv} disabled={empty}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface text-ink text-sm font-medium px-3 py-2 hover:bg-canvas disabled:opacity-50">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {empty ? (
        <div className="rounded-xl border border-line bg-surface p-12 text-center text-sm text-muted">
          ไม่มียอดขายในช่วง {thDate(from)} – {thDate(to)}{branch ? ` · ${branchName(branch)}` : ""}
        </div>
      ) : (
        <>
          {/* ── KPIs ── */}
          <div>
            <div className="text-[11px] text-muted mb-1.5">▲▼ เทียบช่วงก่อนหน้า ({thDate(prevRange.from)}–{thDate(prevRange.to)})</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Kpi label="ยอดขายรวม" value={baht(kpis.revenue)} delta={delta(kpis.revenue, prev.revenue)} primary />
              <Kpi label="จำนวนบิล" value={num(kpis.bills)} delta={delta(kpis.bills, prev.bills)} />
              <Kpi label="จำนวนชิ้น" value={num(kpis.qty)} delta={delta(kpis.qty, prev.qty)} />
              <Kpi label="เฉลี่ย/บิล" value={baht(kpis.aov)} delta={delta(kpis.aov, prev.aov)} />
              <Kpi label="เฉลี่ย/ชิ้น" value={baht(kpis.per_item)} delta={delta(kpis.per_item, prev.per_item)} />
              <Kpi label="ชิ้น/บิล" value={kpis.items_per_bill.toFixed(2)} delta={delta(kpis.items_per_bill, prev.items_per_bill)} />
              <Kpi label={`ส่วนลดรวม (${pct(kpis.discount_rate)})`} value={baht(kpis.discount)} />
              <Kpi label={`เฉลี่ย/วัน (${num(kpis.days)} วัน)`} value={baht(kpis.per_day)} delta={delta(kpis.per_day, prev.per_day)} />
            </div>
          </div>

          {/* ── daily trend ── */}
          <Panel title="แนวโน้มยอดขายรายวัน">
            <ColChart items={daily.map((d) => ({ label: thDate(d.d), value: d.revenue, sub: `${num(d.bills)} บิล` }))} unit="baht" />
          </Panel>

          {/* ── scents + sizes ── */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={`กลิ่นขายดี · ${scents.length} กลิ่น`} sub="เรียงตามยอดขาย">
              <BarList rows={scents.map((s) => ({ label: s.scent, value: s.revenue, sub: `${num(s.qty)} ชิ้น · ${num(s.bills)} บิล` }))} total={kpis.revenue} />
            </Panel>
            <Panel title="ยอดขายตามขนาด" sub="สัดส่วนของแต่ละไซซ์">
              <BarList rows={sizes.map((s) => ({ label: s.size, value: s.revenue, sub: `${num(s.qty)} ชิ้น` }))} total={kpis.revenue} showPct />
            </Panel>
          </div>

          {/* ── scent × size matrix ── */}
          {ssm.sizes.length > 0 && ssm.rows.length > 0 && (
            <Panel title={`กลิ่น × ขนาด · ${ssm.rows.length} กลิ่น`} sub="จำนวนชิ้นที่ขาย · ตัวหนา = ขนาดที่ขายดีสุดของกลิ่นนั้น">
              <div className="overflow-x-auto rounded-lg border border-line-soft">
                <table className="w-full text-[13px] border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-canvas text-[11px] uppercase tracking-wide text-muted">
                      <th className="sticky left-0 bg-canvas text-left font-semibold px-3 py-2 border-b border-line">กลิ่น</th>
                      {ssm.sizes.map((s) => <th key={s} className="text-right font-semibold px-3 py-2 border-b border-line whitespace-nowrap">{s}</th>)}
                      <th className="text-right font-semibold px-3 py-2 border-b border-line bg-canvas">รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ssm.rows.map((r) => (
                      <tr key={r.scent} className="border-b border-line-soft hover:bg-canvas/60">
                        <td className="sticky left-0 bg-surface px-3 py-1.5 text-ink max-w-[180px] truncate" title={r.scent}>{r.scent}</td>
                        {r.vals.map((v, i) => (
                          <td key={i} className={`text-right px-3 py-1.5 tabular-nums ${v === 0 ? "text-line" : v === r.best ? "font-bold text-ink" : "text-muted"}`}>
                            {v === 0 ? "–" : num(v)}
                          </td>
                        ))}
                        <td className="text-right px-3 py-1.5 tabular-nums font-semibold text-ink bg-canvas/40">{num(r.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-canvas font-semibold text-ink border-t-2 border-line">
                      <td className="sticky left-0 bg-canvas px-3 py-2">รวม</td>
                      {ssm.colTotals.map((v, i) => <td key={i} className="text-right px-3 py-2 tabular-nums">{num(v)}</td>)}
                      <td className="text-right px-3 py-2 tabular-nums">{num(ssm.grand)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Panel>
          )}

          {/* ── hour + weekday ── */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title="เวลาไหนขายดี" sub="ยอดขายตามชั่วโมง">
              <ColChart items={fillHours(hours).map((h) => ({ label: `${h.hour}`, value: h.revenue, sub: `${num(h.bills)} บิล` }))} unit="baht" />
            </Panel>
            <Panel title="วันไหนขายดี" sub="ยอดขายตามวันในสัปดาห์">
              <ColChart items={fillWeekdays(weekdays).map((w) => ({ label: DOW_TH[w.dow].slice(0, 2), value: w.revenue, sub: `${num(w.bills)} บิล` }))} unit="baht" />
            </Panel>
          </div>

          {/* ── heatmap hour × weekday ── */}
          {heat && (
            <Panel title="ช่วงเวลาที่ขายดี (วัน × ชั่วโมง)" sub="เข้ม= ยอดขายสูง · ไว้จัดกะพนักงาน / โปรช่วงเงียบ">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse" style={{ minWidth: heat.hoursAxis.length * 34 + 44 }}>
                  <thead>
                    <tr>
                      <th className="w-11 sticky left-0 bg-surface" />
                      {heat.hoursAxis.map((h) => <th key={h} className="text-[11px] text-muted font-medium pb-1.5 text-center tabular-nums">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {heat.rows.map((r) => (
                      <tr key={r.dow}>
                        <td className="w-11 sticky left-0 bg-surface pr-2 text-[12px] text-muted font-medium whitespace-nowrap">{DOW_TH[r.dow].slice(0, 2)}</td>
                        {r.cells.map((c, i) => {
                          const t = heat.max ? c.revenue / heat.max : 0;
                          return (
                            <td key={i} className="p-0.5">
                              <div className="h-11 rounded-md flex items-center justify-center text-[10px] tabular-nums transition-colors"
                                style={{ backgroundColor: c.revenue > 0 ? `rgb(var(--brand) / ${0.1 + t * 0.9})` : "rgb(var(--canvas))", color: t > 0.5 ? "white" : "rgb(var(--muted))" }}
                                title={`${DOW_TH[r.dow]} ${heat.hoursAxis[i]}:00 · ${baht(c.revenue)} · ${num(c.bills)} บิล`}>
                                {c.revenue > 0 ? compactBaht(c.revenue) : ""}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-[10.5px] text-muted mt-2">ตัวเลข = ยอดขาย (ย่อ) · เลขบนสุด = ชั่วโมง (24 ชม.) · เลื่อนแนวนอนได้บนจอเล็ก</div>
            </Panel>
          )}

          {/* ── staff ── */}
          <Panel title="ยอดขายตามพนักงาน" sub="ใครขายได้เท่าไหร่ · เฉลี่ยต่อบิล">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wide text-muted border-b border-line">
                  <th className="pb-2 font-semibold">พนักงาน</th>
                  <th className="pb-2 font-semibold">สัดส่วน</th>
                  <th className="pb-2 w-20 text-right font-semibold">บิล</th>
                  <th className="pb-2 w-20 text-right font-semibold">ชิ้น</th>
                  <th className="pb-2 w-24 text-right font-semibold">เฉลี่ย/บิล</th>
                  <th className="pb-2 w-28 text-right font-semibold">ยอด (฿)</th>
                </tr></thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.staff} className="border-b border-line-soft">
                      <td className="py-2 font-medium text-ink">{s.staff}</td>
                      <td className="py-2 pr-3"><div className="h-2 rounded-full bg-canvas overflow-hidden min-w-[60px]">
                        <div className="h-full bg-brand rounded-full" style={{ width: `${kpis.revenue ? (s.revenue / staff[0].revenue) * 100 : 0}%` }} /></div></td>
                      <td className="py-2 text-right tabular-nums text-muted">{num(s.bills)}</td>
                      <td className="py-2 text-right tabular-nums text-muted">{num(s.qty)}</td>
                      <td className="py-2 text-right tabular-nums text-muted">{baht(s.aov)}</td>
                      <td className="py-2 text-right tabular-nums font-semibold text-ink">{num(s.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* ── daily × staff matrix ── */}
          {matrix.staffNames.length > 0 && (
            <Panel title="ยอดขายรายวัน × พนักงาน" sub="แต่ละวันใครขายได้เท่าไหร่ (บาท) · ตัวหนา = คนขายดีสุดของวัน">
              <div className="overflow-auto max-h-[460px] rounded-lg border border-line-soft">
                <table className="w-full text-[13px] border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-canvas text-[11px] uppercase tracking-wide text-muted">
                      <th className="sticky left-0 bg-canvas text-left font-semibold px-3 py-2 border-b border-line">วันที่</th>
                      {matrix.staffNames.map((n) => (
                        <th key={n} className="text-right font-semibold px-3 py-2 border-b border-line whitespace-nowrap max-w-[120px] truncate" title={n}>{n}</th>
                      ))}
                      <th className="text-right font-semibold px-3 py-2 border-b border-line bg-canvas">รวม/วัน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.rows.map((r) => (
                      <tr key={r.d} className="border-b border-line-soft hover:bg-canvas/60">
                        <td className="sticky left-0 bg-surface px-3 py-1.5 whitespace-nowrap text-ink tabular-nums">{thDate(r.d)}</td>
                        {r.vals.map((v, i) => (
                          <td key={i} className={`text-right px-3 py-1.5 tabular-nums ${v === 0 ? "text-line" : v === r.best ? "font-bold text-ink" : "text-muted"}`}>
                            {v === 0 ? "–" : num(v)}
                          </td>
                        ))}
                        <td className="text-right px-3 py-1.5 tabular-nums font-semibold text-ink bg-canvas/40">{num(r.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="sticky bottom-0">
                    <tr className="bg-canvas font-semibold text-ink border-t-2 border-line">
                      <td className="sticky left-0 bg-canvas px-3 py-2">รวม</td>
                      {matrix.colTotals.map((v, i) => <td key={i} className="text-right px-3 py-2 tabular-nums">{num(v)}</td>)}
                      <td className="text-right px-3 py-2 tabular-nums">{num(kpis.revenue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Panel>
          )}

          {/* ── payment + nation ── */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title="ช่องทางชำระเงิน">
              <BarList rows={payments.map((p) => ({ label: p.channel, value: p.revenue, sub: `${num(p.n)} รายการ` }))} total={kpis.revenue} showPct />
            </Panel>
            <Panel title="สัญชาติลูกค้า" sub="รวมคำที่สะกดต่างกันแล้ว">
              <BarList rows={nations.map((n) => ({ label: natLabel(n.nation), value: n.revenue, sub: `${num(n.bills)} บิล` }))} total={kpis.revenue} showPct />
            </Panel>
          </div>

          {/* ── dead / slow stock ── */}
          {dead.length > 0 && (
            <Panel title="สินค้าขายช้า / ไม่ขยับ" sub={`ของค้างสต๊อก${branch ? ` · ${branchName(branch)}` : " · ทุกสาขา"} · ขายน้อย/ไม่ขายนานสุดก่อน`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-[11px] uppercase tracking-wide text-muted border-b border-line">
                    <th className="pb-2 font-semibold">กลิ่น</th>
                    <th className="pb-2 w-16 font-semibold">ขนาด</th>
                    <th className="pb-2 w-24 text-right font-semibold">คงเหลือ</th>
                    <th className="pb-2 w-28 text-right font-semibold">ขายในช่วง</th>
                    <th className="pb-2 w-32 text-right font-semibold">ไม่ขายมา</th>
                  </tr></thead>
                  <tbody>
                    {dead.map((r) => (
                      <tr key={r.barcode} className="border-b border-line-soft">
                        <td className="py-2 text-ink max-w-[220px] truncate" title={r.scent}>{r.scent}</td>
                        <td className="py-2 text-muted">{r.size}</td>
                        <td className="py-2 text-right tabular-nums font-semibold text-ink">{num(r.remaining)}</td>
                        <td className={`py-2 text-right tabular-nums ${r.soldPeriod === 0 ? "text-danger font-semibold" : "text-muted"}`}>{r.soldPeriod === 0 ? "ไม่ขายเลย" : num(r.soldPeriod)}</td>
                        <td className="py-2 text-right tabular-nums text-muted">{r.daysIdle === null ? "ยังไม่เคยขาย" : `${num(r.daysIdle)} วัน`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-[10.5px] text-muted mt-2">แสดงสูงสุด 40 รายการ · “ขายในช่วง” นับตามช่วงวันที่ที่เลือก · “ไม่ขายมา” นับจากวันขายล่าสุดถึงวันนี้</div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}

// เติมชั่วโมงที่ขาดช่วง min→max ให้กราฟต่อเนื่อง (เห็นชั่วโมงที่เงียบ)
function fillHours(hours: Data["hours"]): Data["hours"] {
  if (!hours.length) return [];
  const map = new Map(hours.map((h) => [h.hour, h]));
  const lo = Math.min(...hours.map((h) => h.hour)), hi = Math.max(...hours.map((h) => h.hour));
  const out: Data["hours"] = [];
  for (let h = lo; h <= hi; h++) out.push(map.get(h) ?? { hour: h, revenue: 0, qty: 0, bills: 0 });
  return out;
}
// วันครบ 7 วัน จันทร์→อาทิตย์ (dow 1..6,0)
function fillWeekdays(weekdays: Data["weekdays"]): Data["weekdays"] {
  const map = new Map(weekdays.map((w) => [w.dow, w]));
  return [1, 2, 3, 4, 5, 6, 0].map((dow) => map.get(dow) ?? { dow, revenue: 0, qty: 0, bills: 0 });
}

function Kpi({ label, value, primary = false, delta }: { label: string; value: string; primary?: boolean; delta?: number | null }) {
  return (
    <div className={`rounded-xl border p-3 ${primary ? "border-brand/40 bg-brand-soft/15" : "border-line bg-surface"}`}>
      <div className="text-[11px] text-muted leading-tight truncate">{label}</div>
      <div className="flex items-baseline justify-between gap-1.5 mt-0.5">
        <div className={`font-bold tabular-nums ${primary ? "text-2xl text-ink" : "text-xl text-ink"}`}>{value}</div>
        {delta !== undefined && <DeltaChip d={delta} />}
      </div>
    </div>
  );
}

function DeltaChip({ d }: { d: number | null }) {
  if (d === null) return <span className="text-[10px] text-muted whitespace-nowrap">ใหม่</span>;
  if (Math.abs(d) < 0.005) return <span className="text-[10.5px] text-muted whitespace-nowrap tabular-nums">0%</span>;
  const up = d > 0;
  return (
    <span className={`text-[10.5px] font-semibold whitespace-nowrap tabular-nums ${up ? "text-success" : "text-danger"}`}>
      {up ? "▲" : "▼"} {Math.abs(d * 100).toFixed(0)}%
    </span>
  );
}

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {sub && <span className="text-[11px] text-muted">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

// แถวแนวนอน (label + แถบ + ยอด) — ใช้กับกลิ่น/ขนาด/ช่องทาง/สัญชาติ
function BarList({ rows, total, showPct = false }: { rows: { label: string; value: number; sub?: string }[]; total: number; showPct?: boolean }) {
  if (!rows.length) return <div className="text-sm text-muted py-6 text-center">ไม่มีข้อมูล</div>;
  const max = Math.max(...rows.map((r) => r.value)) || 1;
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.label + i} className="flex items-center gap-3">
          <div className="w-28 sm:w-40 shrink-0 min-w-0">
            <div className="text-[13px] text-ink truncate" title={r.label}>{r.label}</div>
            {r.sub && <div className="text-[10.5px] text-muted truncate">{r.sub}</div>}
          </div>
          <div className="flex-1 h-5 rounded-md bg-canvas overflow-hidden">
            <div className="h-full rounded-md bg-gradient-to-r from-brand/60 to-brand transition-[width] duration-500" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
          </div>
          <div className="w-24 text-right shrink-0">
            <div className="text-[13px] font-semibold tabular-nums text-ink">{num(r.value)}</div>
            {showPct && total > 0 && <div className="text-[10.5px] text-muted tabular-nums">{pct(r.value / total)}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// คอลัมน์แนวตั้ง — ใช้กับรายวัน/ชั่วโมง/วันในสัปดาห์
function ColChart({ items, unit }: { items: { label: string; value: number; sub?: string }[]; unit?: "baht" }) {
  if (!items.length) return <div className="text-sm text-muted py-6 text-center">ไม่มีข้อมูล</div>;
  const max = Math.max(...items.map((i) => i.value)) || 1;
  const peak = items.reduce((a, b) => (b.value > a.value ? b : a), items[0]);
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1.5 h-40 min-w-full border-b border-line-soft" style={{ minWidth: items.length * 22 }}>
        {items.map((it, i) => {
          const h = Math.max(2, (it.value / max) * 100);
          const isPeak = it.value === peak.value && it.value > 0;
          return (
            <div key={it.label + i} className="flex-1 flex flex-col items-center justify-end h-full group min-w-[14px]">
              <div className="text-[9px] text-ink font-medium tabular-nums mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{unit === "baht" ? compactBaht(it.value) : num(it.value)}</div>
              <div className={`w-full rounded-t-md transition-all duration-500 ${isPeak ? "bg-gradient-to-t from-brand to-brand-dark shadow-sm" : "bg-gradient-to-t from-brand/25 to-brand/55 group-hover:from-brand/40 group-hover:to-brand/70"}`}
                style={{ height: `${h}%` }}
                title={`${it.label} · ${unit === "baht" ? baht(it.value) : num(it.value)}${it.sub ? ` · ${it.sub}` : ""}`} />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1" style={{ minWidth: items.length * 22 }}>
        {items.map((it, i) => (
          <div key={it.label + i} className="flex-1 text-center text-[9.5px] text-muted truncate min-w-[14px]">{it.label}</div>
        ))}
      </div>
    </div>
  );
}
