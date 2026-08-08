"use client";
import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";

const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

// Month picker + download link for the monthly sales Excel export (.xlsx).
export function MonthlyExcelButton() {
  const [month, setMonth] = useState(bkkToday().slice(0, 7));   // YYYY-MM
  return (
    <div className="card p-4 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[180px]">
        <div className="text-sm font-semibold text-ink">ดาวน์โหลดยอดขายรายเดือน (Excel)</div>
        <div className="text-xs text-muted mt-0.5">รายละเอียดทุกบิล + สรุปรายวัน · พนักงาน · สินค้าขายดี</div>
      </div>
      <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
        className="border border-line rounded-lg px-3 py-2 text-sm bg-surface" aria-label="เลือกเดือน" />
      <a href={`/api/export/sales-monthly?month=${month}`}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-ink text-surface text-sm font-semibold hover:opacity-90">
        <FileSpreadsheet className="w-4 h-4" /> ดาวน์โหลด Excel
      </a>
    </div>
  );
}
