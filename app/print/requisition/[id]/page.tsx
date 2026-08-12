import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/require-user";
import { q } from "@/lib/db";
import { RequisitionSheet, type SheetPO, type SheetItem } from "@/components/RequisitionSheet";
import { PrintNow } from "@/components/PrintNow";

// Standalone, shell-free print page — renders the SAME RequisitionSheet as the
// on-screen preview and prints it via the browser (window.print → Save as PDF), so
// the preview and the PDF are byte-for-byte the same DOM. (Same method as the daily
// report; avoids the react-pdf renderer drifting from the HTML preview.)
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [po] = await q<{ po_number: string }>(`select po_number from purchase_orders where id=$1`, [Number(id)]);
  return { title: po ? `${po.po_number}-Requisition` : "Requisition" };
}

export default async function RequisitionPrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("requisitions");
  const { id } = await params;
  const [po] = await q<SheetPO>(`select po_number, version, order_date, status, branch_label, store_no, delivery_number
                                 from purchase_orders where id=$1`, [Number(id)]);
  if (!po) notFound();
  const items = await q<SheetItem>(`
    select i.barcode, i.scent, i.size, i.qty, i.received_qty::float received_qty, i.line_remark, p.grade, p.sku
    from po_items i left join products p on p.id = i.product_id
    where i.po_id=$1 order by i.line_no nulls last, i.id`, [Number(id)]);

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="req-wrap mx-auto w-full max-w-[840px] px-4 py-4">
        <div className="mb-4"><PrintNow title={`${po.po_number}-Requisition`} /></div>
        <RequisitionSheet po={po} items={items} />
      </div>
    </div>
  );
}
