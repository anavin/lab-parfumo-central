"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { num } from "@/lib/format";

// ป้องกันของหาย — เทียบ "คาดว่าเหลือ (book)" กับ "นับจริง (actual)" จากการนับสต๊อกล่าสุด
// ผลต่างติดลบ = ของขาด/หาย · พร้อมมูลค่า + วันที่นับล่าสุด + เตือนของที่ยังไม่ได้นับนาน
export type LossRow = {
  scent: string; size: string;
  expected: number | null; counted: number | null; diff: number | null;
  value: number; remaining: number; countedAt: string | null; stale: boolean; neverCounted: boolean;
};
export type LossSummary = { shortN: number; shortUnits: number; negativeN: number; notCountedN: number };

const inp = "border border-line rounded-lg pl-8 pr-2 py-1.5 text-sm bg-surface text-ink focus:outline-none focus:border-brand w-full";
const bahtSigned = (n: number) => (n < 0 ? "−" : n > 0 ? "+" : "") + "฿" + Math.abs(Math.round(n)).toLocaleString("en-US");
const daysAgo = (iso: string) => Math.floor((Date.now() - new Date(iso + "T00:00:00").getTime()) / 86400000);
const seenLabel = (iso: string | null) => {
  if (!iso) return "ยังไม่นับ";
  const d = daysAgo(iso);
  return d <= 0 ? "วันนี้" : d === 1 ? "เมื่อวาน" : `${d} วันก่อน`;
};

export function StockLoss({ rows, summary }: { rows: LossRow[]; summary: LossSummary }) {
  const [term, setTerm] = useState("");
  const [shortOnly, setShortOnly] = useState(false);

  const list = useMemo(() => {
    const t = term.trim().toLowerCase();
    return rows
      .filter((r) => (!t || r.scent.toLowerCase().includes(t)))
      .filter((r) => (!shortOnly || (r.diff != null && r.diff < 0)));
  }, [rows, term, shortOnly]);

  const Chip = ({ tone, children }: { tone: "danger" | "warn"; children: any }) => (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone === "danger" ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn"}`}>● {children}</span>
  );

  return (
    <div>
      {/* alert chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {summary.shortN > 0 && <Chip tone="danger">ขาดจากการนับ {summary.shortN} รายการ · {summary.shortUnits} ชิ้น</Chip>}
        {summary.negativeN > 0 && <Chip tone="danger">สต๊อกติดลบ {summary.negativeN}</Chip>}
        {summary.notCountedN > 0 && <Chip tone="warn">ยังไม่ได้นับ &gt;14 วัน · {summary.notCountedN}</Chip>}
        {summary.shortN === 0 && summary.negativeN === 0 && summary.notCountedN === 0 && (
          <span className="text-sm text-success">✓ ไม่พบของขาด/สัญญาณผิดปกติ</span>
        )}
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="ค้นหากลิ่น…" className={inp} />
        </div>
        <label className="inline-flex items-center gap-1.5 text-sm text-muted cursor-pointer select-none">
          <input type="checkbox" checked={shortOnly} onChange={(e) => setShortOnly(e.target.checked)} className="accent-brand" />
          เฉพาะที่ขาด
        </label>
        <span className="ml-auto text-xs text-muted">คาดว่าเหลือ = รับเข้า + ปรับ − ขาย − คืน</span>
      </div>

      {list.length === 0 ? (
        <div className="text-center text-sm text-muted py-10">ไม่มีข้อมูล — ยังไม่มีการนับสต๊อกที่อนุมัติ</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" style={{ minWidth: 560 }}>
            <thead>
              <tr className="text-muted text-left">
                <th className="font-medium px-2 pb-2">กลิ่น</th>
                <th className="font-medium px-2 pb-2">ขนาด</th>
                <th className="font-medium px-2 pb-2 text-right">คาดว่าเหลือ</th>
                <th className="font-medium px-2 pb-2 text-right">นับจริง</th>
                <th className="font-medium px-2 pb-2 text-right">ผลต่าง</th>
                <th className="font-medium px-2 pb-2 text-right">มูลค่า</th>
                <th className="font-medium px-2 pb-2 text-right whitespace-nowrap">นับล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
                const short = r.diff != null && r.diff < 0;
                const over = r.diff != null && r.diff > 0;
                return (
                  <tr key={r.scent + r.size} className={"border-t border-line-soft " + (short ? "bg-danger-soft" : "")}>
                    <td className="px-2 py-1.5 font-medium text-ink whitespace-nowrap">{r.scent}</td>
                    <td className="px-2 py-1.5 text-muted whitespace-nowrap">{r.size}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{r.expected == null ? "—" : num(r.expected)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {r.neverCounted ? <span className="text-warn font-medium">ยังไม่นับ</span> : num(r.counted ?? 0)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums font-semibold">
                      {r.diff == null ? <span className="text-warn">ต้องนับ</span>
                        : short ? <span className="text-danger">{r.diff} ขาด</span>
                        : over ? <span className="text-brand">+{r.diff} เกิน</span>
                        : <span className="text-success">ตรง ✓</span>}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {r.value === 0 ? <span className="text-muted-soft">—</span>
                        : <span className={r.value < 0 ? "text-danger" : "text-brand"}>{bahtSigned(r.value)}</span>}
                    </td>
                    <td className={"px-2 py-1.5 text-right whitespace-nowrap " + (r.stale || r.neverCounted ? "text-warn font-medium" : "text-muted")}>
                      {seenLabel(r.countedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted mt-3">ของขาด = นับจริงน้อยกว่าที่ระบบคาดไว้ → ตรวจช่วงเวลา/คนเข้าเวร · แนะนำนับกลิ่นขายเร็วบ่อยๆ เพื่อจับของหายได้เร็ว</p>
    </div>
  );
}
