"use client";
import { useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { baht, num, compactBaht } from "@/lib/format";
import { natLabel } from "@/lib/nation";
import { branchName } from "@/lib/branches";
import { downloadCsv } from "@/lib/csv";
import type { SalesAnalytics as Data } from "@/lib/analytics";

const ymd = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const DOW_TH = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"];
const pct = (n: number) => `${(n * 100).toFixed(n >= 0.1 ? 0 : 1)}%`;
const thDate = (iso: string) => { const [y, m, d] = iso.split("-"); return `${+d}/${+m}`; };

export function SalesAnalytics({ data, branch, from, to }: { data: Data; branch: string | null; from: string; to: string }) {
  const router = useRouter(); const pathname = usePathname(); const sp = useSearchParams();
  const { kpis, scents, sizes, hours, weekdays, staff, daily, payments, nations, staffDaily } = data;

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Kpi label="ยอดขายรวม" value={baht(kpis.revenue)} primary />
            <Kpi label="จำนวนบิล" value={num(kpis.bills)} />
            <Kpi label="จำนวนชิ้น" value={num(kpis.qty)} />
            <Kpi label="เฉลี่ย/บิล" value={baht(kpis.aov)} />
            <Kpi label="เฉลี่ย/ชิ้น" value={baht(kpis.per_item)} />
            <Kpi label="ชิ้น/บิล" value={kpis.items_per_bill.toFixed(2)} />
            <Kpi label={`ส่วนลดรวม (${pct(kpis.discount_rate)})`} value={baht(kpis.discount)} />
            <Kpi label={`เฉลี่ย/วัน (${num(kpis.days)} วัน)`} value={baht(kpis.per_day)} />
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

          {/* ── hour + weekday ── */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title="เวลาไหนขายดี" sub="ยอดขายตามชั่วโมง">
              <ColChart items={fillHours(hours).map((h) => ({ label: `${h.hour}`, value: h.revenue, sub: `${num(h.bills)} บิล` }))} unit="baht" />
            </Panel>
            <Panel title="วันไหนขายดี" sub="ยอดขายตามวันในสัปดาห์">
              <ColChart items={fillWeekdays(weekdays).map((w) => ({ label: DOW_TH[w.dow].slice(0, 2), value: w.revenue, sub: `${num(w.bills)} บิล` }))} unit="baht" />
            </Panel>
          </div>

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

function Kpi({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${primary ? "border-brand/40 bg-brand-soft/15" : "border-line bg-surface"}`}>
      <div className="text-[11px] text-muted leading-tight">{label}</div>
      <div className={`font-bold tabular-nums mt-0.5 ${primary ? "text-2xl text-ink" : "text-xl text-ink"}`}>{value}</div>
    </div>
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
            <div className="h-full bg-brand/85 rounded-md" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
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
      <div className="flex items-end gap-1.5 h-40 min-w-full" style={{ minWidth: items.length * 22 }}>
        {items.map((it, i) => {
          const h = Math.max(2, (it.value / max) * 100);
          const isPeak = it.value === peak.value && it.value > 0;
          return (
            <div key={it.label + i} className="flex-1 flex flex-col items-center justify-end h-full group min-w-[14px]">
              <div className="text-[9px] text-muted tabular-nums mb-0.5 opacity-0 group-hover:opacity-100 whitespace-nowrap">{unit === "baht" ? compactBaht(it.value) : num(it.value)}</div>
              <div className={`w-full rounded-t ${isPeak ? "bg-brand" : "bg-brand/40"}`} style={{ height: `${h}%` }}
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
