"use client";
import { useEffect, useState, useTransition } from "react";
import { Printer, FileText, ChevronDown } from "lucide-react";
import { getDailyReport, getDailyBills } from "@/lib/actions/report";
import type { DailyReport as ReportData, DaySaleRow } from "@/lib/queries";
import { DailyReportSheet } from "@/components/DailyReportSheet";

const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

export function DailyReportPrint({ defaultSource = "CTW", revision, date: dateProp, onDateChange, open: openProp, onOpenChange }: {
  defaultSource?: string; revision?: string | number;
  date?: string; onDateChange?: (d: string) => void;   // controlled date (optional)
  open?: boolean; onOpenChange?: (o: boolean) => void;  // controlled open (optional)
}) {
  const [dateI, setDateI] = useState(bkkToday());
  const date = dateProp ?? dateI;
  const setDate = onDateChange ?? setDateI;
  const [openI, setOpenI] = useState(false);
  const open = openProp ?? openI;
  const setOpen = onOpenChange ?? setOpenI;
  const [data, setData] = useState<ReportData | null>(null);
  const [rows, setRows] = useState<DaySaleRow[]>([]);
  const [showDetail, setShowDetail] = useState(true);
  const [pending, start] = useTransition();

  useEffect(() => {
    start(async () => {
      try {
        const [rep, rs] = await Promise.all([getDailyReport(date, defaultSource, false), getDailyBills(date, defaultSource)]);
        setData(rep); setRows(rs);
      } catch { setData(null); setRows([]); }
    });
  }, [date, defaultSource, revision]);

  const ready = !!data && data.orders > 0;
  const generatedAt = new Date().toLocaleString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok" });
  // print / save PDF opens a clean, shell-free page that Safari prints reliably —
  // same markup as this preview, so what prints is exactly what you see.
  const printUrl = `/print/daily-report?date=${date}&source=${defaultSource}&detail=${showDetail ? 1 : 0}`;

  return (
    <div className="no-print">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line bg-canvas/60 text-ink hover:bg-canvas transition-colors">
        <FileText className="w-4 h-4 text-brand-dark shrink-0" />
        <span className="text-sm font-semibold">รายงานประจำวัน</span>
        <span className="text-xs text-muted">· คลิกเพื่อดู / ปริ้น</span>
        <ChevronDown className={`w-4 h-4 text-muted ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
              <input type="checkbox" checked={showDetail} onChange={(e) => setShowDetail(e.target.checked)} className="w-4 h-4 accent-brand" />
              <span className="text-ink">แสดงรายละเอียดแต่ละบิล</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted">วันที่</span>
              <input type="date" value={date} max={bkkToday()} onChange={(e) => setDate(e.target.value)}
                className="border border-line rounded-lg px-3 py-2 text-sm bg-surface text-ink focus:outline-none focus:border-brand" />
            </label>
            <a href={printUrl} target="_blank" rel="noopener" aria-disabled={!ready}
              className={`ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-ink text-surface hover:opacity-90 whitespace-nowrap ${ready ? "" : "pointer-events-none opacity-50"}`}>
              <Printer className="w-4 h-4" /> พิมพ์ / บันทึก PDF
            </a>
          </div>

          {/* preview — identical markup to the print page */}
          {pending && !data
            ? <div className="py-12 text-center text-sm text-muted">กำลังโหลด…</div>
            : <DailyReportSheet date={date} source={defaultSource} data={data} rows={rows} showDetail={showDetail} generatedAt={generatedAt} />}
        </div>
      )}
    </div>
  );
}
