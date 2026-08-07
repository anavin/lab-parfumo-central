import { PageHeader, LinkBtn } from "@/components/ui";
import { ClipboardList } from "lucide-react";
import { RequisitionsTable } from "@/components/RequisitionsTable";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

type Row = {
  id: number; po_number: string; version: string | null; order_date: string;
  branch_label: string; store_no: string; status: string;
  lines: number; qty: number;
};

export default async function Requisitions() {
  const rows = await q<Row>(`
    select po.id, po.po_number, po.version, po.order_date, po.branch_label,
           po.store_no, po.status,
           count(i.id)::int lines, coalesce(sum(i.qty),0)::float qty
    from purchase_orders po
    left join po_items i on i.po_id = po.id
    where po.deleted_at is null
    group by po.id
    order by po.order_date desc nulls last, po.po_number desc`);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader icon={ClipboardList} title="ใบเบิกสินค้า" subtitle={`${rows.length} รายการ`}
        action={<LinkBtn href="/requisitions/new">+ สร้างใบเบิกใหม่</LinkBtn>} />
      <div className="card overflow-hidden">
        <RequisitionsTable rows={rows} />
      </div>
    </div>
  );
}
