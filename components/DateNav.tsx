"use client";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const shift = (date: string, days: number) => {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// "พฤ. 6 ส.ค. 2569"
const fmtThai = (date: string) =>
  new Date(date + "T00:00:00").toLocaleDateString("th-TH", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

export function DateNav({ date, today }: { date: string; today: string }) {
  const router = useRouter();
  const go = (d: string) => router.push(`/my?date=${d}`);
  const isToday = date === today;

  return (
    <div className="w-full sm:w-auto flex items-center justify-center gap-2">
      <div className="flex items-stretch rounded-xl border border-line bg-white shadow-sm overflow-hidden">
        <button onClick={() => go(shift(date, -1))}
          className="px-2.5 flex items-center text-muted hover:bg-canvas hover:text-ink transition-colors"
          aria-label="วันก่อนหน้า">
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* formatted date label with a transparent native picker on top */}
        <label className="relative flex items-center justify-center gap-2 px-3.5 py-2 min-w-[156px] border-x border-line cursor-pointer hover:bg-canvas transition-colors">
          <CalendarDays className="w-4 h-4 text-brand-dark shrink-0" />
          <span className="text-sm font-semibold text-ink whitespace-nowrap">{fmtThai(date)}</span>
          <input type="date" value={date} max={today} onChange={(e) => e.target.value && go(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="เลือกวันที่" />
        </label>

        <button onClick={() => go(shift(date, 1))} disabled={isToday}
          className="px-2.5 flex items-center text-muted hover:bg-canvas hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted transition-colors"
          aria-label="วันถัดไป">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {!isToday && (
        <button onClick={() => go(today)}
          className="px-3.5 py-2 rounded-xl text-sm font-medium bg-ink text-white hover:bg-black shrink-0 transition-colors">
          วันนี้
        </button>
      )}
    </div>
  );
}
