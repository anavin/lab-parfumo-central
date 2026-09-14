"use client";
import { Fragment, useMemo, useState, useTransition } from "react";
import { Search, ChevronRight, Loader2 } from "lucide-react";
import { num } from "@/lib/format";
import { lossDrilldown, type LossDrilldown } from "@/lib/actions/stock";
import { LossSignals } from "@/components/LossSignals";
import type { LossSignals as Signals } from "@/lib/queries";

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

export function StockLoss({ rows, summary, branch, signals }: { rows: LossRow[]; summary: LossSummary; branch: string | null; signals: Signals }) {
  const [term, setTerm] = useState("");
  const [shortOnly, setShortOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);          // scent|size ที่กางอยู่
  const [cache, setCache] = useState<Record<string, LossDrilldown>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [, start] = useTransition();

  const toggle = (r: LossRow) => {
    const key = r.scent + "|" + r.size;
    if (open === key) { setOpen(null); return; }
    setOpen(key);
    if (!cache[key]) {
      setLoadingKey(key);
      start(async () => {
        const res = await lossDrilldown(branch, r.scent, r.size);
        setCache((c) => ({ ...c, [key]: res }));
        setLoadingKey((k) => (k === key ? null : k));
      });
    }
  };

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

      {/* สัญญาณผิดปกติ (บิลน่าสงสัย / เงินสดขาด / ปรับมือ) */}
      <LossSignals signals={signals} />

      <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">ผลต่างการนับ</div>
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
                const key = r.scent + "|" + r.size;
                const canDrill = !r.neverCounted;            // มีผลนับแล้วเท่านั้นถึงสาวต้นตอได้
                const isOpen = open === key;
                return (
                  <Fragment key={key}>
                    <tr onClick={canDrill ? () => toggle(r) : undefined}
                      className={"border-t border-line-soft " + (short ? "bg-danger-soft" : "") + (canDrill ? " cursor-pointer hover:bg-canvas/60" : "")}>
                      <td className="px-2 py-1.5 font-medium text-ink whitespace-nowrap">
                        {canDrill && <ChevronRight className={"inline w-3.5 h-3.5 mr-1 text-muted transition-transform " + (isOpen ? "rotate-90" : "")} />}
                        {r.scent}
                      </td>
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
                    {isOpen && (
                      <tr>
                        <td colSpan={7} className="px-2 pb-3 bg-canvas/40">
                          <DrillPanel data={cache[key]} loading={loadingKey === key} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted mt-3">แตะแถวที่นับแล้ว → สาวหาต้นตอ (เหตุการณ์ในช่วง + ใครเข้าเวร) · แนะนำนับกลิ่นขายเร็วบ่อยๆ เพื่อจับของหายได้เร็ว</p>
    </div>
  );
}

const KIND: Record<string, { label: string; cls: string }> = {
  sale: { label: "ขาย", cls: "text-ink" },
  adjust: { label: "ปรับมือ", cls: "text-warn" },
  return: { label: "คืน", cls: "text-warn" },
  count: { label: "ผลนับ", cls: "text-muted" },
};

// timeline "สาวหาต้นตอ" — เหตุการณ์ที่กระทบสต๊อกในช่วงระหว่างนับ 2 ครั้ง
function DrillPanel({ data, loading }: { data?: LossDrilldown; loading: boolean }) {
  if (loading || !data) return (
    <div className="flex items-center gap-2 text-sm text-muted py-3 pl-6"><Loader2 className="w-4 h-4 animate-spin" /> กำลังไล่ย้อนเหตุการณ์…</div>
  );
  if (!data.ok) return <div className="text-sm text-danger py-3 pl-6">{data.error || "ดึงข้อมูลไม่สำเร็จ"}</div>;
  const events = data.events ?? [];
  return (
    <div className="rounded-lg border border-line bg-surface p-3 mt-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
        <span className="text-xs text-muted">ช่วง {data.from || "—"} → {data.to || "—"}</span>
        {(data.shifts ?? []).length > 0 && (
          <span className="text-xs text-muted">· เข้าเวร: {(data.shifts ?? []).map((s) => `${s.name} (${s.bills})`).join(" · ")}</span>
        )}
      </div>
      {events.length === 0 ? (
        <div className="text-sm text-muted py-2">ไม่มีเหตุการณ์ในช่วงนี้ (ของอาจหายก่อนช่วงนับ หรือยังไม่มีบิล)</div>
      ) : (
        <table className="w-full text-[12.5px] border-collapse">
          <tbody>
            {events.map((e, i) => {
              const k = KIND[e.kind] ?? KIND.adjust;
              return (
                <tr key={i} className={"border-t border-line-soft " + (e.flag ? "bg-warn-soft" : "")}>
                  <td className="py-1.5 pr-2 text-muted whitespace-nowrap align-top">{e.at}</td>
                  <td className="py-1.5 pr-2 whitespace-nowrap align-top">
                    <span className={"font-medium " + k.cls}>{k.label}</span>
                    {e.who && <div className="text-[11px] text-muted">{e.who}</div>}
                  </td>
                  <td className="py-1.5 pr-2 align-top text-ink">{e.detail}{e.flag && <span className="text-warn"> ⚠</span>}</td>
                  <td className="py-1.5 pl-2 text-right whitespace-nowrap align-top tabular-nums text-muted">{e.qty}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <p className="text-[11px] text-muted mt-2">แถวเหลือง = น่าสงสัย (ราคา 0 / ส่วนลดเต็ม / คืนไม่มีเลขอ้างอิง / ปรับมือติดลบ)</p>
    </div>
  );
}
