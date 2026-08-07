"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { BarChart3 } from "lucide-react";
import { getMonthlyDaily } from "@/lib/actions/report";
import { Columns } from "@/components/charts";

const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const nf = (n: number) => Math.round(n || 0).toLocaleString("en-US");
const monthLabel = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("th-TH", { month: "long", year: "numeric" });
};

/** Review-page overview: each day's sales for the selected month, as a column chart. */
export function MonthlyDailyChart({ defaultSource = "CTW", revision }: { defaultSource?: string; revision?: string | number }) {
  const [month, setMonth] = useState(bkkToday().slice(0, 7));   // 'YYYY-MM'
  const [rows, setRows] = useState<{ d: string; total: number; orders: number }[]>([]);
  const [pending, start] = useTransition();

  useEffect(() => {
    start(async () => { try { setRows(await getMonthlyDaily(month, defaultSource)); } catch { setRows([]); } });
  }, [month, defaultSource, revision]);

  // fill every day of the month (0 for days with no sales) so the axis is continuous
  const { data, monthTotal, avg, best, sellingDays } = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    const byDate = new Map(rows.map((r) => [r.d, r]));
    const data = Array.from({ length: days }, (_, i) => {
      const iso = `${month}-${String(i + 1).padStart(2, "0")}`;
      const r = byDate.get(iso);
      return { label: String(i + 1), value: r?.total ?? 0, orders: r?.orders ?? 0 };
    });
    const monthTotal = data.reduce((s, d) => s + d.value, 0);
    const selling = data.filter((d) => d.value > 0);
    const best = data.reduce((a, b) => (b.value > a.value ? b : a), data[0] ?? { label: "-", value: 0 });
    return { data, monthTotal, avg: selling.length ? monthTotal / selling.length : 0, best, sellingDays: selling.length };
  }, [rows, month]);

  const todayDay = month === bkkToday().slice(0, 7) ? String(Number(bkkToday().slice(8, 10))) : undefined;
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
            <h3 className="text-base font-semibold text-ink leading-tight">ยอดขายรายวัน</h3>
            <p className="text-xs text-muted truncate">{monthLabel(month)} · แยกตามวัน</p>
          </div>
        </div>
        <input type="month" value={month} max={bkkToday().slice(0, 7)} onChange={(e) => setMonth(e.target.value)}
          className="ml-auto border border-line rounded-lg px-3 py-2 text-sm bg-surface text-ink focus:outline-none focus:border-brand" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 border-y border-line-soft py-3">
        <Stat label="ยอดรวมเดือนนี้" value={`฿${nf(monthTotal)}`} />
        <Stat label="เฉลี่ย/วันที่ขาย" value={`฿${nf(avg)}`} />
        <Stat label="วันขายดีสุด" value={best.value > 0 ? `฿${nf(best.value)} · วันที่ ${best.label}` : "-"} />
      </div>

      <div style={{ height: 240 }}>
        {pending && !rows.length ? (
          <div className="h-full flex items-center justify-center text-sm text-muted">กำลังโหลด…</div>
        ) : !hasData ? (
          <div className="h-full flex items-center justify-center text-sm text-muted">ยังไม่มียอดขายในเดือนนี้</div>
        ) : (
          <Columns data={data} money highlight={todayDay} />
        )}
      </div>
      {hasData && <p className="text-[11px] text-muted mt-2">มียอดขาย {sellingDays} วันในเดือนนี้{todayDay ? " · แท่งสีเข้ม = วันนี้" : ""}</p>}
    </div>
  );
}
