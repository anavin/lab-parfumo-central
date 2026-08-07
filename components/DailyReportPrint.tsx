"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Printer, FileText } from "lucide-react";
import { getDailyReport, getDailyBills } from "@/lib/actions/report";
import { PAYMENTS } from "@/lib/payments";
import type { DailyReport as ReportData, SubmissionRow } from "@/lib/queries";

const SRC_LABEL: Record<string, string> = { CTW: "Central World (CTW)", EVENT_SCS: "Event" };
const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const nf = (n: number) => Math.round(n || 0).toLocaleString("en-US");
const thaiDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const payLabel = (v: string) => PAYMENTS.find((p) => p.v === v)?.label.replace(/\s*\(.*\)$/, "") || v || "-";
const natLabel = (n: string) => (n === "Foreign" ? "ต่างชาติ" : n === "Thai" ? "ไทย" : "-");

type Bill = { key: string; no: number; time: string; author: string; nation: string; pay: string; rows: SubmissionRow[]; total: number };
function groupBills(rows: SubmissionRow[]): Bill[] {
  const map = new Map<string, SubmissionRow[]>();
  const order: string[] = [];
  for (const r of rows) {
    const k = r.receipt_no || `id:${r.id}`;
    if (!map.has(k)) { map.set(k, []); order.push(k); }
    map.get(k)!.push(r);
  }
  return order.map((k, i) => {
    const rs = map.get(k)!; const f = rs[0];
    return { key: k, no: i + 1, time: (f.sale_time || "").slice(0, 5), author: f.author, nation: f.nation || "", pay: f.payment_channel || "", rows: rs, total: rs.reduce((s, r) => s + (r.total ?? 0), 0) };
  });
}

/** Printable A4 daily sales report — professional, black-on-white, easy to scan. */
export function DailyReportPrint({ defaultSource = "CTW", revision }: { defaultSource?: string; revision?: string | number }) {
  const [date, setDate] = useState(bkkToday());
  const [data, setData] = useState<ReportData | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [showDetail, setShowDetail] = useState(true);
  const [pending, start] = useTransition();

  useEffect(() => {
    start(async () => {
      try {
        const [rep, rows] = await Promise.all([getDailyReport(date, defaultSource, false), getDailyBills(date, defaultSource)]);
        setData(rep); setBills(groupBills(rows));
      } catch { setData(null); setBills([]); }
    });
  }, [date, defaultSource, revision]);

  const byPerson = useMemo(() => {
    const m = new Map<string, { bills: number; total: number }>();
    for (const b of bills) {
      const cur = m.get(b.author) ?? { bills: 0, total: 0 };
      cur.bills += 1; cur.total += b.total;
      m.set(b.author, cur);
    }
    return [...m.entries()].map(([author, v]) => ({ author, ...v })).sort((a, b) => b.total - a.total);
  }, [bills]);
  const totalQty = useMemo(() => bills.reduce((s, b) => s + b.rows.reduce((x, r) => x + (r.qty ?? 0), 0), 0), [bills]);
  // price roll-up: full (before discount) − discount = net selling price
  const price = useMemo(() => {
    let gross = 0, disc = 0;
    for (const b of bills) for (const r of b.rows) {
      gross += (r.qty ?? 0) * (r.unit_price ?? 0);
      disc += r.discount ?? 0;
    }
    return { gross, disc };
  }, [bills]);

  const ready = !!data && data.orders > 0;
  const srcLabel = SRC_LABEL[defaultSource] ?? defaultSource;
  const aov = ready ? data!.total / data!.orders : 0;
  const sellers = byPerson.map((p) => p.author);   // usually one salesperson per day
  const generatedAt = new Date().toLocaleString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });

  const Kpi = ({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) => (
    <div className={`border rounded-lg px-3 py-2.5 ${primary ? "border-black border-2" : "border-neutral-400"}`}>
      <div className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</div>
      <div className={`tabular-nums font-bold leading-tight ${primary ? "text-[22px]" : "text-lg"}`}>{value}</div>
    </div>
  );
  const SecTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500 border-b border-black pb-1 mb-2">{children}</div>
  );
  const KV = ({ k, v }: { k: string; v: string }) => (
    <div className="flex justify-between items-baseline py-1 border-b border-dashed border-neutral-300 text-[13px]">
      <span>{k}</span><span className="font-semibold tabular-nums">{v}</span>
    </div>
  );

  return (
    <div>
      {/* controls — hidden when printing */}
      <div className="no-print flex flex-wrap items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand-dark flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></div>
          <div>
            <h3 className="text-base font-semibold text-ink leading-tight">รายงานประจำวัน (สำหรับปริ้น)</h3>
            <p className="text-xs text-muted">เลือกวันที่แล้วกดปริ้น · สรุปแยกตามพนักงาน</p>
          </div>
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm select-none cursor-pointer">
          <input type="checkbox" checked={showDetail} onChange={(e) => setShowDetail(e.target.checked)} className="w-4 h-4 accent-brand" />
          <span className="text-ink">แสดงรายละเอียดแต่ละบิล</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">วันที่</span>
          <input type="date" value={date} max={bkkToday()} onChange={(e) => setDate(e.target.value)}
            className="border border-line rounded-lg px-3 py-2 text-sm bg-surface text-ink focus:outline-none focus:border-brand" />
        </label>
        <button onClick={() => window.print()} disabled={!ready}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-ink text-surface hover:opacity-90 disabled:opacity-50 whitespace-nowrap">
          <Printer className="w-4 h-4" /> ปริ้นรายงาน
        </button>
      </div>

      {/* printable A4 sheet — always white so it prints cleanly in any theme */}
      <div className="print-area daily-sheet mx-auto w-full max-w-[760px] rounded-xl border border-line bg-white text-black shadow-sm px-10 py-8">
        {/* header */}
        <div className="flex items-start justify-between gap-6 border-b-2 border-black pb-3 mb-5">
          <div>
            <div className="text-[22px] font-extrabold tracking-tight leading-none">Lab Parfumo</div>
            <div className="text-[13px] text-neutral-600 mt-1.5">รายงานสรุปยอดขายประจำวัน · {srcLabel}</div>
            {ready && sellers.length > 0 && (
              <div className="text-[13px] text-neutral-700 mt-1">พนักงานขาย: <span className="font-semibold">{sellers.join(" · ")}</span></div>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-[15px] font-bold leading-tight">{thaiDate(date)}</div>
            <div className="text-[11px] text-neutral-500 mt-1">ออกรายงานเมื่อ {generatedAt} น.</div>
          </div>
        </div>

        {pending && !data ? (
          <div className="py-12 text-center text-sm text-neutral-500">กำลังโหลด…</div>
        ) : !ready ? (
          <div className="py-12 text-center text-sm text-neutral-500">ยังไม่มียอดขายของวันนี้</div>
        ) : (
          <>
            {/* KPI band */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <Kpi label="ยอดขายรวม" value={`฿${nf(data!.total)}`} primary />
              <Kpi label="จำนวนบิล" value={`${data!.orders}`} />
              <Kpi label="จำนวนชิ้น" value={`${Math.round(totalQty)}`} />
              <Kpi label="เฉลี่ย/บิล" value={`฿${nf(aov)}`} />
            </div>

            {/* price breakdown: full − discount = net */}
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border border-neutral-400 rounded-lg px-4 py-2.5 mb-6 text-[13px]">
              <span className="flex items-baseline gap-1.5"><span className="text-neutral-500">ราคาเต็ม</span><span className="font-semibold tabular-nums">฿{nf(price.gross)}</span></span>
              <span className="text-neutral-400">−</span>
              <span className="flex items-baseline gap-1.5"><span className="text-neutral-500">ส่วนลด</span><span className="font-semibold tabular-nums">฿{nf(price.disc)}</span></span>
              <span className="text-neutral-400">=</span>
              <span className="flex items-baseline gap-1.5 ml-auto"><span className="text-neutral-500">ราคาขายสุทธิ</span><span className="font-bold text-[15px] tabular-nums">฿{nf(data!.total)}</span></span>
            </div>

            {/* breakdowns — payment + nationality side by side */}
            <div className="grid grid-cols-2 gap-x-10 mb-6">
              <div>
                <SecTitle>ช่องทางรับเงิน</SecTitle>
                <KV k="เงินสด" v={`${nf(data!.cash)} บาท`} />
                <KV k="โอน / เครดิต" v={`${nf(data!.nonCash)} บาท`} />
              </div>
              <div>
                <SecTitle>สัญชาติลูกค้า</SecTitle>
                <KV k={`คนไทย (${data!.thaiCount})`} v={`${nf(data!.thaiAmt)} บาท`} />
                <KV k={`ต่างชาติ (${data!.foreignCount})`} v={`${nf(data!.foreignAmt)} บาท`} />
                {data!.otherCount > 0 && <KV k={`อื่นๆ (${data!.otherCount})`} v={`${nf(data!.otherAmt)} บาท`} />}
              </div>
            </div>

            {/* per-salesperson summary — only when more than one sold that day
                (a single seller is already named in the header) */}
            {byPerson.length > 1 && (
              <div className="mb-6">
                <SecTitle>สรุปตามพนักงานขาย</SecTitle>
                <table className="w-full text-[13px] border-collapse">
                  <thead>
                    <tr className="text-left text-neutral-500 text-[11px] uppercase tracking-wide">
                      <th className="pb-1.5 font-semibold">พนักงานขาย</th>
                      <th className="pb-1.5 w-24 text-right font-semibold">จำนวนบิล</th>
                      <th className="pb-1.5 w-28 text-right font-semibold">ยอด (บาท)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byPerson.map((p) => (
                      <tr key={p.author} className="border-t border-neutral-200">
                        <td className="py-1.5 font-medium">{p.author}</td>
                        <td className="py-1.5 text-right tabular-nums">{p.bills}</td>
                        <td className="py-1.5 text-right font-semibold tabular-nums">{nf(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* per-bill detail (toggle) */}
            {showDetail && (
              <div className="mb-6">
                <SecTitle>รายละเอียดแต่ละบิล</SecTitle>
                <table className="w-full text-[12px] border-collapse">
                  <thead>
                    <tr className="text-left text-neutral-500 text-[11px] uppercase tracking-wide">
                      <th className="pb-1.5 pr-2 w-7 font-semibold">#</th>
                      <th className="pb-1.5 pr-2 w-12 font-semibold">เวลา</th>
                      <th className="pb-1.5 pr-2 font-semibold">รายการ</th>
                      <th className="pb-1.5 pr-2 w-24 font-semibold">ชำระ</th>
                      <th className="pb-1.5 pr-2 w-14 font-semibold">สัญชาติ</th>
                      <th className="pb-1.5 text-right w-20 font-semibold">ยอด (บาท)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((b) => (
                      <tr key={b.key} className="border-t border-neutral-200 align-top">
                        <td className="py-2 pr-2 font-semibold tabular-nums">{b.no}</td>
                        <td className="py-2 pr-2 tabular-nums">{b.time || "-"}</td>
                        <td className="py-2 pr-2">
                          <ul className="text-[11px] text-neutral-700 space-y-0.5">
                            {b.rows.map((r) => {
                              const g = (r.qty ?? 0) * (r.unit_price ?? 0);
                              return (
                                <li key={r.id}>
                                  <span className="text-black">{Math.round(r.qty ?? 0)}× {r.item}{r.size ? ` ${r.size}` : ""}</span>
                                  <span className="text-neutral-500"> · เต็ม ฿{nf(g)} · ลด ฿{nf(r.discount ?? 0)} · ขาย </span>
                                  <span className="font-semibold text-black">฿{nf(r.total ?? 0)}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </td>
                        <td className="py-2 pr-2">{payLabel(b.pay)}</td>
                        <td className="py-2 pr-2">{natLabel(b.nation)}</td>
                        <td className="py-2 text-right font-semibold tabular-nums">{nf(b.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-black">
                      <td colSpan={5} className="py-2 font-bold">รวม {bills.length} บิล</td>
                      <td className="py-2 text-right font-bold text-[13px] tabular-nums">{nf(data!.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* signatures */}
            <div className="grid grid-cols-2 gap-12 pt-12 text-[13px]">
              <div className="text-center"><div className="border-t border-black pt-1.5">ผู้จัดทำ</div></div>
              <div className="text-center"><div className="border-t border-black pt-1.5">ผู้ตรวจสอบ</div></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
