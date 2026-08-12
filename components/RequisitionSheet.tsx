import { fmtDate, num } from "@/lib/format";
import { BarcodeSvg } from "@/components/BarcodeSvg";

// Shared requisition document — rendered identically in the on-screen preview
// (requisitions/[id]) AND the standalone print page (print/requisition/[id]), so
// what you see is exactly what prints/saves to PDF. Same approach as DailyReportSheet.
export type SheetPO = {
  po_number: string; version: string | null; order_date: string; status: string;
  branch_label: string; store_no: string | null; delivery_number: string | null;
};
export type SheetItem = {
  barcode: string | null; scent: string | null; size: string | null; qty: number;
  grade: string | null; sku: string | null; received_qty: number | null; line_remark: string | null;
};

export function RequisitionSheet({ po, items }: { po: SheetPO; items: SheetItem[] }) {
  const totalQty = items.reduce((s, i) => s + Number(i.qty || 0), 0);
  const received = po.status === "received";
  const totalRecv = items.reduce((s, i) => s + Number(i.received_qty ?? i.qty ?? 0), 0);
  const hasDiff = received && items.some((i) => i.received_qty != null && Number(i.received_qty) !== Number(i.qty));

  return (
    <>
      {["ต้นฉบับ", "สำเนา"].map((copyLabel, ci) => (
        <div key={copyLabel} className="print-area req-sheet card bg-white" style={ci > 0 ? { pageBreakBefore: "always" } : undefined}>
          <div className="flex justify-between items-start border-b-2 border-ink pb-4 mb-5">
            <div>
              <div className="text-xl font-bold">บริษัท ทัช ไดเวอร์เจนซ์ จำกัด</div>
              <div className="text-xs text-black/60 mt-1">288/31 หมู่ที่ 12 ต.ราชาเทวะ อ.บางพลี จ.สมุทรปราการ 10540 · 081-234-1438</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gold-dark">ใบเบิกสินค้า</div>
              <div className="text-xs text-black/50">Requisition · {copyLabel}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm mb-5">
            <Field label="PO Order No." value={po.po_number} />
            <Field label="วันที่" value={fmtDate(po.order_date)} />
            <Field label="PO Version" value={po.version ?? "-"} />
            <Field label="Branch" value={po.branch_label} />
            <Field label="รหัสสาขา" value={po.store_no ?? "-"} />
            <Field label="Delivery No." value={po.delivery_number ?? "-"} />
          </div>

          {received && (
            <div className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${hasDiff ? "bg-warn-soft border border-warn/40 text-ink" : "bg-success-soft border border-success/30 text-success"}`}>
              {hasDiff
                ? <>⚠️ รับของแล้ว · <b>มีส่วนต่าง</b> — เบิก {num(totalQty)} · รับจริง {num(totalRecv)} ({totalRecv - totalQty > 0 ? "+" : ""}{num(totalRecv - totalQty)})</>
                : <>✓ รับของแล้ว · ครบตามเบิก ({num(totalRecv)} ชิ้น)</>}
            </div>
          )}

          <table className="w-full text-sm border-collapse table-fixed">
            <colgroup>
              {(received
                ? ["3.8%", "10.6%", "24.5%", "25%", "7.5%", "8.3%", "6.8%", "7.5%", "6%"]
                : ["4.1%", "11.3%", "26.4%", "27%", "8.3%", "9%", "7.5%", "6.4%"]
              ).map((w, i) => <col key={i} style={{ width: w }} />)}
            </colgroup>
            <thead>
              <tr className="bg-black/[0.04] text-left text-xs text-black/60">
                <th className="border border-black/10 px-2 py-1.5">#</th>
                <th className="border border-black/10 px-2 py-1.5">รหัสสินค้า</th>
                <th className="border border-black/10 px-2 py-1.5">Barcode</th>
                <th className="border border-black/10 px-2 py-1.5">ชื่อสินค้า</th>
                <th className="border border-black/10 px-2 py-1.5">ประเภท</th>
                <th className="border border-black/10 px-2 py-1.5">ขนาด</th>
                <th className="border border-black/10 px-2 py-1.5 text-right">เบิก</th>
                {received && <th className="border border-black/10 px-2 py-1.5 text-right">รับจริง</th>}
                <th className="border border-black/10 px-2 py-1.5">หน่วย</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const rq = it.received_qty ?? it.qty;
                const diff = received && it.received_qty != null && Number(it.received_qty) !== Number(it.qty);
                return (
                  <tr key={i}>
                    <td className="border border-black/10 px-2 py-1 text-black/50">{i + 1}</td>
                    <td className="border border-black/10 px-2 py-1">{it.sku ?? "-"}</td>
                    <td className="border border-black/10 px-2 py-1 text-center"><BarcodeSvg value={it.barcode ?? ""} /></td>
                    <td className="border border-black/10 px-2 py-1">{it.scent}{diff && it.line_remark ? <span className="block text-[11px] text-warn-dark">↳ {it.line_remark}</span> : null}</td>
                    <td className="border border-black/10 px-2 py-1">{it.grade ?? "-"}</td>
                    <td className="border border-black/10 px-2 py-1">{it.size}</td>
                    <td className="border border-black/10 px-2 py-1 text-right font-medium">{num(it.qty)}</td>
                    {received && <td className={`border border-black/10 px-2 py-1 text-right font-medium ${diff ? "text-warn-dark bg-warn-soft" : ""}`}>{num(rq)}</td>}
                    <td className="border border-black/10 px-2 py-1">ขวด</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td colSpan={6} className="border border-black/10 px-2 py-1.5 text-right">รวมทั้งสิ้น</td>
                <td className="border border-black/10 px-2 py-1.5 text-right">{num(totalQty)}</td>
                {received && <td className="border border-black/10 px-2 py-1.5 text-right">{num(totalRecv)}</td>}
                <td className="border border-black/10 px-2 py-1.5">ขวด</td>
              </tr>
            </tfoot>
          </table>

          <div className="req-sign grid grid-cols-2 gap-8 text-sm">
            <Sign label="ผู้เบิก" />
            <Sign label="ผู้รับสินค้า" />
          </div>
        </div>
      ))}
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-black/45 min-w-[92px]">{label} :</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
function Sign({ label }: { label: string }) {
  return (
    <div className="text-center">
      <div className="border-b border-black/40 h-10" />
      <div className="text-xs text-black/50 mt-1">({label})</div>
    </div>
  );
}
