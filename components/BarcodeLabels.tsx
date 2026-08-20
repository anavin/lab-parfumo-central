"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Printer, Minus, Plus, CheckSquare, Square, SquareMinus, ArrowLeft, Tag } from "lucide-react";
import { Barcode } from "@/components/Barcode";
import { baht } from "@/lib/format";

export type BarcodeRow = { id: number; barcode: string; scent: string; grade: string; size: string; sku: string; price: number };

const MAX_QTY = 100;

type SizeCfg = { key: string; label: string; w: number; barH: number; barW: number; brand: number; name: number; size: number; price: number };
// w = label width (mm); barH = barcode height (px); text sizes in pt (printed) / scaled for preview
const SIZES: SizeCfg[] = [
  { key: "sm", label: "เล็ก", w: 32, barH: 22, barW: 1.0, brand: 4.5, name: 6, size: 5.5, price: 7.5 },
  { key: "md", label: "กลาง", w: 40, barH: 30, barW: 1.3, brand: 5.5, name: 7.5, size: 6.5, price: 9.5 },
  { key: "lg", label: "ใหญ่", w: 50, barH: 38, barW: 1.6, brand: 6, name: 9, size: 7.5, price: 11 },
];

type Show = { brand: boolean; name: boolean; size: boolean; price: boolean };

// One label's content — shared by the live preview and the print sheet. Inline
// font-size uses px for the on-screen preview and pt for the printed labels.
function LabelContent({ p, show, cfg, preview }: { p: BarcodeRow; show: Show; cfg: SizeCfg; preview?: boolean }) {
  const fs = (pt: number) => (preview ? `${(pt * 1.7).toFixed(1)}px` : `${pt}pt`);
  return (
    <>
      {show.brand && <div className="lbl-brand" style={{ fontSize: fs(cfg.brand) }}>LAB PARFUMO</div>}
      {show.name && <div className="lbl-name" style={{ fontSize: fs(cfg.name) }}>{p.scent}</div>}
      {show.size && p.size && <div className="lbl-size" style={{ fontSize: fs(cfg.size) }}>{p.size}</div>}
      <Barcode value={p.barcode} height={preview ? Math.round(cfg.barH * 1.5) : cfg.barH} width={cfg.barW} fontSize={preview ? 12 : 9} margin={2} />
      {show.price && <div className="lbl-price" style={{ fontSize: fs(cfg.price) }}>{baht(p.price)}</div>}
    </>
  );
}

const SAMPLE: BarcodeRow = { id: -1, barcode: "8857128011188", scent: "Make Way", grade: "EDP", size: "50 ml.", sku: "", price: 1690 };

export function BarcodeLabels({ rows }: { rows: BarcodeRow[] }) {
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState<Record<number, number>>({});   // id -> label count (0/undefined = not selected)
  const [sizeKey, setSizeKey] = useState("md");
  const [show, setShow] = useState<Show>({ brand: true, name: true, size: true, price: true });
  const [bulk, setBulk] = useState("1");
  const cfg = SIZES.find((s) => s.key === sizeKey)!;
  const setShowKey = (k: keyof Show) => setShow((s) => ({ ...s, [k]: !s[k] }));

  const withBarcode = useMemo(() => rows.filter((r) => (r.barcode || "").trim()), [rows]);
  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return withBarcode;
    return withBarcode.filter((r) => [r.scent, r.barcode, r.sku, r.grade, r.size].some((v) => (v || "").toLowerCase().includes(t)));
  }, [withBarcode, query]);

  const setQ = (id: number, n: number) => setQty((o) => ({ ...o, [id]: Math.max(0, Math.min(MAX_QTY, n)) }));
  const toggle = (id: number) => setQty((o) => ({ ...o, [id]: o[id] ? 0 : 1 }));
  const clearAll = () => setQty({});

  const shownIds = filtered.map((r) => r.id);
  const allShownSelected = shownIds.length > 0 && shownIds.every((id) => (qty[id] ?? 0) > 0);
  const someShownSelected = shownIds.some((id) => (qty[id] ?? 0) > 0);
  const toggleAllShown = () => setQty((o) => {
    const n = { ...o };
    if (allShownSelected) shownIds.forEach((id) => { n[id] = 0; });
    else shownIds.forEach((id) => { if (!n[id]) n[id] = 1; });
    return n;
  });
  const setAllShown = () => {
    const v = Math.max(1, Math.min(MAX_QTY, parseInt(bulk || "1", 10) || 1));
    setQty((o) => { const n = { ...o }; shownIds.forEach((id) => { n[id] = v; }); return n; });
  };

  const selected = rows.filter((r) => (qty[r.id] ?? 0) > 0);
  const totalLabels = selected.reduce((s, r) => s + (qty[r.id] ?? 0), 0);
  const labels = selected.flatMap((r) => Array.from({ length: qty[r.id] ?? 0 }, () => r));
  const previewItem = selected[0] ?? filtered[0] ?? SAMPLE;

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium border transition ${active ? "bg-brand text-white border-brand" : "border-line text-ink hover:bg-canvas"}`;
  const check = (on: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition cursor-pointer select-none ${on ? "bg-brand-soft border-brand/30 text-brand-dark" : "border-line text-muted hover:bg-canvas"}`;

  return (
    <div>
      {/* ---------- screen UI (hidden while printing) ---------- */}
      <div className="print:hidden">
        <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-3">
          <ArrowLeft className="w-4 h-4" /> กลับหน้าสินค้า
        </Link>

        {/* settings + live preview */}
        <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-5">
          <div className="flex-1 space-y-4 min-w-0">
            <div>
              <div className="text-xs text-muted mb-1.5">ขนาดฉลาก</div>
              <div className="flex gap-2 flex-wrap">
                {SIZES.map((s) => (
                  <button key={s.key} onClick={() => setSizeKey(s.key)} className={chip(sizeKey === s.key)}>
                    {s.label} <span className="opacity-60 text-xs">{s.w}มม.</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1.5">แสดงบนฉลาก</div>
              <div className="flex gap-2 flex-wrap">
                {([["brand", "แบรนด์"], ["name", "ชื่อสินค้า"], ["size", "ขนาด"], ["price", "ราคา"]] as [keyof Show, string][]).map(([k, label]) => (
                  <button key={k} onClick={() => setShowKey(k)} className={check(show[k])}>
                    {show[k] ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />} {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* live preview */}
          <div className="sm:w-52 flex flex-col items-center shrink-0">
            <div className="text-[11px] text-muted mb-1.5">ตัวอย่างฉลาก</div>
            <div className="lbl-preview" style={{ width: Math.round(cfg.w * 4.4) }}>
              <LabelContent p={previewItem} show={show} cfg={cfg} preview />
            </div>
            <div className="text-[10px] text-muted-soft mt-1.5">ขนาดจริง {cfg.w}มม.</div>
          </div>
        </div>

        {/* search + selection controls */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหากลิ่น / บาร์โค้ด / SKU"
              className="w-full border border-line rounded-lg pl-9 pr-3 py-2 text-sm bg-surface focus:outline-none focus:border-brand" />
          </div>
          <button onClick={toggleAllShown} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-sm text-ink hover:bg-canvas shrink-0">
            {allShownSelected ? <CheckSquare className="w-4 h-4 text-brand-dark" /> : <Square className="w-4 h-4 text-muted" />}
            {allShownSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
          </button>
          <button onClick={clearAll} className="px-3 py-2 rounded-lg border border-line text-sm text-muted hover:bg-canvas shrink-0">ล้าง</button>
          <div className="inline-flex items-center rounded-lg border border-line overflow-hidden shrink-0">
            <span className="px-2.5 text-xs text-muted">ตั้งทุกแถว</span>
            <input inputMode="numeric" value={bulk} onChange={(e) => setBulk(e.target.value.replace(/\D/g, "").slice(0, 3))}
              className="w-12 text-center py-2 text-sm tabular-nums outline-none border-l border-line" />
            <button onClick={setAllShown} className="px-3 py-2 text-sm font-medium text-brand-dark hover:bg-canvas border-l border-line">ตั้ง</button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
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
                          <button onClick={() => setQ(r.id, n - 1)} disabled={!on} className="w-9 h-9 rounded-md border border-line text-muted hover:bg-canvas disabled:opacity-30 flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                          <input inputMode="numeric" value={n || ""} placeholder="0"
                            onChange={(e) => setQ(r.id, parseInt(e.target.value.replace(/\D/g, "") || "0", 10))}
                            className="w-12 text-center border border-line rounded-md py-1 text-sm tabular-nums" />
                          <button onClick={() => setQ(r.id, (n || 0) + 1)} className="w-9 h-9 rounded-md border border-line text-muted hover:bg-canvas flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
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

        {/* sticky action bar */}
        <div className="sticky bottom-0 -mx-4 sm:mx-0 mt-4 px-4 sm:px-4 py-3 bg-canvas/95 backdrop-blur border-t border-line flex items-center gap-3 sm:rounded-b-xl">
          <div className="text-sm text-muted">เลือก <b className="text-ink tabular-nums">{selected.length}</b> รายการ · <b className="text-ink tabular-nums">{totalLabels}</b> ฉลาก · ขนาด{cfg.label}</div>
          <button onClick={() => window.print()} disabled={!totalLabels}
            className="btn btn-brand ml-auto disabled:opacity-40 shadow-sm">
            <Printer className="w-4 h-4" /> พิมพ์ฉลาก ({totalLabels})
          </button>
        </div>
      </div>

      {/* ---------- print sheet (only visible when printing) ---------- */}
      <div className="hidden print:block">
        <div className="print-sheet">
          {labels.map((r, i) => (
            <div key={i} className="label"><LabelContent p={r} show={show} cfg={cfg} /></div>
          ))}
        </div>
      </div>

      {/* shared label typography (preview + print) + print layout */}
      <style>{`
        .lbl-brand { letter-spacing: .08em; color: #7a4f27; font-weight: 700; line-height: 1.1; }
        .lbl-name { font-weight: 700; line-height: 1.05; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lbl-size { color: #6b6357; line-height: 1.1; }
        .lbl-price { font-weight: 800; color: #2a2018; }
        .lbl-preview { border: 1px dashed #d8cdbc; border-radius: 8px; background: #fff; padding: 8px 6px; text-align: center; }
        .lbl-preview > * + *, .label > * + * { margin-top: 2px; }
        .lbl-preview svg, .label svg { display: block; margin: 1px auto 0; max-width: 100%; }
        @media print {
          @page { margin: 8mm; }
          /* inline-block flow (not flex) so browsers honor break-inside: a label
             that would cross the page edge moves whole to the next sheet. */
          .print-sheet { display: block; font-size: 0; }
          .label {
            display: inline-block; vertical-align: top; box-sizing: border-box;
            width: ${cfg.w}mm; margin: 0 1.2mm 2.5mm 0; padding: 1.5mm 1mm; text-align: center;
            border: 0.2mm dashed #ccc; border-radius: 1mm;
            break-inside: avoid; page-break-inside: avoid; -webkit-column-break-inside: avoid;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
