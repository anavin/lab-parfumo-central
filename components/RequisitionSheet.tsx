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

// rows per A4 page — the first page carries the full header so it holds fewer
const FIRST_PAGE_ROWS = 14;
const CONT_PAGE_ROWS = 22;

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
          <td className="py-2 whitespace-nowrap">ขวด</td>
        </tr>);
    });
    return out;
  };

  // split the sorted rows into A4 pages
  const pages: SheetItem[][] = [];
  if (rows.length <= FIRST_PAGE_ROWS) {
    pages.push(rows);
  } else {
    pages.push(rows.slice(0, FIRST_PAGE_ROWS));
    for (let i = FIRST_PAGE_ROWS; i < rows.length; i += CONT_PAGE_ROWS) pages.push(rows.slice(i, i + CONT_PAGE_ROWS));
  }
  if (!pages.length) pages.push([]);

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
        <div key={`${s.copyLabel}-${s.pageNo}`} className="print-area req-sheet card bg-white"
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
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm flex-1">
                  <Field label="PO Order No." value={po.po_number} />
                  <Field label="วันที่" value={fmtDate(po.order_date)} />
                  <div className="col-span-2"><Field label="Branch" value={po.branch_label} nowrap /></div>
                  <Field label="รหัสสาขา" value={po.store_no ?? "-"} />
                  <Field label="Delivery No." value={po.delivery_number ?? "-"} />
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
                <tr className="border-t-2 border-black font-bold">
                  <td colSpan={5} className="py-2 pr-3 text-right">รวมทั้งสิ้น</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{num(totalQty)}</td>
                  {received && <td className="py-2 pr-3 text-center tabular-nums">{num(totalRecv)}</td>}
                  <td className="py-2 whitespace-nowrap">ขวด</td>
                </tr>
              </tfoot>
            )}
          </table>

          {s.isLast ? (
            <div className="req-sign grid grid-cols-3 gap-8 pt-12 text-[13px]">
              <div className="text-center"><div className="border-t border-black pt-1.5">(ผู้เบิก)</div></div>
              <div className="text-center"><div className="border-t border-black pt-1.5">(ผู้ตรวจ)</div></div>
              <div className="text-center"><div className="border-t border-black pt-1.5">(ผู้จ่าย)</div></div>
            </div>
          ) : (
            <div className="mt-3 text-right text-[12px] text-black/50">มีต่อหน้าถัดไป →</div>
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
