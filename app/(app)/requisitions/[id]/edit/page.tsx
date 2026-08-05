import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { RequisitionForm } from "@/components/RequisitionForm";
import { listBranches } from "@/lib/actions/lookups";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditRequisition({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [po] = await q<any>(`select * from purchase_orders where id=$1`, [Number(id)]);
  if (!po) notFound();
  const items = await q<any>(
    `select barcode, product_id, scent, size, qty::float from po_items where po_id=$1 order by line_no nulls last, id`,
    [Number(id)]);
  const branches = await listBranches();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1000px] mx-auto">
      <PageHeader title={`แก้ไขใบเบิก ${po.po_number}`} subtitle={po.version ?? ""} />
      <RequisitionForm
        branches={branches}
        mode="edit"
        id={Number(id)}
        initial={{
          order_date: po.order_date ?? "",
          branch_label: po.branch_label ?? "",
          store_no: po.store_no ?? "",
          delivery_number: po.delivery_number ?? "",
          phone: po.phone ?? "",
          shipping_name: po.shipping_name ?? "",
          address: po.address ?? "",
          remark: po.remark ?? "",
          status: po.status ?? "issued",
          items: items.map((i: any) => ({ key: 0, barcode: i.barcode ?? "", scent: i.scent ?? "", size: i.size ?? "", qty: Number(i.qty) || 0, product_id: i.product_id })),
        }}
      />
    </div>
  );
}
