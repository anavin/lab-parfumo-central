import { PageHeader, LinkBtn } from "@/components/ui";
import { ClipboardList } from "lucide-react";
import { RequisitionsTable } from "@/components/RequisitionsTable";
import { q } from "@/lib/db";
import { ALLOC_STATUS } from "@/lib/stock-alloc";

export const dynamic = "force-dynamic";

type Row = {
  id: number; po_number: string; version: string | null; order_date: string;
  branch_label: string; store_no: string; status: string;
  lines: number; qty: number; assigned_to: number | null;
};

export default async function Requisitions() {
  const sel = (assignedCol: string) => `
    select po.id, po.po_number, po.version, po.order_date, po.branch_label,
           po.store_no, po.status, ${assignedCol} as assigned_to,
           count(i.id)::int lines, coalesce(sum(i.qty),0)::float qty
    from purchase_orders po
    left join po_items i on i.po_id = po.id
    where po.deleted_at is null and coalesce(po.status,'') <> $1
    group by po.id
    order by po.order_date desc nulls last, po.po_number desc`;
  let rows: Row[];
  try { rows = await q<Row>(sel("po.assigned_to"), [ALLOC_STATUS]); }
  catch (e: any) { if (e?.code !== "42703") throw e; rows = await q<Row>(sel("null::bigint"), [ALLOC_STATUS]); }   // 0029 not run yet

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader icon={ClipboardList} title="ใบเบิกสินค้า" subtitle={`${rows.length} รายการ`}
        action={<LinkBtn href="/requisitions/new">+ สร้างใบเบิกใหม่</LinkBtn>} />
      <RequisitionsTable rows={rows} />
    </div>
  );
}
