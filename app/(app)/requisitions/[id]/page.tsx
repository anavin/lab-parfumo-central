import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Download } from "lucide-react";
import { q } from "@/lib/db";
import { RequisitionActions } from "@/components/RequisitionActions";
import { RequisitionSheet } from "@/components/RequisitionSheet";
import { RequisitionAttachments } from "@/components/RequisitionAttachments";
import { RequisitionAssignee } from "@/components/RequisitionAssignee";
import { getPoAttachments } from "@/lib/actions/po-attachments";
import { listReceivers } from "@/lib/actions/requisitions";

export const dynamic = "force-dynamic";

type PO = {
  id: number; po_number: string; version: string | null; order_date: string; status: string;
  branch_label: string; store_no: string; delivery_number: string | null;
  phone: string | null; shipping_name: string | null; address: string | null; remark: string | null;
  assigned_to?: number | null;   // salesperson chosen to receive (0029)
};
type Item = { line_no: number; barcode: string; scent: string; size: string; qty: number; grade: string | null; sku: string | null; received_qty: number | null; line_remark: string | null };

export default async function RequisitionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [po] = await q<PO>(`select * from purchase_orders where id = $1`, [Number(id)]);
  if (!po) notFound();

  const items = await q<Item>(`
    select i.line_no, coalesce(p.barcode, i.barcode) barcode, i.scent, i.size, i.qty,
           i.received_qty::float received_qty, i.line_remark, p.grade, p.sku
    from po_items i left join products p on p.id = i.product_id
    where i.po_id = $1 order by i.line_no nulls last, i.id`, [Number(id)]);

  const attachments = await getPoAttachments(po.id);
  const canAttach = po.status !== "received";   // lock attachments once the goods are received
  const receivers = await listReceivers();      // for the "who receives this" picker

  return (
    // clean document canvas — same as the /print page, just with an action bar on top
    <div className="min-h-screen bg-neutral-100 text-black">
      {/* everything (toolbar · attachments · document) shares the A4 sheet width so their edges line up */}
      <div className="req-wrap mx-auto w-[210mm] max-w-full px-4 sm:px-0 py-6">
        {/* slim toolbar — never part of the printed document */}
        <div className="no-print mb-5 flex items-center justify-between gap-3 flex-wrap">
          <Link href="/requisitions" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-black">← กลับ</Link>
          <div className="flex gap-2 items-center flex-wrap">
            <RequisitionActions id={po.id} status={po.status} />
            <a href={`/api/requisition/${po.id}/pdf`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-gold text-white hover:bg-gold-dark transition-colors">
              <Download className="w-4 h-4" /> ดาวน์โหลด PDF
            </a>
            <a href={`/print/requisition/${po.id}`} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-line text-muted hover:bg-canvas transition-colors">
              <FileText className="w-4 h-4" /> พิมพ์
            </a>
          </div>
        </div>

        {/* assign which salesperson receives this — only they see it in /my */}
        <div className="no-print mb-4 flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 flex-wrap">
          <RequisitionAssignee id={po.id} current={po.assigned_to ?? null} receivers={receivers} />
          {po.status === "received"
            ? <span className="chip-ok">รับของแล้ว</span>
            : (po.assigned_to ? null : <span className="text-xs text-warn-dark">· ยังไม่มอบหมาย → ยังไม่มีใครเห็นใบรับ</span>)}
        </div>

        {/* attachments — kept accessible but out of the document itself */}
        <div className="no-print mb-6">
          <RequisitionAttachments poId={po.id} initial={attachments} editable={canAttach} />
        </div>

        {/* ใบเบิกสินค้า — เอกสารจริง (ต้นฉบับ + สำเนา) */}
        <RequisitionSheet po={po} items={items} />
      </div>
    </div>
  );
}
