import { fmtDate, num } from "@/lib/format";
import { Barcode } from "@/components/Barcode";

// Shared requisition document — rendered identically in the on-screen preview
// (requisitions/[id]) AND the standalone print page (print/requisition/[id]), so
// what you see is exactly what prints/saves to PDF. The item list is paginated into
// real A4 pages (each .req-sheet = one printed sheet) so the preview shows, page by
// page, exactly what lands on each sheet.
export type SheetPO = {
  po_number: string; version: string | null; order_date: string; status: string;
  branch_label: string; store_no: string | null; delivery_number: string | null;
};
export type SheetItem = {
  barcode: string | null; scent: string | null; size: string | null; qty: number;
  grade: string | null; sku: string | null; received_qty: number | null; line_remark: string | null;
};

// rows per A4 page (kept conservative so a page never overflows to a blank one). Page 1
// carries the full header so it holds fewer; the LAST page also reserves FOOTER_ROWS of
// space for the summary box + signatures.
const CAP_P1 = 18;        // page 1 (full header), not the last page — sized for the 257mm content area
const CAP_PN = 21;        // continuation page (compact header), not the last page
const FOOTER_ROWS = 12;   // rows-equivalent space the summary + notes + signatures (with date line) need on the last page

export function RequisitionSheet({ po, items }: { po: SheetPO; items: SheetItem[] }) {
  const totalQty = items.reduce((s, i) => s + Number(i.qty || 0), 0);
  const received = po.status === "received";
  const totalRecv = items.reduce((s, i) => s + Number(i.received_qty ?? i.qty ?? 0), 0);
  const hasDiff = received && items.some((i) => i.received_qty != null && Number(i.received_qty) !== Number(i.qty));

  // Order the sheet by grade in a FIXED order (EDP → EDP+ → EDT → Le Parfum → everything else
  // last) → largest size first → scent A→Z.
  const GRADE_ORDER = ["EDP", "EDP+", "EDT", "LE PARFUM"];
  const gradeRank = (g: string | null) => {
    const i = GRADE_ORDER.indexOf((g ?? "").trim().toUpperCase());
    return i === -1 ? 99 : i;
  };
  const sizeNum = (s: string | null) => parseInt(String(s ?? "").replace(/[^\d]/g, ""), 10) || 0;
  const rows = [...items].sort((a, b) =>
    gradeRank(a.grade) - gradeRank(b.grade) ||
    sizeNum(b.size) - sizeNum(a.size) ||
    (a.scent ?? "").localeCompare(b.scent ?? "", "en"));

  // Render a page's tbody with a full-width GRADE separator before each new type (and a
  // "(ต่อ)" band when a type carries over to the top of the next page) so the picker can't
  // mix up types. Numbering stays continuous across the whole document.
  const colCount = received ? 8 : 7;
  const gradeLabel = (g: string | null) => (g && g.trim() ? g : "อื่นๆ");
  // bags are counted in ใบ, perfume bottles in ขวด
  const unitOf = (g: string | null) => ((g ?? "").trim().toLowerCase() === "bag" ? "ใบ" : "ขวด");
  const renderBody = (pageRows: SheetItem[], start: number): any[] => {
    const out: any[] = [];
    pageRows.forEach((it, j) => {
      const gi = start + j;
      const prevGrade = gi === 0 ? undefined : rows[gi - 1].grade;
      const label = gradeLabel(it.grade);
      if ((it.grade ?? "") !== (prevGrade ?? "")) {
        out.push(
          <tr key={`g${gi}`} className="bg-neutral-100">
            <td colSpan={colCount} className="py-1.5 px-2 font-bold text-[12px] tracking-wide text-ink border-t-2 border-black">{label}</td>
          </tr>);
      } else if (j === 0) {
        out.push(
          <tr key={`gc${gi}`} className="bg-neutral-50">
            <td colSpan={colCount} className="py-1 px-2 font-semibold text-[11px] text-black/50 border-t border-neutral-300">{label} (ต่อ)</td>
          </tr>);
      }
      const rq = it.received_qty ?? it.qty;
      const diff = received && it.received_qty != null && Number(it.received_qty) !== Number(it.qty);
      out.push(
        <tr key={j} className="border-t border-neutral-200 align-middle">
          <td className="py-2 pr-3 text-center text-black tabular-nums">{gi + 1}</td>
          <td className="py-2 pr-3 tabular-nums text-neutral-700 whitespace-nowrap">{it.barcode || "-"}</td>
          <td className="py-2 pr-3">{it.scent}{diff && it.line_remark ? <span className="block text-[11px] text-warn-dark">↳ {it.line_remark}</span> : null}</td>
          <td className="py-2 pr-3 whitespace-nowrap">{it.grade ?? "-"}</td>
          <td className="py-2 pr-3 whitespace-nowrap">{it.size}</td>
          <td className="py-2 pr-3 text-right font-medium tabular-nums">{num(it.qty)}</td>
          {received && <td className={`py-2 pr-3 text-center font-medium tabular-nums ${diff ? "text-warn-dark" : ""}`}>{num(rq)}</td>}
          <td className="py-2 whitespace-nowrap">{unitOf(it.grade)}</td>
        </tr>);
    });
    return out;
  };

  // per-type summary (รายการ / ขวด เบิก / จ่ายจริง) — built in grade order for the last-page box
  const gradeSummary: { label: string; items: number; qty: number; recv: number }[] = [];
  for (const it of rows) {
    const label = gradeLabel(it.grade);
    let g = gradeSummary[gradeSummary.length - 1];
    if (!g || g.label !== label) { g = { label, items: 0, qty: 0, recv: 0 }; gradeSummary.push(g); }
    g.items += 1; g.qty += Number(it.qty) || 0; g.recv += Number(it.received_qty ?? it.qty) || 0;
  }

  // split the sorted rows into A4 pages (fill each page to its cap)
  const pages: SheetItem[][] = [];
  let idx = 0;
  while (idx < rows.length) {
    const cap = pages.length === 0 ? CAP_P1 : CAP_PN;
    pages.push(rows.slice(idx, idx + cap));
    idx += cap;
  }
  if (!pages.length) pages.push([]);
  // keep the footer (summary + signatures) from overflowing: if the last page is too full to
  // also hold it, put the footer on a fresh page instead of spilling into a blank one
  {
    const li = pages.length - 1;
    const cap = li === 0 ? CAP_P1 : CAP_PN;
    if (pages[li].length > cap - FOOTER_ROWS) pages.push([]);
  }

  // flatten to (copy × page) so we can flag the very first sheet (no page-break before it)
  const sheets: { copyLabel: string; pageRows: SheetItem[]; start: number; pageNo: number; total: number; isLast: boolean }[] = [];
  for (const copyLabel of ["ต้นฉบับ", "สำเนา"]) {
    let start = 0;
    pages.forEach((pageRows, pi) => {
      sheets.push({ copyLabel, pageRows, start, pageNo: pi + 1, total: pages.length, isLast: pi === pages.length - 1 });
      start += pageRows.length;
    });
  }

  return (
    <>
      {sheets.map((s, si) => (
        <div key={`${s.copyLabel}-${s.pageNo}`} className={"print-area req-sheet card bg-white" + (s.isLast ? " req-last" : "")}
          style={si > 0 ? { pageBreakBefore: "always" } : undefined}>
          {s.pageNo === 1 ? (
            <>
              <div className="flex justify-between items-start border-b-2 border-ink pb-4 mb-5">
                <div>
                  <div className="text-xl font-bold">บริษัท ทัช ไดเวอร์เจนซ์ จำกัด</div>
                  <div className="text-xs text-black/60 mt-1">288/31 หมู่ที่ 12 ต.ราชาเทวะ อ.บางพลี จ.สมุทรปราการ 10540 · 081-234-1438</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gold-dark">ใบเบิกสินค้า</div>
                  <div className="text-base font-bold text-ink mt-1">{s.copyLabel}{s.total > 1 ? ` · หน้า ${s.pageNo}/${s.total}` : ""}</div>
                </div>
              </div>

              <div className="flex items-start justify-between gap-8 mb-5">
                <div className="text-sm flex-1 space-y-1.5">
                  <div className="flex flex-wrap justify-between gap-x-10 gap-y-1.5">
                    <Field label="PO Order No." value={po.po_number} nowrap />
                    <Field label="วันที่" value={fmtDate(po.order_date)} nowrap />
                  </div>
                  <Field label="Branch" value={po.branch_label} nowrap />
                  <div className="flex flex-wrap justify-between gap-x-10 gap-y-1.5">
                    <Field label="รหัสสาขา" value={po.store_no ?? "-"} nowrap />
                    <Field label="Delivery No." value={po.delivery_number ?? "-"} nowrap />
                  </div>
                </div>
                {po.po_number && (
                  <div className="shrink-0 flex flex-col items-center border border-neutral-300 rounded-md px-3 py-2">
                    <Barcode value={po.po_number} height={42} width={1.5} displayValue={false} margin={2} asImage />
                    <span className="text-[12px] mt-1 whitespace-nowrap tabular-nums">
                      <span className="text-black/45">PO Order No. </span><span className="font-semibold">{po.po_number}</span>
                    </span>
                  </div>
                )}
              </div>

              {received && (
                <div className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${hasDiff ? "bg-warn-soft border border-warn/40 text-ink" : "bg-success-soft border border-success/30 text-success"}`}>
                  {hasDiff
                    ? <>⚠️ รับของแล้ว · <b>มีส่วนต่าง</b> — เบิก {num(totalQty)} · จ่ายจริง {num(totalRecv)} ({totalRecv - totalQty > 0 ? "+" : ""}{num(totalRecv - totalQty)})</>
                    : <>✓ รับของแล้ว · ครบตามเบิก ({num(totalRecv)} ชิ้น)</>}
                </div>
              )}
            </>
          ) : (
            // continuation page — compact header so the reader still knows which document/sheet
            <div className="flex justify-between items-baseline border-b-2 border-ink pb-2 mb-4 text-sm">
              <span className="font-bold text-gold-dark">ใบเบิกสินค้า · {s.copyLabel}</span>
              <span className="text-black/60">PO Order No. <b className="text-ink">{po.po_number}</b> · หน้า {s.pageNo}/{s.total}</span>
            </div>
          )}

          {s.pageRows.length > 0 && (
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="text-left text-neutral-500 text-[11px] uppercase tracking-wide border-b-2 border-black">
                <th className="pb-1.5 pr-3 font-semibold text-center">#</th>
                <th className="pb-1.5 pr-3 font-semibold">Barcode</th>
                <th className="pb-1.5 pr-3 font-semibold">ชื่อสินค้า</th>
                <th className="pb-1.5 pr-3 font-semibold whitespace-nowrap">ประเภท</th>
                <th className="pb-1.5 pr-3 font-semibold whitespace-nowrap">ขนาด</th>
                <th className="pb-1.5 pr-3 font-semibold text-right">เบิก</th>
                {received && <th className="pb-1.5 pr-3 font-semibold text-center">จ่ายจริง</th>}
                <th className="pb-1.5 font-semibold">หน่วย</th>
              </tr>
            </thead>
            <tbody>
              {renderBody(s.pageRows, s.start)}
            </tbody>
            {s.isLast && (
              <tfoot>
                <tr className="border-t-2 border-black font-bold [&>td]:border-b-4 [&>td]:border-double [&>td]:border-black">
                  <td colSpan={5} className="py-2 pr-3 text-right">รวมทั้งสิ้น</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{num(totalQty)}</td>
                  {received && <td className="py-2 pr-3 text-center tabular-nums">{num(totalRecv)}</td>}
                  <td className="py-2 whitespace-nowrap">ชิ้น</td>
                </tr>
              </tfoot>
            )}
          </table>
          )}
          {/* close the table with a rule at the page break (under row 18 / 39 / …) */}
          {!s.isLast && s.pageRows.length > 0 && <div className="border-t-2 border-black" />}

          {s.isLast && (
            <>
              {/* last-page footer row: type summary (left) + notes box (right), equal height */}
              <div className="mt-6 flex items-stretch gap-6">
                <div className="rounded-lg border border-neutral-300 overflow-hidden shadow-sm">
                  <div className="bg-neutral-100 border-b border-neutral-300 px-4 py-2 text-[12px] font-bold text-ink tracking-wide">สรุปตามประเภท</div>
                  <table className="text-[12px] border-collapse">
                    <thead>
                      <tr className="text-neutral-500 text-[10px] uppercase tracking-wide border-b border-neutral-300">
                        <th className="py-2 px-4 text-left font-semibold">ประเภท</th>
                        <th className="py-2 px-4 text-right font-semibold">รายการ</th>
                        <th className="py-2 px-4 text-right font-semibold">จำนวน</th>
                        {received && <th className="py-2 px-4 text-right font-semibold">จ่ายจริง</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {gradeSummary.map((g) => (
                        <tr key={g.label} className="border-b border-neutral-200 last:border-0">
                          <td className="py-1.5 px-4 font-medium text-ink whitespace-nowrap">{g.label}</td>
                          <td className="py-1.5 px-4 text-right tabular-nums">{num(g.items)}</td>
                          <td className="py-1.5 px-4 text-right tabular-nums">{num(g.qty)}</td>
                          {received && <td className="py-1.5 px-4 text-right tabular-nums">{num(g.recv)}</td>}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-neutral-50 font-bold border-t-2 border-black">
                        <td className="py-2 px-4">รวมทั้งสิ้น</td>
                        <td className="py-2 px-4 text-right tabular-nums">{num(rows.length)}</td>
                        <td className="py-2 px-4 text-right tabular-nums">{num(totalQty)}</td>
                        {received && <td className="py-2 px-4 text-right tabular-nums">{num(totalRecv)}</td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex-1 rounded-lg border border-neutral-300 overflow-hidden shadow-sm flex flex-col">
                  <div className="bg-neutral-100 border-b border-neutral-300 px-4 py-2 text-[12px] font-bold text-ink tracking-wide">หมายเหตุ</div>
                  <div className="flex-1 px-4 py-4 min-h-[80px]" />
                </div>
              </div>

              <div className="req-sign grid grid-cols-4 gap-6 pt-12 text-[13px]">
                {["(ผู้เบิก)", "(ผู้ตรวจ)", "(ผู้จ่าย)", "(ผู้รับ)"].map((role) => (
                  <div key={role} className="text-center">
                    <div className="border-t border-black pt-1.5">{role}</div>
                    <div className="text-[11px] text-black/55 mt-2 whitespace-nowrap">____/____/____</div>
                    <div className="text-[9px] text-black/40 mt-0.5">วัน / เดือน / ปี</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </>
  );
}

function Field({ label, value, nowrap = false }: { label: string; value: string; nowrap?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-black/45 min-w-[92px] shrink-0">{label} :</span>
      <span className={"font-medium" + (nowrap ? " whitespace-nowrap" : "")}>{value}</span>
    </div>
  );
}
