"use client";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

const shift = (date: string, days: number) => {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export function DateNav({ date, today }: { date: string; today: string }) {
  const router = useRouter();
  const go = (d: string) => router.push(`/my?date=${d}`);
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => go(shift(date, -1))} className="p-2 rounded-lg border border-line bg-white hover:bg-canvas" aria-label="วันก่อนหน้า">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <input type="date" value={date} max={today} onChange={(e) => e.target.value && go(e.target.value)}
        className="border border-line rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand" />
      <button onClick={() => go(shift(date, 1))} disabled={date >= today}
        className="p-2 rounded-lg border border-line bg-white hover:bg-canvas disabled:opacity-40" aria-label="วันถัดไป">
        <ChevronRight className="w-4 h-4" />
      </button>
      {date !== today && (
        <button onClick={() => go(today)} className="ml-1 px-3 py-2 rounded-lg text-sm font-medium bg-ink text-white hover:bg-black">วันนี้</button>
      )}
    </div>
  );
}
