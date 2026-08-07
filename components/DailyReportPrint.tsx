"use client";
import { useEffect, useState, useTransition } from "react";
import { Printer, FileText } from "lucide-react";
import { getDailyReport } from "@/lib/actions/report";
import type { DailyReport as ReportData } from "@/lib/queries";

const SRC_LABEL: Record<string, string> = { CTW: "Central World (CTW)", EVENT_SCS: "Event" };
const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const nf = (n: number) => Math.round(n || 0).toLocaleString("en-US");
const thaiDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** Printable branch daily sales report for the review page (A4, black-on-white). */
export function DailyReportPrint({ defaultSource = "CTW", revision }: { defaultSource?: string; revision?: string | number }) {
  const [date, setDate] = useState(bkkToday());
  const [data, setData] = useState<ReportData | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    start(async () => { try { setData(await getDailyReport(date, defaultSource, false)); } catch { setData(null); } });
  }, [date, defaultSource, revision]);

  const ready = !!data && data.orders > 0;
  const srcLabel = SRC_LABEL[defaultSource] ?? defaultSource;

  const Row = ({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) => (
    <div className={`flex items-baseline justify-between gap-4 py-1.5 ${strong ? "border-t-2 border-black mt-1 pt-2" : "border-b border-dashed border-neutral-300"}`}>
      <span className={strong ? "font-bold text-[15px]" : "text-[13px]"}>{label}</span>
      <span className={`tabular-nums ${strong ? "font-bold text-lg" : "text-[13px] font-medium"}`}>{value}</span>
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
            <p className="text-xs text-muted">เลือกวันที่แล้วกดปริ้น</p>
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

      {/* printable sheet — always white so it prints cleanly in any theme */}
      <div className="print-area mx-auto max-w-[560px] rounded-xl border border-line bg-white text-black shadow-sm px-8 py-7">
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <div className="text-lg font-bold">รายงานสรุปยอดขายประจำวัน</div>
          <div className="text-sm mt-0.5">Lab Parfumo · {srcLabel}</div>
          <div className="text-sm text-neutral-600 mt-0.5">{thaiDate(date)}</div>
        </div>

        {pending && !data ? (
          <div className="py-10 text-center text-sm text-neutral-500">กำลังโหลด…</div>
        ) : !ready ? (
          <div className="py-10 text-center text-sm text-neutral-500">ยังไม่มียอดขายของวันนี้</div>
        ) : (
          <>
            <div className="mb-3">
              <Row label="จำนวนออเดอร์" value={`${data!.orders} รายการ`} />
              <Row label="เงินสด" value={`${nf(data!.cash)} บาท`} />
              <Row label="โอน / เครดิต" value={`${nf(data!.nonCash)} บาท`} />
              <Row label="รวมเป็นเงินทั้งสิ้น" value={`${nf(data!.total)} บาท`} strong />
            </div>

            <div className="mb-5">
              <div className="text-[13px] font-semibold mb-1">แยกตามสัญชาติลูกค้า</div>
              <Row label={`คนไทย · ${data!.thaiCount} ราย`} value={`${nf(data!.thaiAmt)} บาท`} />
              <Row label={`ต่างชาติ · ${data!.foreignCount} ราย`} value={`${nf(data!.foreignAmt)} บาท`} />
              {data!.otherCount > 0 && <Row label={`อื่นๆ/ไม่ระบุ · ${data!.otherCount} ราย`} value={`${nf(data!.otherAmt)} บาท`} />}
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 text-[13px]">
              <div className="text-center"><div className="border-t border-black pt-1.5">ผู้จัดทำ</div></div>
              <div className="text-center"><div className="border-t border-black pt-1.5">ผู้ตรวจสอบ</div></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
