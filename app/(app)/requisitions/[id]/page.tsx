import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { q } from "@/lib/db";
import { RequisitionActions } from "@/components/RequisitionActions";
import { RequisitionSheet } from "@/components/RequisitionSheet";
import { RequisitionAttachments } from "@/components/RequisitionAttachments";
import { getPoAttachments } from "@/lib/actions/po-attachments";

export const dynamic = "force-dynamic";

type PO = {
  id: number; po_number: string; version: string | null; order_date: string; status: string;
  branch_label: string; store_no: string; delivery_number: string | null;
  phone: string | null; shipping_name: string | null; address: string | null; remark: string | null;
};
type Item = { line_no: number; barcode: string; scent: string; size: string; qty: number; grade: string | null; sku: string | null; received_qty: number | null; line_remark: string | null };

export default async function RequisitionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [po] = await q<PO>(`select * from purchase_orders where id = $1`, [Number(id)]);
  if (!po) notFound();

  const items = await q<Item>(`
    select i.line_no, i.barcode, i.scent, i.size, i.qty, i.received_qty::float received_qty, i.line_remark,
           p.grade, p.sku
    from po_items i left join products p on p.id = i.product_id
    where i.po_id = $1 order by i.line_no nulls last, i.id`, [Number(id)]);

  const attachments = await getPoAttachments(po.id);
  const canAttach = po.status !== "received";   // lock attachments once the goods are received

  return (
    <div className="req-wrap p-4 sm:p-6 lg:p-8 max-w-[900px] mx-auto">
      <div className="no-print flex items-center justify-between mb-5">
        <Link href="/requisitions" className="text-sm text-black/50 hover:text-ink">← กลับ</Link>
        <div className="flex gap-2 items-center">
          <RequisitionActions id={po.id} status={po.status} />
          <a href={`/print/requisition/${po.id}`} target="_blank" rel="noopener"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-gold text-white hover:bg-gold-dark transition-colors">
            <FileText className="w-4 h-4" /> พิมพ์ / PDF
          </a>
        </div>
      </div>

      <RequisitionAttachments poId={po.id} initial={attachments} editable={canAttach} />

      {/* ใบเบิกสินค้า — พิมพ์ 2 ใบ layout เดียวกัน: ต้นฉบับ + สำเนา */}
      <RequisitionSheet po={po} items={items} />
    </div>
  );
}
