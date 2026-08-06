"use client";
import { Plus, Trash2 } from "lucide-react";
import { PAYMENTS, type Tender, splitAmounts, splitSum } from "@/lib/payments";
import { baht } from "@/lib/format";

// Presentational split-tender editor: pick each channel + amount; the last row
// auto-fills the remainder. Used by the new-bill edit forms (staff + admin).
export function SplitTenders({ value, onChange, net }: { value: Tender[]; onChange: (t: Tender[]) => void; net: number }) {
  const amounts = splitAmounts(value, net);
  const sum = splitSum(value, net);
  const matches = net > 0 && Math.round(sum) === Math.round(net);
  const setT = (i: number, patch: Partial<Tender>) => onChange(value.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  const inp = "border border-line rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-brand";
  return (
    <div className="mt-2 space-y-2">
      {value.map((t, i) => {
        const last = i === value.length - 1;
        return (
          <div key={i} className="flex gap-2 items-center">
            <select className={inp + " flex-1 min-w-0"} value={t.channel} onChange={(e) => setT(i, { channel: e.target.value })}>
              <option value="">- เลือกช่องทาง -</option>
              {PAYMENTS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
            </select>
            <div className="relative w-28 shrink-0">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-sm">฿</span>
              <input inputMode="numeric" value={last ? String(Math.round(amounts[i])) : (t.amount ?? "")} readOnly={last}
                onChange={(e) => setT(i, { amount: e.target.value.replace(/[^\d]/g, "") })} onFocus={(e) => e.target.select()}
                className={"w-full border border-line rounded-lg pl-6 pr-2 py-2 text-sm text-right tabular-nums focus:outline-none focus:border-brand " + (last ? "bg-canvas text-muted" : "bg-white")} />
            </div>
            {value.length > 2 && !last && (
              <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="p-1 rounded text-muted hover:text-red-600 shrink-0" aria-label="ลบช่องทาง"><Trash2 className="w-4 h-4" /></button>
            )}
          </div>
        );
      })}
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => onChange([...value, { channel: "", amount: "" }])} disabled={value.length >= 3}
          className="text-xs text-brand-dark hover:underline disabled:opacity-40 disabled:no-underline inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> เพิ่มช่องทาง</button>
        <span className={"text-xs font-medium " + (matches ? "text-green-600" : "text-danger")}>
          รวมชำระ {baht(sum)}{matches ? " · ตรงกับยอดบิล" : (sum < net ? ` · ขาด ${baht(net - sum)}` : ` · เกิน ${baht(sum - net)}`)}
        </span>
      </div>
    </div>
  );
}
