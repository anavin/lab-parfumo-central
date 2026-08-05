import Link from "next/link";
import { PageHeader, Badge, LinkBtn } from "@/components/ui";
import { ClipboardList } from "lucide-react";
import { fmtDate, num } from "@/lib/format";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

type Row = {
  id: number; po_number: string; version: string | null; order_date: string;
  branch_label: string; store_no: string; status: string;
  lines: number; qty: number;
};

const statusTone: Record<string, "gray" | "brand" | "success" | "info"> = {
  draft: "gray", issued: "brand", delivered: "info", closed: "success",
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
    <div className="p-8 max-w-[1200px] mx-auto">
      <PageHeader icon={ClipboardList} title="ใบเบิกสินค้า" subtitle={`${rows.length} รายการ`}
        action={<LinkBtn href="/requisitions/new">+ สร้างใบเบิกใหม่</LinkBtn>} />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas border-b border-line">
            <tr>
              <th className="th px-4 py-3">PO Number</th>
              <th className="th px-4 py-3">วันที่</th>
              <th className="th px-4 py-3">สาขา</th>
              <th className="th px-4 py-3 text-right">รายการ</th>
              <th className="th px-4 py-3 text-right">จำนวน</th>
              <th className="th px-4 py-3">สถานะ</th>
              <th className="th px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line-soft last:border-0 hover:bg-canvas transition-colors">
                <td className="px-4 py-3 font-semibold text-ink">{r.po_number}
                  {r.version && <span className="text-muted-soft font-normal ml-1 text-xs">{r.version}</span>}
                </td>
                <td className="px-4 py-3 text-muted">{fmtDate(r.order_date)}</td>
                <td className="px-4 py-3 text-ink-soft">{r.branch_label}</td>
                <td className="px-4 py-3 text-right text-muted tabular-nums">{r.lines}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">{num(r.qty)}</td>
                <td className="px-4 py-3"><Badge tone={statusTone[r.status] ?? "gray"}>{r.status}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/requisitions/${r.id}`} className="text-brand-dark font-medium hover:underline whitespace-nowrap">เปิด →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
