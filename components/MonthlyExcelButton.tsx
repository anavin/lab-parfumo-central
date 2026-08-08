"use client";
import { useState } from "react";
import { FileSpreadsheet, Download, ChevronDown } from "lucide-react";

const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const TH_MON = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

// Build the last N months (newest first) as {value:'YYYY-MM', label:'สิงหาคม 2569'}.
function recentMonths(n = 24) {
  const [y0, m0] = bkkToday().split("-").map(Number);
  const out: { value: string; label: string }[] = [];
  let y = y0, m = m0;
  for (let i = 0; i < n; i++) {
    out.push({ value: `${y}-${String(m).padStart(2, "0")}`, label: `${TH_MON[m]} ${y + 543}` });
    m--; if (m === 0) { m = 12; y--; }
  }
  return out;
}

// Month dropdown + download link for the monthly sales Excel export (.xlsx).
export function MonthlyExcelButton() {
  const [months] = useState(recentMonths);
  const [month, setMonth] = useState(months[0].value);   // YYYY-MM, default = this month

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
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1.5 text-[10px] uppercase tracking-wide text-muted-soft leading-none">เลือกเดือน</span>
            <select value={month} onChange={(e) => setMonth(e.target.value)}
              className="appearance-none h-full rounded-xl border border-line bg-canvas/60 pl-3.5 pr-9 pt-5 pb-2 text-sm font-semibold text-ink cursor-pointer hover:border-brand focus:outline-none focus:border-brand transition-colors"
              aria-label="เลือกเดือน">
              {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          </div>
          <a href={`/api/export/sales-monthly?month=${month}`}
            className="inline-flex items-center gap-2 px-5 rounded-xl bg-ink text-surface text-sm font-semibold hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" /> ดาวน์โหลด
          </a>
        </div>
      </div>
    </div>
  );
}
