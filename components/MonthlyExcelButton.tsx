"use client";
import { useState } from "react";
import { FileSpreadsheet, Download } from "lucide-react";

const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const TH_MON = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const monthLabel = (m: string) => { const [y, mm] = m.split("-").map(Number); return `${TH_MON[mm] || mm} ${y + 543}`; };

// Month picker + download link for the monthly sales Excel export (.xlsx).
export function MonthlyExcelButton() {
  const [month, setMonth] = useState(bkkToday().slice(0, 7));   // YYYY-MM

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-success-soft grid place-items-center shrink-0">
            <FileSpreadsheet className="w-5.5 h-5.5 text-success" />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-ink">ดาวน์โหลดยอดขายรายเดือน</div>
            <div className="text-[12.5px] text-muted mt-0.5">ไฟล์ Excel · รายละเอียดทุกบิล + สรุปรายวัน · พนักงาน · สินค้าขายดี</div>
          </div>
        </div>

        <div className="flex items-stretch gap-2 shrink-0">
          <label className="relative flex flex-col justify-center rounded-xl border border-line bg-canvas/60 px-3.5 py-2 cursor-pointer hover:border-brand transition-colors">
            <span className="text-[10px] uppercase tracking-wide text-muted-soft leading-none">เดือน</span>
            <span className="text-sm font-semibold text-ink tabular-nums leading-tight mt-0.5">{monthLabel(month)}</span>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer" aria-label="เลือกเดือน" />
          </label>
          <a href={`/api/export/sales-monthly?month=${month}`}
            className="inline-flex items-center gap-2 px-5 rounded-xl bg-ink text-surface text-sm font-semibold hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" /> ดาวน์โหลด
          </a>
        </div>
      </div>
    </div>
  );
}
