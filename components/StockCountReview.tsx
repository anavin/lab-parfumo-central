"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, X, Loader2, ClipboardCheck, RotateCcw } from "lucide-react";
import { branchName } from "@/lib/branches";
import { getStockCountLines, approveStockCount, rejectStockCount, reverseStockCount, type StockCount, type CountLine } from "@/lib/actions/stock-count";

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "รอตรวจ", cls: "bg-warn-soft text-warn-dark" },
  approved: { label: "อนุมัติแล้ว", cls: "bg-success-soft text-success" },
  rejected: { label: "ปฏิเสธ", cls: "bg-danger-soft text-danger" },
  reversed: { label: "ย้อนแล้ว", cls: "bg-line text-muted" },
};

export function StockCountReview({ counts }: { counts: StockCount[] }) {
  if (!counts.length) return <div className="card p-8 text-center text-sm text-muted">ยังไม่มีรายการนับสต๊อก</div>;
  return <div className="space-y-3">{counts.map((c) => <Card key={c.id} c={c} />)}</div>;
}

function Card({ c }: { c: StockCount }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<CountLine[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const st = STATUS[c.status] ?? STATUS.pending;

  const toggle = () => {
    const next = !open; setOpen(next);
    if (next && lines === null) { setLoading(true); getStockCountLines(c.id).then((l) => setLines(l)).finally(() => setLoading(false)); }
  };
  const run = (fn: () => Promise<any>) => start(async () => { setErr(null); const r = await fn(); if (r && !r.ok) setErr(r.error ?? "ทำรายการไม่สำเร็จ"); else router.refresh(); });

  // fat-finger guard: a mis-typed count posts a big stock adjustment — confirm first
  const approve = () => {
    const ls = lines ?? [];
    const totalAbs = ls.reduce((s, l) => s + Math.abs(Math.round(l.counted - l.expected)), 0);
    const maxOne = ls.reduce((m, l) => Math.max(m, Math.abs(Math.round(l.counted - l.expected))), 0);
    if ((totalAbs >= 100 || maxOne >= 50) && !confirm(`ผลนับมีส่วนต่างมาก (รวม ${totalAbs} ชิ้น, สูงสุด ${maxOne} ชิ้น/รายการ) — ยืนยันปรับสต๊อกตามนี้?`)) return;
    run(() => approveStockCount(c.id));
  };

  return (
    <div className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden">
      <button onClick={toggle} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-canvas/60 text-left">
        <ClipboardCheck className="w-5 h-5 text-brand-dark shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ink flex items-center gap-2">
            {branchName(c.branch)}
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium ${st.cls}`}>{st.label}</span>
          </div>
          <div className="text-[11px] text-muted">{c.created_at?.slice(0, 16).replace("T", " ")} · {c.counted_by_name ?? "-"} · {c.lines_count} รายการ{c.diff_count > 0 ? ` · ต่าง ${c.diff_count}` : " · ตรงทั้งหมด"}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-line-soft pt-3">
          {loading ? <div className="py-4 text-center text-sm text-muted"><Loader2 className="w-4 h-4 animate-spin inline" /></div> : (
            <>
              <div className="max-h-[50vh] overflow-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-muted border-b border-line-soft">
                    <th className="py-1.5 pr-2 font-semibold">สินค้า</th>
                    <th className="py-1.5 pr-2 font-semibold text-right">ระบบ</th>
                    <th className="py-1.5 pr-2 font-semibold text-right">นับได้</th>
                    <th className="py-1.5 font-semibold text-right">ส่วนต่าง</th>
                  </tr></thead>
                  <tbody>
                    {(lines ?? []).map((l) => {
                      const d = Math.round(l.counted - l.expected);
                      return (
                        <tr key={l.id} className="border-b border-line-soft last:border-0">
                          <td className="py-1.5 pr-2">{l.scent} <span className="text-muted text-xs">{l.size}</span></td>
                          <td className="py-1.5 pr-2 text-right tabular-nums text-muted">{Math.round(l.expected)}</td>
                          <td className="py-1.5 pr-2 text-right tabular-nums font-medium">{Math.round(l.counted)}</td>
                          <td className={`py-1.5 text-right tabular-nums font-semibold ${d === 0 ? "text-success" : d < 0 ? "text-danger" : "text-warn-dark"}`}>{d > 0 ? "+" : ""}{d || "0"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {c.review_note && <div className="text-[11px] text-muted mt-2">หมายเหตุตรวจ: {c.review_note}</div>}
              {err && <div className="text-xs text-danger mt-2">{err}</div>}
              {c.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <button onClick={approve} disabled={saving}
                    className="btn btn-brand flex-1">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} อนุมัติ + ปรับสต๊อก
                  </button>
                  <button onClick={() => { if (confirm("ปฏิเสธผลนับนี้?")) run(() => rejectStockCount(c.id)); }} disabled={saving}
                    className="btn btn-danger-outline">
                    <X className="w-4 h-4" /> ปฏิเสธ
                  </button>
                </div>
              )}
              {c.status === "approved" && (
                <div className="mt-3">
                  <button onClick={() => { if (confirm("ย้อนผลนับนี้?\nจะลบการปรับสต๊อกที่ใบนี้โพสต์ไว้ (สต๊อกกลับไปเท่าก่อนอนุมัติ) — ใช้กรณีอนุมัติผิด/ซ้ำ")) run(() => reverseStockCount(c.id)); }} disabled={saving}
                    className="btn btn-danger-outline">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} ย้อนผลนับ (ลบการปรับ)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
