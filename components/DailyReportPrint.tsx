"use client";
import { useState } from "react";
import { Printer, FileText, ChevronDown, Download } from "lucide-react";

// The preview IS the real server PDF (shown inline), so what you see on screen is
// exactly what downloads/prints — 100% identical, no separate HTML layout to drift.
const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

export function DailyReportPrint({ defaultSource = "CTW", revision, date: dateProp, onDateChange, open: openProp, onOpenChange }: {
  defaultSource?: string; revision?: string | number;
  date?: string; onDateChange?: (d: string) => void;   // controlled date (optional)
  open?: boolean; onOpenChange?: (o: boolean) => void;  // controlled open (optional)
}) {
  const [dateI, setDateI] = useState(bkkToday());
  const date = dateProp ?? dateI;
  const setDate = onDateChange ?? setDateI;
  const [openI, setOpenI] = useState(false);            // collapsed by default — click to reveal
  const open = openProp ?? openI;
  const setOpen = onOpenChange ?? setOpenI;

  const pdfUrl = (disp: "inline" | "download") =>
    `/api/daily-report/pdf?date=${date}&source=${defaultSource}${disp === "inline" ? "&disp=inline" : ""}`;

  return (
    <div className="no-print">
      {/* collapsed by default — click to reveal the printable report */}
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
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted">วันที่</span>
              <input type="date" value={date} max={bkkToday()} onChange={(e) => setDate(e.target.value)}
                className="border border-line rounded-lg px-3 py-2 text-sm bg-surface text-ink focus:outline-none focus:border-brand" />
            </label>
            <div className="ml-auto flex items-center gap-2">
              <a href={pdfUrl("download")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-line bg-surface text-ink text-sm font-semibold hover:bg-canvas whitespace-nowrap">
                <Download className="w-4 h-4" /> ดาวน์โหลด PDF
              </a>
              <a href={pdfUrl("inline")} target="_blank" rel="noopener"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-line bg-surface text-ink text-sm font-semibold hover:bg-canvas whitespace-nowrap">
                <Printer className="w-4 h-4" /> พิมพ์
              </a>
            </div>
          </div>

          {/* preview = the exact PDF that downloads/prints */}
          <iframe key={`${date}|${revision ?? ""}`} src={pdfUrl("inline")} title="รายงานประจำวัน"
            className="w-full rounded-xl border border-line bg-white" style={{ height: "85vh" }} />
        </div>
      )}
    </div>
  );
}
