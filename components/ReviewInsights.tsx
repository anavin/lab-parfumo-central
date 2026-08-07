"use client";
import { useRef, useState } from "react";
import { MonthlyDailyChart } from "@/components/MonthlyDailyChart";
import { DailyReportPrint } from "@/components/DailyReportPrint";

/** Links the monthly chart to the printable daily report: clicking a bar sets the
 *  report's date, opens it, and scrolls to it. `children` (the review queue) renders
 *  between the two so the page order stays chart → queue → report. */
export function ReviewInsights({ revision, children }: { revision?: string | number; children: React.ReactNode }) {
  const [date, setDate] = useState<string | undefined>(undefined);   // undefined → report defaults to today
  const [open, setOpen] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const pickDay = (iso: string) => {
    setDate(iso);
    setOpen(true);
    setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 90);
  };

  return (
    <>
      <div className="mb-6"><MonthlyDailyChart revision={revision} selected={date} onPickDay={pickDay} /></div>
      {children}
      <div ref={reportRef} className="mt-8 scroll-mt-4">
        <DailyReportPrint revision={revision} date={date} onDateChange={setDate} open={open} onOpenChange={setOpen} />
      </div>
    </>
  );
}
