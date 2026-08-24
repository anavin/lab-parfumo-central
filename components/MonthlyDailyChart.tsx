"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from "recharts";
import { getMonthlyDaily } from "@/lib/actions/report";
import { BRANCHES } from "@/lib/branches";
import { Select } from "@/components/ui/Select";

const BRAND = "#a17c48";      // gold — revenue
const HILITE = "#6f5327";     // darker gold — today
const GRID = "#eef0f3";
const axisTick = { fontSize: 11, fill: "#98a1b0" };

const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const nf = (n: number) => Math.round(n || 0).toLocaleString("en-US");
const bahtK = (v: number) =>
  Math.abs(v) >= 1e6 ? "฿" + (v / 1e6).toFixed(1) + "M" : Math.abs(v) >= 1e3 ? "฿" + (v / 1e3).toFixed(0) + "K" : "฿" + Math.round(v);
const monthLabel = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("th-TH", { month: "long", year: "numeric" });
};

type Day = { label: string; value: number; orders: number; qty: number };

// compact number for on-bar labels: 26000→"26K", 5520→"5.5K", 450→"450"
const barNum = (v: number) => (v >= 1000 ? (v >= 10000 ? Math.round(v / 1000) + "K" : (v / 1000).toFixed(1) + "K") : String(Math.round(v)));
function BarValueLabel({ x, y, width, value }: any) {
  if (!value) return <g />;   // skip zero-sale days
  return <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={9} fontWeight={700} fill="#7a5c30">{barNum(value)}</text>;
}

function DayTip({ active, payload, month }: any) {
  if (!active || !payload?.length) return null;
  const d: Day = payload[0].payload;
  const [y, m] = month.split("-").map(Number);
  const dateLabel = new Date(y, m - 1, Number(d.label)).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "short" });
  const aov = d.orders ? d.value / d.orders : 0;
  const Row = ({ k, v }: { k: string; v: string }) => (
    <div className="flex items-center justify-between gap-6"><span className="text-muted">{k}</span><span className="font-semibold text-ink tabular-nums">{v}</span></div>
  );
  return (
    <div className="rounded-lg border border-line bg-surface shadow-pop px-3 py-2 text-xs min-w-[160px]">
      <div className="font-semibold text-ink mb-1.5">{dateLabel}</div>
      <div className="space-y-0.5">
        <Row k="ยอดขาย" v={`฿${nf(d.value)}`} />
        <Row k="จำนวนบิล" v={`${d.orders} บิล`} />
        <Row k="จำนวนชิ้น" v={`${Math.round(d.qty)} ชิ้น`} />
        <Row k="เฉลี่ย/บิล" v={`฿${nf(aov)}`} />
      </div>
    </div>
  );
}

/** Review-page overview: each day's sales for the selected month, as a column chart.
 *  Clicking a bar calls onPickDay(isoDate) so a linked report can show that day. */
export function MonthlyDailyChart({ defaultSource = "CTW", revision, onPickDay, selected }: {
  defaultSource?: string; revision?: string | number; onPickDay?: (iso: string) => void; selected?: string;
}) {
  const thisMonth = bkkToday().slice(0, 7);
  const [month, setMonth] = useState(thisMonth);
  const ALL = "__all";
  const [branch, setBranch] = useState<string>(defaultSource);   // own branch control (incl. ทุกสาขา)
  const [rows, setRows] = useState<{ d: string; total: number; orders: number; qty: number }[]>([]);
  const [pending, start] = useTransition();

  useEffect(() => {
    start(async () => { try { setRows(await getMonthlyDaily(month, branch === ALL ? null : branch)); } catch { setRows([]); } });
  }, [month, branch, revision]);

  const shiftMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const { data, monthTotal, avg, best, sellingDays, totalOrders, totalQty } = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    const byDate = new Map(rows.map((r) => [r.d, r]));
    const data: Day[] = Array.from({ length: days }, (_, i) => {
      const r = byDate.get(`${month}-${String(i + 1).padStart(2, "0")}`);
      return { label: String(i + 1), value: r?.total ?? 0, orders: r?.orders ?? 0, qty: r?.qty ?? 0 };
    });
    const monthTotal = data.reduce((s, d) => s + d.value, 0);
    const selling = data.filter((d) => d.value > 0);
    const best = data.reduce((a, b) => (b.value > a.value ? b : a), data[0] ?? { label: "-", value: 0, orders: 0, qty: 0 });
    return {
      data, monthTotal, avg: selling.length ? monthTotal / selling.length : 0, best, sellingDays: selling.length,
      totalOrders: data.reduce((s, d) => s + d.orders, 0), totalQty: data.reduce((s, d) => s + d.qty, 0),
    };
  }, [rows, month]);

  const todayDay = month === thisMonth ? String(Number(bkkToday().slice(8, 10))) : undefined;
  const selDay = selected && selected.slice(0, 7) === month ? String(Number(selected.slice(8, 10))) : undefined;
  const emphasis = selDay ?? todayDay;   // the highlighted bar: selected day, else today
  const hasData = monthTotal > 0;

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="min-w-0">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="text-lg font-bold text-ink tabular-nums leading-tight truncate">{value}</div>
    </div>
  );

  return (
    <div className="card p-4 sm:p-5 no-print">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand-dark flex items-center justify-center shrink-0"><BarChart3 className="w-5 h-5" /></div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-ink leading-tight">
              ยอดขายรายวัน
              <span className="ml-2 align-middle chip-brand">{branch === ALL ? "ทุกสาขา" : (BRANCHES.find((b) => b.code === branch)?.name ?? branch)}</span>
            </h3>
            <p className="text-xs text-muted truncate">คลิกแท่งเพื่อเปิดรายงานของวันนั้น</p>
          </div>
        </div>
        {/* branch selector — ทุกสาขา or one branch (independent of the review queue) */}
        <div className="ml-auto w-[150px]">
          <Select value={branch} onValueChange={setBranch}
            options={[{ value: ALL, label: "ทุกสาขา" }, ...BRANCHES.filter((b) => b.active).map((b) => ({ value: b.code, label: b.name }))]} />
        </div>
        {/* month navigator */}
        <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
          <button onClick={() => shiftMonth(-1)} aria-label="เดือนก่อนหน้า"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-canvas transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <span className="min-w-[120px] text-center text-sm font-semibold text-ink tabular-nums select-none">{monthLabel(month)}</span>
          <button onClick={() => shiftMonth(1)} disabled={month >= thisMonth} aria-label="เดือนถัดไป"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-canvas disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 border-y border-line-soft py-3">
        <Stat label="ยอดรวมเดือนนี้" value={`฿${nf(monthTotal)}`} />
        <Stat label="จำนวนบิล" value={`${totalOrders} บิล`} />
        <Stat label="จำนวนชิ้น" value={`${Math.round(totalQty)} ชิ้น`} />
        <Stat label="วันขายดีสุด" value={best.value > 0 ? `฿${nf(best.value)} · วันที่ ${best.label}` : "-"} />
      </div>

      <div style={{ height: 260 }}>
        {pending && !rows.length ? (
          <div className="h-full flex items-center justify-center text-sm text-muted">กำลังโหลด…</div>
        ) : !hasData ? (
          <div className="h-full flex items-center justify-center text-sm text-muted">ยังไม่มียอดขายในเดือนนี้</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval={0} />
              <YAxis tickFormatter={bahtK} tick={axisTick} tickLine={false} axisLine={false} width={44} />
              <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} content={<DayTip month={month} />} />
              {avg > 0 && (
                <ReferenceLine y={avg} stroke="#98a1b0" strokeDasharray="5 4"
                  label={{ value: `เฉลี่ย ฿${nf(avg)}`, position: "insideTopRight", fontSize: 10, fill: "#98a1b0" }} />
              )}
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={26} cursor="pointer" label={BarValueLabel}
                onClick={(bar: any) => onPickDay?.(`${month}-${String(bar.label).padStart(2, "0")}`)}>
                {data.map((d, i) => <Cell key={i} fill={emphasis && d.label === emphasis ? HILITE : BRAND} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      {hasData && (
        <p className="text-[11px] text-muted mt-2">
          มียอดขาย {sellingDays} วันในเดือนนี้ · เส้นประ = ค่าเฉลี่ยต่อวันที่ขาย · แท่งสีเข้ม = {selDay ? "วันที่เลือก" : "วันนี้"}
        </p>
      )}
    </div>
  );
}
