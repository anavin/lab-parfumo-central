"use client";
import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, UploadCloud, Loader2, Barcode } from "lucide-react";
import { num } from "@/lib/format";
import { branchName } from "@/lib/branches";
import { applyCapturesToSystem } from "@/lib/actions/stock-count";

export type ShelfRow = { barcode: string; scent: string; size: string; captured: number; remaining: number; skuInStock: number; skus: string[] };

// หน้า "สต็อกหน้าร้าน": เช็คข้อมูลที่เก็บ (นับได้ต่อสินค้า + SKU) เทียบกับระบบปัจจุบัน
// แล้วกดปุ่มเดียว "อัปเดตเข้าระบบทั้งหมด" ให้ทั้งระบบใช้ข้อมูลชุดเดียวกัน (ลง SKU + ปรับยอด)
export function ShelfStockReview({ rows, branch, canApply }: { rows: ShelfRow[]; branch: string | null; canApply: boolean }) {
  const router = useRouter();
  const [qText, setQText] = useState("");
  const [open, setOpen] = useState<string | null>(null);   // expanded barcode
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const stats = useMemo(() => {
    let bottles = 0, match = 0, diff = 0;
    for (const r of rows) { bottles += r.captured; if (r.captured === r.remaining) match++; else diff++; }
    return { bottles, products: rows.length, match, diff };
  }, [rows]);

  const shown = useMemo(() => {
    const t = qText.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => r.scent.toLowerCase().includes(t) || r.barcode.includes(t) || r.skus.some((s) => s.toLowerCase().includes(t)));
  }, [rows, qText]);

  const apply = async () => {
    if (!branch || busy) return;
    if (!confirm(`อัปเดตข้อมูลที่เก็บ (${num(stats.bottles)} ขวด · ${num(stats.products)} สินค้า) เข้าระบบทั้งหมด?\n\n• ลงทะเบียน SKU ทุกตัวเป็นสต็อกจริง\n• ปรับยอดคงเหลือให้ = จำนวนที่นับ\n\nแนะนำทำตอนร้านไม่ขาย · ย้อนกลับได้ที่หน้าตรวจนับสต๊อก`)) return;
    setBusy(true); setResult(null);
    const r = await applyCapturesToSystem(branch); setBusy(false);
    if (r.ok) { setResult(`✓ อัปเดตเข้าระบบแล้ว — SKU ใหม่ ${num(r.added || 0)} · มีอยู่แล้ว ${num(r.already || 0)} · ติดธง ${num(r.flagged || 0)} · ปรับยอด ${num(r.products || 0)} สินค้า (ใบนับ #${r.countId})`); router.refresh(); }
    else setResult(`✗ ${r.error ?? "ไม่สำเร็จ"}`);
  };

  if (!rows.length) return (
    <div className="rounded-xl border border-line bg-surface p-10 text-center text-sm text-muted">
      ยังไม่มีข้อมูลที่เก็บ{branch ? ` ของ${branchName(branch)}` : ""} — ให้เก็บที่หน้า นับสต๊อก → แท็บ “เก็บข้อมูลใหม่” ก่อน
    </div>
  );

  return (
    <div className="space-y-4">
      {/* summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-xl border border-line bg-surface p-3"><div className="text-xs text-muted">ขวดที่นับ</div><div className="text-2xl font-bold tabular-nums text-ink mt-0.5">{num(stats.bottles)}</div></div>
        <div className="rounded-xl border border-line bg-surface p-3"><div className="text-xs text-muted">สินค้า</div><div className="text-2xl font-bold tabular-nums text-ink mt-0.5">{num(stats.products)}</div></div>
        <div className="rounded-xl border border-line bg-surface p-3"><div className="text-xs text-success">ตรงกับระบบ</div><div className="text-2xl font-bold tabular-nums text-success mt-0.5">{num(stats.match)}</div></div>
        <div className="rounded-xl border border-line bg-surface p-3"><div className="text-xs text-warn">ยอดต่าง</div><div className="text-2xl font-bold tabular-nums text-warn mt-0.5">{num(stats.diff)}</div></div>
      </div>

      {/* apply bar */}
      {canApply && (
        <div className="rounded-xl border border-brand/40 bg-brand-soft/20 p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-ink">อัปเดตเข้าระบบทั้งหมด</div>
              <div className="text-[12px] text-muted">ลง SKU ทุกตัว + ปรับยอดคงเหลือให้ = ที่นับ → ทั้งระบบใช้ข้อมูลชุดนี้ (ย้อนได้)</div>
            </div>
            <button onClick={apply} disabled={busy || !branch}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gold text-white text-sm font-semibold px-4 py-2.5 hover:bg-gold-dark disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />} อัปเดตเข้าระบบ
            </button>
          </div>
          {result && <div className="mt-2 text-[13px] rounded-lg px-3 py-2 bg-surface border border-line text-ink">{result}</div>}
          <p className="mt-2 text-[11px] text-muted">แนะนำทำตอนร้านไม่ขาย (เช้าก่อนเปิด) ยอดจะแม่นสุด · ปรับเฉพาะสินค้าที่นับ · ย้อนกลับได้ที่หน้า ตรวจนับสต๊อก</p>
        </div>
      )}

      {/* search */}
      <div className="relative">
        <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="ค้นหากลิ่น / บาร์โค้ด / SKU"
          className="w-full sm:w-72 pl-8 pr-3 py-2 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-brand" />
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-canvas text-muted text-left">
            <th className="px-3 py-2 font-medium">สินค้า</th>
            <th className="px-3 py-2 font-medium text-right">นับได้</th>
            <th className="px-3 py-2 font-medium text-right">ยอดระบบ</th>
            <th className="px-3 py-2 font-medium text-right">ต่าง</th>
            <th className="px-3 py-2 font-medium text-right">SKU</th>
          </tr></thead>
          <tbody>
            {shown.map((r) => {
              const d = r.captured - r.remaining;
              const isOpen = open === r.barcode;
              return (
                <Fragment key={r.barcode}>
                  <tr className="border-t border-line-soft hover:bg-canvas/40 cursor-pointer" onClick={() => setOpen(isOpen ? null : r.barcode)}>
                    <td className="px-3 py-2 text-ink">
                      <div className="flex items-center gap-1.5">
                        <ChevronDown className={"w-3.5 h-3.5 text-muted transition-transform " + (isOpen ? "rotate-180" : "")} />
                        <span className="font-medium">{r.scent}</span> <span className="text-muted">{r.size}</span>
                      </div>
                      <div className="font-mono text-[10px] text-muted-soft ml-5">{r.barcode}</div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-ink">{num(r.captured)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted">{num(r.remaining)}</td>
                    <td className={"px-3 py-2 text-right tabular-nums font-medium " + (d === 0 ? "text-success" : "text-warn-dark")}>{d === 0 ? "✓" : (d > 0 ? `+${num(d)}` : num(d))}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted">{num(r.skus.length)}</td>
                  </tr>
                  {isOpen && (
                    <tr className="border-t border-line-soft bg-canvas/30">
                      <td colSpan={5} className="px-3 py-2">
                        <div className="text-[11px] text-muted mb-1 flex items-center gap-1"><Barcode className="w-3.5 h-3.5" /> SKU ที่เก็บ ({num(r.skus.length)}):</div>
                        <div className="flex flex-wrap gap-1">
                          {r.skus.map((s) => <span key={s} className="font-mono text-[11px] bg-surface border border-line rounded px-1.5 py-0.5 text-ink">{s}</span>)}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {shown.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-muted">ไม่พบ</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted leading-relaxed">
        <b className="text-ink">นับได้</b> = จำนวนที่เก็บหน้าชั้น · <b className="text-ink">ยอดระบบ</b> = คงเหลือในระบบตอนนี้ ·
        <span className="text-warn-dark"> ต่าง</span> = ส่วนต่างที่จะปรับเมื่อกดอัปเดต · แตะแถวเพื่อดู SKU ทั้งหมด
      </p>
    </div>
  );
}
