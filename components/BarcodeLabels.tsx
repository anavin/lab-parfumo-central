"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Printer, Minus, Plus, CheckSquare, Square, SquareMinus, ArrowLeft, Tag } from "lucide-react";
import { Barcode } from "@/components/Barcode";
import { baht } from "@/lib/format";

export type BarcodeRow = { id: number; barcode: string; scent: string; grade: string; size: string; sku: string; price: number };

const MAX_QTY = 100;

export function BarcodeLabels({ rows }: { rows: BarcodeRow[] }) {
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState<Record<number, number>>({});   // id -> label count (0/undefined = not selected)
  const [showName, setShowName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);

  const withBarcode = useMemo(() => rows.filter((r) => (r.barcode || "").trim()), [rows]);
  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return withBarcode;
    return withBarcode.filter((r) => [r.scent, r.barcode, r.sku, r.grade, r.size].some((v) => (v || "").toLowerCase().includes(t)));
  }, [withBarcode, query]);

  const setQ = (id: number, n: number) => setQty((o) => ({ ...o, [id]: Math.max(0, Math.min(MAX_QTY, n)) }));
  const toggle = (id: number) => setQty((o) => ({ ...o, [id]: o[id] ? 0 : 1 }));
  const clearAll = () => setQty({});

  // select-all over the currently shown (filtered) rows — toggles them on/off
  const shownIds = filtered.map((r) => r.id);
  const allShownSelected = shownIds.length > 0 && shownIds.every((id) => (qty[id] ?? 0) > 0);
  const someShownSelected = shownIds.some((id) => (qty[id] ?? 0) > 0);
  const toggleAllShown = () => setQty((o) => {
    const n = { ...o };
    if (allShownSelected) shownIds.forEach((id) => { n[id] = 0; });
    else shownIds.forEach((id) => { if (!n[id]) n[id] = 1; });
    return n;
  });

  const selected = rows.filter((r) => (qty[r.id] ?? 0) > 0);
  const totalLabels = selected.reduce((s, r) => s + (qty[r.id] ?? 0), 0);
  // expand selection into one entry per physical label
  const labels = selected.flatMap((r) => Array.from({ length: qty[r.id] ?? 0 }, () => r));

  return (
    <div>
      {/* ---------- screen UI (hidden while printing) ---------- */}
      <div className="print:hidden">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink shrink-0">
            <ArrowLeft className="w-4 h-4" /> กลับหน้าสินค้า
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหากลิ่น / บาร์โค้ด / SKU"
              className="w-full border border-line rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:border-brand" />
          </div>
          <button onClick={toggleAllShown} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-sm text-ink hover:bg-canvas shrink-0">
            {allShownSelected ? <CheckSquare className="w-4 h-4 text-brand-dark" /> : <Square className="w-4 h-4 text-muted" />}
            {allShownSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
          </button>
          <button onClick={clearAll} className="px-3 py-2 rounded-lg border border-line text-sm text-muted hover:bg-canvas shrink-0">ล้าง</button>
        </div>

        <div className="flex items-center gap-4 mb-4 text-sm flex-wrap">
          <label className="inline-flex items-center gap-2 cursor-pointer text-ink">
            <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} className="accent-brand w-4 h-4" /> แสดงชื่อสินค้า
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer text-ink">
            <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="accent-brand w-4 h-4" /> แสดงราคา
          </label>
          <span className="text-muted ml-auto">เลือก {selected.length} รายการ · {totalLabels} ฉลาก</span>
          <button onClick={() => window.print()} disabled={!totalLabels}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-40 shrink-0">
            <Printer className="w-4 h-4" /> พิมพ์ฉลาก ({totalLabels})
          </button>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-canvas sticky top-0 z-10">
                <tr className="th border-b border-line-soft text-left">
                  <th className="px-3 py-2.5 w-10">
                    <button onClick={toggleAllShown} aria-label={allShownSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"} className="align-middle">
                      {allShownSelected ? <CheckSquare className="w-5 h-5 text-brand-dark" /> : someShownSelected ? <SquareMinus className="w-5 h-5 text-brand-dark" /> : <Square className="w-5 h-5 text-muted" />}
                    </button>
                  </th>
                  <th className="px-3 py-2.5">สินค้า</th>
                  <th className="px-3 py-2.5">บาร์โค้ด</th>
                  <th className="px-3 py-2.5 text-right">ราคา</th>
                  <th className="px-3 py-2.5 text-center">จำนวนฉลาก</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const n = qty[r.id] ?? 0;
                  const on = n > 0;
                  return (
                    <tr key={r.id} className={`border-b border-line-soft last:border-0 ${on ? "bg-brand-soft/40" : ""}`}>
                      <td className="px-3 py-2 align-middle">
                        <button onClick={() => toggle(r.id)} aria-label="เลือก" className="text-brand-dark">
                          {on ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-muted" />}
                        </button>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="font-medium text-ink">{r.scent}</div>
                        <div className="text-xs text-muted">{[r.size, r.grade, r.sku].filter(Boolean).join(" · ")}</div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <Barcode value={r.barcode} height={34} width={1.3} fontSize={12} margin={2} />
                      </td>
                      <td className="px-3 py-2 align-middle text-right tabular-nums text-ink whitespace-nowrap">{baht(r.price)}</td>
                      <td className="px-3 py-2 align-middle">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setQ(r.id, n - 1)} disabled={!on} className="w-7 h-7 rounded-md border border-line text-muted hover:bg-canvas disabled:opacity-30 flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                          <input inputMode="numeric" value={n || ""} placeholder="0"
                            onChange={(e) => setQ(r.id, parseInt(e.target.value.replace(/\D/g, "") || "0", 10))}
                            className="w-12 text-center border border-line rounded-md py-1 text-sm tabular-nums" />
                          <button onClick={() => setQ(r.id, (n || 0) + 1)} className="w-7 h-7 rounded-md border border-line text-muted hover:bg-canvas flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-muted">
                    {withBarcode.length === 0 ? "ยังไม่มีสินค้าที่มีบาร์โค้ด — เพิ่มบาร์โค้ดได้ที่หน้าสินค้า" : "ไม่พบสินค้าที่ค้นหา"}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {rows.length !== withBarcode.length && (
          <p className="text-xs text-muted mt-3 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" /> มีสินค้า {rows.length - withBarcode.length} รายการที่ยังไม่มีบาร์โค้ด (ไม่แสดงที่นี่) — เพิ่มได้ที่ <Link href="/products" className="text-brand-dark underline">หน้าสินค้า</Link>
          </p>
        )}
      </div>

      {/* ---------- print sheet (only visible when printing) ---------- */}
      <div className="hidden print:block">
        <div className="print-sheet">
          {labels.map((r, i) => (
            <div key={i} className="label">
              {showName && <div className="label-name">{r.scent}{r.size ? ` · ${r.size}` : ""}</div>}
              <Barcode value={r.barcode} height={42} width={1.5} fontSize={13} margin={2} />
              {showPrice && <div className="label-price">{baht(r.price)}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* print styles: show only the label sheet, tile labels for sticker paper */}
      <style>{`
        @media print {
          @page { margin: 8mm; }
          /* inline-block flow (not flex): browsers honor break-inside far more
             reliably here, so a label that would hit the page edge is pushed
             whole onto the next sheet instead of being sliced. font-size:0 kills
             the whitespace gaps between inline-block items. */
          .print-sheet { display: block; font-size: 0; }
          .label {
            display: inline-block; vertical-align: top;
            width: 48mm; box-sizing: border-box; margin: 0 1.5mm 3mm 0; padding: 2mm 1.5mm; text-align: center;
            border: 0.2mm dashed #bbb; border-radius: 1mm;
            break-inside: avoid; page-break-inside: avoid; -webkit-column-break-inside: avoid;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .label-name { font-size: 9pt; font-weight: 600; margin-bottom: 1mm; line-height: 1.1;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .label-price { font-size: 10pt; font-weight: 700; margin-top: 0.5mm; }
          .label svg { display: block; margin: 0 auto; max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
