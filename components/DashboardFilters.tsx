"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui/Select";

const PERIODS = [
  { k: "all", label: "ทั้งหมด" },
  { k: "12m", label: "12 เดือน" },
  { k: "6m", label: "6 เดือน" },
  { k: "3m", label: "3 เดือน" },
];
const SOURCES = [
  { value: "all", label: "ทุกช่องทาง" },
  { value: "CTW", label: "CTW" },
  { value: "EVENT_SCS", label: "Event SCS" },
];

export function DashboardFilters({ months }: { months: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const period = sp.get("period") ?? "all";
  const month = sp.get("month") ?? "all";
  const source = sp.get("source") ?? "all";

  const update = (patch: Record<string, string>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === "all") p.delete(k);
      else p.set(k, v);
    }
    const qs = p.toString();
    start(() => router.push(qs ? `/?${qs}` : "/", { scroll: false }));
  };

  // month options — newest first, plus "ทุกเดือน"
  const monthOpts = [{ value: "all", label: "ทุกเดือน" }, ...[...months].reverse().map((m) => ({ value: m, label: m }))];
  const usingMonth = month !== "all";

  return (
    <div className={`flex items-center gap-2 flex-wrap ${pending ? "opacity-60" : ""}`}>
      {/* period presets — disabled visually when a specific month is picked */}
      <div className={`flex items-center gap-0.5 p-0.5 rounded-lg bg-line-soft border border-line ${usingMonth ? "opacity-50" : ""}`}>
        {PERIODS.map((p) => (
          <button
            key={p.k}
            onClick={() => update({ period: p.k, month: "all" })}
            className={`px-2.5 py-1.5 rounded-md text-[12.5px] font-medium transition-colors ${
              !usingMonth && period === p.k ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="w-32">
        <Select value={month} onValueChange={(v) => update({ month: v, period: "all" })} options={monthOpts} placeholder="เลือกเดือน" />
      </div>
      <div className="w-36">
        <Select value={source} onValueChange={(v) => update({ source: v })} options={SOURCES} />
      </div>
    </div>
  );
}
