"use client";
import { useEffect, useState, useTransition } from "react";
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

/** Printable A4 branch daily sales report — summary + per-bill detail. */
export function DailyReportPrint({ defaultSource = "CTW", revision }: { defaultSource?: string; revision?: string | number }) {
  const [date, setDate] = useState(bkkToday());
  const [data, setData] = useState<ReportData | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [pending, start] = useTransition();

  useEffect(() => {
    start(async () => {
      try {
        const [rep, rows] = await Promise.all([getDailyReport(date, defaultSource, false), getDailyBills(date, defaultSource)]);
        setData(rep); setBills(groupBills(rows));
      } catch { setData(null); setBills([]); }
    });
  }, [date, defaultSource, revision]);

  const ready = !!data && data.orders > 0;
  const srcLabel = SRC_LABEL[defaultSource] ?? defaultSource;

  return (
    <div>
      {/* controls — hidden when printing */}
      <div className="no-print flex flex-wrap items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand-dark flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></div>
          <div>
            <h3 className="text-base font-semibold text-ink leading-tight">รายงานประจำวัน (สำหรับปริ้น)</h3>
            <p className="text-xs text-muted">เลือกวันที่แล้วกดปริ้น · มีรายละเอียดแต่ละบิล</p>
          </div>
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm">
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
        <div className="text-center border-b-2 border-black pb-3 mb-5">
          <div className="text-xl font-bold">รายงานสรุปยอดขายประจำวัน</div>
          <div className="text-sm mt-1">Lab Parfumo · {srcLabel}</div>
          <div className="text-sm text-neutral-600 mt-0.5">{thaiDate(date)}</div>
        </div>

        {pending && !data ? (
          <div className="py-12 text-center text-sm text-neutral-500">กำลังโหลด…</div>
        ) : !ready ? (
          <div className="py-12 text-center text-sm text-neutral-500">ยังไม่มียอดขายของวันนี้</div>
        ) : (
          <>
            {/* summary */}
            <div className="grid grid-cols-2 gap-x-10 gap-y-1.5 mb-5 text-[13px]">
              <div className="flex justify-between border-b border-dashed border-neutral-300 py-1"><span>จำนวนออเดอร์</span><span className="font-medium tabular-nums">{data!.orders} รายการ</span></div>
              <div className="flex justify-between border-b border-dashed border-neutral-300 py-1"><span>คนไทย ({data!.thaiCount})</span><span className="font-medium tabular-nums">{nf(data!.thaiAmt)} บาท</span></div>
              <div className="flex justify-between border-b border-dashed border-neutral-300 py-1"><span>เงินสด</span><span className="font-medium tabular-nums">{nf(data!.cash)} บาท</span></div>
              <div className="flex justify-between border-b border-dashed border-neutral-300 py-1"><span>ต่างชาติ ({data!.foreignCount})</span><span className="font-medium tabular-nums">{nf(data!.foreignAmt)} บาท</span></div>
              <div className="flex justify-between border-b border-dashed border-neutral-300 py-1"><span>โอน / เครดิต</span><span className="font-medium tabular-nums">{nf(data!.nonCash)} บาท</span></div>
              {data!.otherCount > 0 && <div className="flex justify-between border-b border-dashed border-neutral-300 py-1"><span>อื่นๆ ({data!.otherCount})</span><span className="font-medium tabular-nums">{nf(data!.otherAmt)} บาท</span></div>}
            </div>
            <div className="flex justify-between items-baseline border-y-2 border-black py-2 mb-6">
              <span className="font-bold text-[15px]">รวมเป็นเงินทั้งสิ้น</span>
              <span className="font-bold text-xl tabular-nums">{nf(data!.total)} บาท</span>
            </div>

            {/* per-bill detail */}
            <div className="text-sm font-bold mb-1.5">รายละเอียดแต่ละบิล</div>
            <table className="w-full text-[12px] border-collapse mb-6">
              <thead>
                <tr className="border-y-2 border-black text-left">
                  <th className="py-1.5 pr-2 w-7 font-semibold">#</th>
                  <th className="py-1.5 pr-2 w-12 font-semibold">เวลา</th>
                  <th className="py-1.5 pr-2 font-semibold">พนักงาน / รายการ</th>
                  <th className="py-1.5 pr-2 w-24 font-semibold">ชำระ</th>
                  <th className="py-1.5 pr-2 w-14 font-semibold">สัญชาติ</th>
                  <th className="py-1.5 text-right w-20 font-semibold">ยอด (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.key} className="border-b border-neutral-300 align-top">
                    <td className="py-2 pr-2 font-semibold tabular-nums">{b.no}</td>
                    <td className="py-2 pr-2 tabular-nums">{b.time || "-"}</td>
                    <td className="py-2 pr-2">
                      <div className="font-medium">{b.author}</div>
                      <ul className="text-[11px] text-neutral-600 mt-0.5 space-y-0.5">
                        {b.rows.map((r) => (
                          <li key={r.id}>{Math.round(r.qty ?? 0)}× {r.item}{r.size ? ` ${r.size}` : ""} — ฿{nf(r.total ?? 0)}</li>
                        ))}
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

            {/* signatures */}
            <div className="grid grid-cols-2 gap-10 pt-10 text-[13px]">
              <div className="text-center"><div className="border-t border-black pt-1.5">ผู้จัดทำ</div></div>
              <div className="text-center"><div className="border-t border-black pt-1.5">ผู้ตรวจสอบ</div></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
