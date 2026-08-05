import Link from "next/link";
import { notFound } from "next/navigation";
import { q } from "@/lib/db";
import { fmtDate, num } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";
import { RequisitionActions } from "@/components/RequisitionActions";

export const dynamic = "force-dynamic";

type PO = {
  id: number; po_number: string; version: string | null; order_date: string; status: string;
  branch_label: string; store_no: string; delivery_number: string | null;
  phone: string | null; shipping_name: string | null; address: string | null; remark: string | null;
};
type Item = { line_no: number; barcode: string; scent: string; size: string; qty: number; grade: string | null; sku: string | null };

export default async function RequisitionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [po] = await q<PO>(`select * from purchase_orders where id = $1`, [Number(id)]);
  if (!po) notFound();

  const items = await q<Item>(`
    select i.line_no, i.barcode, i.scent, i.size, i.qty,
           p.grade, p.sku
    from po_items i left join products p on p.id = i.product_id
    where i.po_id = $1 order by i.line_no nulls last, i.id`, [Number(id)]);

  const totalQty = items.reduce((s, i) => s + Number(i.qty || 0), 0);

  return (
    <div className="p-8 max-w-[900px] mx-auto">
      <div className="no-print flex items-center justify-between mb-5">
        <Link href="/requisitions" className="text-sm text-black/50 hover:text-ink">← กลับ</Link>
        <div className="flex gap-2 items-center">
          <RequisitionActions id={po.id} status={po.status} />
          <a href={`/api/requisitions/${po.id}/pdf`} target="_blank" rel="noopener"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-gold text-white hover:bg-gold-dark transition-colors">
            📄 PDF
          </a>
          <PrintButton />
        </div>
      </div>

      {/* ---------------- ใบเบิกสินค้า ---------------- */}
      <div className="print-area card p-8 mb-8 bg-white">
        <div className="flex justify-between items-start border-b-2 border-ink pb-4 mb-5">
          <div>
            <div className="text-xl font-bold">บริษัท ทัช ไดเวอร์เจนซ์ จำกัด</div>
            <div className="text-xs text-black/60 mt-1">288/31 หมู่ที่ 12 ต.ราชาเทวะ อ.บางพลี จ.สมุทรปราการ 10540 · 081-234-1438</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gold-dark">ใบเบิกสินค้า</div>
            <div className="text-xs text-black/50">Requisition</div>
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

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-black/[0.04] text-left text-xs text-black/60">
              <th className="border border-black/10 px-2 py-1.5 w-8">#</th>
              <th className="border border-black/10 px-2 py-1.5">รหัสสินค้า</th>
              <th className="border border-black/10 px-2 py-1.5">Barcode</th>
              <th className="border border-black/10 px-2 py-1.5">รายการ</th>
              <th className="border border-black/10 px-2 py-1.5">ประเภท</th>
              <th className="border border-black/10 px-2 py-1.5">ขนาด</th>
              <th className="border border-black/10 px-2 py-1.5 text-right">จำนวน</th>
              <th className="border border-black/10 px-2 py-1.5">หน่วย</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td className="border border-black/10 px-2 py-1 text-black/50">{i + 1}</td>
                <td className="border border-black/10 px-2 py-1">{it.sku ?? "-"}</td>
                <td className="border border-black/10 px-2 py-1 font-mono text-xs">{it.barcode ?? "-"}</td>
                <td className="border border-black/10 px-2 py-1">{it.scent}</td>
                <td className="border border-black/10 px-2 py-1">{it.grade ?? "-"}</td>
                <td className="border border-black/10 px-2 py-1">{it.size}</td>
                <td className="border border-black/10 px-2 py-1 text-right font-medium">{num(it.qty)}</td>
                <td className="border border-black/10 px-2 py-1">ขวด</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td colSpan={6} className="border border-black/10 px-2 py-1.5 text-right">รวมทั้งสิ้น</td>
              <td className="border border-black/10 px-2 py-1.5 text-right">{num(totalQty)}</td>
              <td className="border border-black/10 px-2 py-1.5">ขวด</td>
            </tr>
          </tfoot>
        </table>

        <div className="grid grid-cols-2 gap-8 mt-10 text-sm">
          <Sign label="ผู้เบิก" />
          <Sign label="ผู้อนุมัติ" />
        </div>
      </div>

      {/* ---------------- ใบส่งของ ---------------- */}
      <div className="print-area card p-8 bg-white" style={{ pageBreakBefore: "always" }}>
        <div className="flex justify-between items-start border-b-2 border-ink pb-4 mb-5">
          <div>
            <div className="text-xl font-bold">บริษัท ทัช ไดเวอร์เจนซ์ จำกัด</div>
            <div className="text-xs text-black/60 mt-1">288/31 หมู่ที่ 12 ต.ราชาเทวะ อ.บางพลี จ.สมุทรปราการ 10540</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#3d5a80]">ใบส่งของ</div>
            <div className="text-xs text-black/50">Delivery Note</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm mb-5">
          <Field label="Delivery No." value={po.delivery_number ?? "-"} />
          <Field label="Delivery Date" value={fmtDate(po.order_date)} />
          <Field label="PO Order No." value={po.po_number} />
          <Field label="Deliver To" value={po.shipping_name ?? po.branch_label} />
          <Field label="Phone" value={po.phone ?? "-"} />
          <Field label="Address" value={po.address ?? "-"} />
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-black/[0.04] text-left text-xs text-black/60">
              <th className="border border-black/10 px-2 py-1.5 w-8">#</th>
              <th className="border border-black/10 px-2 py-1.5">Product Code</th>
              <th className="border border-black/10 px-2 py-1.5">รายการ</th>
              <th className="border border-black/10 px-2 py-1.5">Size</th>
              <th className="border border-black/10 px-2 py-1.5 text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td className="border border-black/10 px-2 py-1 text-black/50">{i + 1}</td>
                <td className="border border-black/10 px-2 py-1 font-mono text-xs">{it.barcode ?? "-"}</td>
                <td className="border border-black/10 px-2 py-1">{it.scent}</td>
                <td className="border border-black/10 px-2 py-1">{it.size}</td>
                <td className="border border-black/10 px-2 py-1 text-right font-medium">{num(it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid grid-cols-2 gap-8 mt-10 text-sm">
          <Sign label="ผู้ส่งสินค้า" />
          <Sign label="ผู้รับสินค้า" />
        </div>
      </div>
    </div>
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
