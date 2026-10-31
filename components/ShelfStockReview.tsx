"use client";
import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, UploadCloud, Loader2, Barcode, Scissors, Undo2 } from "lucide-react";
import { num } from "@/lib/format";
import { branchName } from "@/lib/branches";
import { applyCapturesToSystem } from "@/lib/actions/stock-count";
import { reconcileSkusToStock, undoGuessedSkuCuts } from "@/lib/actions/shelf-capture";

export type ShelfRow = { barcode: string; scent: string; size: string; captured: number; remaining: number; skuInStock: number; soldToday: number; skus: string[] };
export type MissingRow = { barcode: string; scent: string; size: string; remaining: number };

const thDate = (ymd: string | null) => { if (!ymd) return ""; const [y, m, d] = ymd.split("-"); return `${d}/${m}/${+y + 543}`; };

// หน้า "สต็อกหน้าร้าน": เช็คข้อมูลที่เก็บ (นับได้ต่อสินค้า + SKU) เทียบกับระบบปัจจุบัน
// แล้วกดปุ่มเดียว "อัปเดตเข้าระบบทั้งหมด" ให้ทั้งระบบใช้ข้อมูลชุดเดียวกัน (ลง SKU + ปรับยอด)
export function ShelfStockReview({ rows, branch, canApply, captureDate, missing = [], phantomTotal = 0, guessedCut = 0 }: { rows: ShelfRow[]; branch: string | null; canApply: boolean; captureDate: string | null; missing?: MissingRow[]; phantomTotal?: number; guessedCut?: number }) {
  const router = useRouter();
  const [qText, setQText] = useState("");
  const [open, setOpen] = useState<string | null>(null);   // expanded barcode
  const [showMissing, setShowMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [asOf, setAsOf] = useState(true);   // คิดยอด ณ วันที่นับ (กันบวกยอดขายวันนี้กลับ)
  const [zeroMissing, setZeroMissing] = useState(false);   // ตั้งสินค้าที่ไม่ได้นับเป็น 0
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const missingTotal = useMemo(() => missing.reduce((s, m) => s + m.remaining, 0), [missing]);

  // ตัด SKU ส่วนเกิน (in_stock เกินยอดคงเหลือจริง) = ขายไปแล้วยังไม่ตัด (ผีเก่า + ขายวันนี้)
  const syncSkus = async () => {
    if (!branch || syncBusy) return;
    if (!confirm(`ตัด SKU ส่วนเกิน ${num(phantomTotal)} ตัว ที่เกินยอดคงเหลือจริง (= ขายไปแล้วยังไม่ตัด SKU)?\n\nทำให้จำนวน SKU = ยอดคงเหลือทุกสินค้า · ตัด serial เท่านั้น ไม่กระทบยอดคงเหลือ\n\n⚠ นี่คือการ "เดา" (ตัดตัวเก่าสุด) ไม่รู้ serial จริง — ถ้าอยากตรงตัวจริง ให้ใส่ SKU รายบิลที่ /review หรือหน้าขายแทน`)) return;
    setSyncBusy(true); setSyncMsg(null);
    const r = await reconcileSkusToStock(branch); setSyncBusy(false);
    if (r.ok) { setSyncMsg(`✓ ตัด SKU ส่วนเกิน ${num(r.cleared || 0)} ตัว · เหลือ in_stock ${num(r.kept || 0)}`); router.refresh(); }
    else setSyncMsg(`✗ ${r.error ?? "ไม่สำเร็จ"}`);
  };
  // คืน SKU ที่ตัดแบบเดา (ไม่ผูกบิล) → กลับ in_stock เพื่อไปใส่ SKU จริงรายบิล
  const undoCuts = async () => {
    if (!branch || syncBusy) return;
    if (!confirm(`คืน SKU ที่ตัดแบบเดา ${num(guessedCut)} ตัว กลับเป็น in_stock?\n\n(เฉพาะที่ตัดแบบเดา/ตัดเอง ไม่ผูกบิล — ที่ขายจริงผ่านการสแกน/ใส่รายบิล จะไม่ถูกแตะ)\nหลังคืน: SKU จะเกินยอดตามจริง → ไปใส่ SKU จริงรายบิลที่ /review หรือหน้าขาย`)) return;
    setSyncBusy(true); setSyncMsg(null);
    const r = await undoGuessedSkuCuts(branch); setSyncBusy(false);
    if (r.ok) { setSyncMsg(`✓ คืน SKU ${num(r.restored || 0)} ตัวกลับ in_stock แล้ว — ไปใส่ SKU จริงรายบิลได้เลย`); router.refresh(); }
    else setSyncMsg(`✗ ${r.error ?? "ไม่สำเร็จ"}`);
  };

  const stats = useMemo(() => {
    let bottles = 0, match = 0, diff = 0, soldToday = 0;
    for (const r of rows) { bottles += r.captured; soldToday += r.soldToday; if (r.captured === r.remaining) match++; else diff++; }
    return { bottles, products: rows.length, match, diff, soldToday };
  }, [rows]);

  const shown = useMemo(() => {
    const t = qText.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => r.scent.toLowerCase().includes(t) || r.barcode.includes(t) || r.skus.some((s) => s.toLowerCase().includes(t)));
  }, [rows, qText]);

  const apply = async () => {
    if (!branch || busy) return;
    const asOfLine = asOf && captureDate ? `• ปรับยอด = จำนวนที่นับ หักยอดขายหลัง ${thDate(captureDate)} แล้ว (ยอดขายวันนี้ไม่ถูกบวกกลับ)` : `• ปรับยอดคงเหลือให้ = จำนวนที่นับ`;
    const zeroLine = zeroMissing && missing.length ? `\n• ตั้งสินค้าที่ไม่ได้นับ ${num(missing.length)} รายการ (รวม ${num(missingTotal)} ชิ้น) เป็น 0` : "";
    if (!confirm(`อัปเดตข้อมูลที่เก็บ (${num(stats.bottles)} ขวด · ${num(stats.products)} สินค้า) เข้าระบบทั้งหมด?\n\n• ลงทะเบียน SKU ทุกตัวเป็นสต็อกจริง\n${asOfLine}${zeroLine}\n\nย้อนกลับได้ที่หน้าตรวจนับสต๊อก`)) return;
    setBusy(true); setResult(null);
    const r = await applyCapturesToSystem(branch, asOf && captureDate ? captureDate : undefined, zeroMissing); setBusy(false);
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="rounded-xl border border-line bg-surface p-3"><div className="text-xs text-muted">ขวดที่นับ</div><div className="text-2xl font-bold tabular-nums text-ink mt-0.5">{num(stats.bottles)}</div></div>
        <div className="rounded-xl border border-line bg-surface p-3"><div className="text-xs text-muted">สินค้า</div><div className="text-2xl font-bold tabular-nums text-ink mt-0.5">{num(stats.products)}</div></div>
        <div className="rounded-xl border border-line bg-surface p-3"><div className="text-xs text-success">ตรงกับระบบ</div><div className="text-2xl font-bold tabular-nums text-success mt-0.5">{num(stats.match)}</div></div>
        <div className="rounded-xl border border-line bg-surface p-3"><div className="text-xs text-warn">ยอดต่าง</div><div className="text-2xl font-bold tabular-nums text-warn mt-0.5">{num(stats.diff)}</div></div>
        <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-3"><div className="text-xs text-amber-700">ขายวันนี้</div><div className="text-2xl font-bold tabular-nums text-amber-700 mt-0.5">{num(stats.soldToday)}</div></div>
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
          {captureDate && (
            <label className="mt-2 flex items-center gap-2 text-[12px] text-ink cursor-pointer select-none">
              <input type="checkbox" checked={asOf} onChange={(e) => setAsOf(e.target.checked)} className="accent-brand w-4 h-4" />
              คิดยอด <b>ณ วันที่นับ ({thDate(captureDate)})</b> — หักยอดขายหลังวันนับออก เพื่อไม่ให้ยอดขายวันนี้ถูกบวกกลับ {stats.soldToday > 0 && <span className="text-amber-700">(ขายหลังวันนับ {num(stats.soldToday)} ชิ้น)</span>}
            </label>
          )}
          {missing.length > 0 && (
            <label className="mt-1.5 flex items-start gap-2 text-[12px] text-ink cursor-pointer select-none">
              <input type="checkbox" checked={zeroMissing} onChange={(e) => setZeroMissing(e.target.checked)} className="accent-brand w-4 h-4 mt-0.5" />
              <span>ตั้ง<b>สินค้าที่ไม่ได้นับเป็น 0</b> ({num(missing.length)} รายการ · {num(missingTotal)} ชิ้น) — ติ๊กเมื่อนับครบทั้งร้าน (ของที่ไม่อยู่บนชั้น = หมด) · <button type="button" onClick={(e) => { e.preventDefault(); setShowMissing((v) => !v); }} className="text-brand-dark underline">ดูรายการ</button></span>
            </label>
          )}
          {result && <div className="mt-2 text-[13px] rounded-lg px-3 py-2 bg-surface border border-line text-ink">{result}</div>}
          <p className="mt-2 text-[11px] text-muted">ปรับเฉพาะสินค้าที่นับ · ย้อนกลับได้ที่หน้า ตรวจนับสต๊อก · {asOf && captureDate ? "โหมดนี้ปลอดภัยแม้ทำระหว่างวัน" : "ถ้าไม่ติ๊ก ควรทำตอนร้านไม่ขาย"}</p>
        </div>
      )}

      {/* ซิงก์ SKU ให้ตรงยอด — ตัด SKU ส่วนเกิน (ขายแล้วยังไม่ตัด: ผีเก่า + ขายวันนี้) */}
      {canApply && phantomTotal > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/50 p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-amber-800">ซิงก์ SKU ให้ตรงยอด</div>
              <div className="text-[12px] text-amber-700">มี SKU ค้าง <b>{num(phantomTotal)}</b> ตัว ที่เกินยอดคงเหลือจริง (ขายไปแล้วยังไม่ตัด SKU) → ตัดออกให้ SKU = ยอดคงเหลือทุกสินค้า</div>
            </div>
            <button onClick={syncSkus} disabled={syncBusy || !branch}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 hover:bg-amber-700 disabled:opacity-50">
              {syncBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />} ตัด SKU ส่วนเกิน ({num(phantomTotal)})
            </button>
          </div>
          {syncMsg && <div className="mt-2 text-[13px] rounded-lg px-3 py-2 bg-surface border border-line text-ink">{syncMsg}</div>}
          <p className="mt-2 text-[11px] text-amber-700/80">ตัด serial เท่านั้น ไม่กระทบยอดคงเหลือ (บิลตัดยอดไปแล้ว) · ตัดตัวเก่าสุดก่อน · <b>แม่นกว่า:</b> ใส่ SKU จริงรายบิลที่ /review หรือหน้าขาย</p>
        </div>
      )}

      {/* undo guessed cuts → restore for exact per-bill SKU entry */}
      {canApply && guessedCut > 0 && (
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-ink">คืน SKU ที่ตัดแบบเดา</div>
              <div className="text-[12px] text-muted">มี SKU ถูกตัดแบบเดา/ตัดเอง (ไม่ผูกบิล) <b>{num(guessedCut)}</b> ตัว → คืนกลับ in_stock เพื่อไปใส่ SKU จริงรายบิล (serial ตรงตัว)</div>
            </div>
            <button onClick={undoCuts} disabled={syncBusy || !branch}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line text-sm font-medium px-4 py-2.5 text-ink hover:bg-canvas disabled:opacity-50">
              {syncBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />} คืน SKU ({num(guessedCut)})
            </button>
          </div>
          {phantomTotal === 0 && syncMsg && <div className="mt-2 text-[13px] rounded-lg px-3 py-2 bg-canvas border border-line text-ink">{syncMsg}</div>}
        </div>
      )}

      {/* uncaptured-but-in-system review */}
      {missing.length > 0 && showMissing && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/40 overflow-hidden">
          <div className="px-3 py-2 text-[12px] font-semibold text-amber-800 border-b border-amber-200">
            สินค้าที่ไม่ได้นับ แต่ระบบยังมีสต๊อก — {num(missing.length)} รายการ · {num(missingTotal)} ชิ้น
            <span className="font-normal text-amber-700"> (ถ้าติ๊ก “ตั้งเป็น 0” ตัวพวกนี้จะถูกตั้งเป็น 0)</span>
          </div>
          <div className="max-h-72 overflow-auto divide-y divide-amber-200/60">
            {missing.map((m) => (
              <div key={m.barcode} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <span className="flex-1 min-w-0 truncate text-ink">{m.scent} <span className="text-muted">{m.size}</span> <span className="font-mono text-[10px] text-muted-soft">{m.barcode}</span></span>
                <span className="tabular-nums text-amber-800 font-medium shrink-0">ระบบมี {num(m.remaining)}</span>
              </div>
            ))}
          </div>
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
                  <tr className={"border-t border-line-soft cursor-pointer " + (r.soldToday > 0 ? "bg-amber-50/60 hover:bg-amber-50" : "hover:bg-canvas/40")} onClick={() => setOpen(isOpen ? null : r.barcode)}>
                    <td className={"px-3 py-2 text-ink " + (r.soldToday > 0 ? "border-l-2 border-amber-400" : "")}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <ChevronDown className={"w-3.5 h-3.5 text-muted transition-transform " + (isOpen ? "rotate-180" : "")} />
                        <span className="font-medium">{r.scent}</span> <span className="text-muted">{r.size}</span>
                        {r.soldToday > 0 && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 rounded-full px-1.5 py-0.5">🔸 ขายวันนี้ {num(r.soldToday)}</span>}
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
        <span className="text-warn-dark"> ต่าง</span> = ส่วนต่างที่จะปรับเมื่อกดอัปเดต · <span className="text-amber-700">🔸 แถวเหลือง</span> = มีขายวันนี้ (เฝ้าดู SKU ให้ตรง) · แตะแถวเพื่อดู SKU ทั้งหมด
      </p>
    </div>
  );
}
