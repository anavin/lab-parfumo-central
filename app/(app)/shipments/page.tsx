import { PageHeader, Stat, Card, Badge, LinkBtn } from "@/components/ui";
import { Truck } from "lucide-react";
import { fmtDate, num } from "@/lib/format";
import { shipmentSummary } from "@/lib/queries";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ShipmentsPage() {
  const rows = await shipmentSummary();
  const [agg] = await q<{ units: number; pos: number; returned: number }>(`
    select count(*)::int units, count(distinct po_number)::int pos,
           count(*) filter (where receive_status='Returned')::int returned
    from shipment_items`);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px] mx-auto">
      <PageHeader icon={Truck} title="ส่ง / คืนสินค้า" subtitle="ติดตามการส่งสินค้าระดับหน่วย (SKU)"
        action={<div className="flex gap-2"><LinkBtn href="/shipments/return" variant="ghost">↩ บันทึกคืน</LinkBtn><LinkBtn href="/shipments/new">+ บันทึกส่งสินค้า</LinkBtn></div>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="หน่วยที่ส่ง" value={num(agg.units)} tone="brand" />
        <Stat label="จำนวน PO" value={num(agg.pos)} />
        <Stat label="คืนแล้ว" value={num(agg.returned)} tone="danger" />
      </div>
      <Card title={`สรุปการส่งตาม PO (${rows.length})`}>
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-ink/40 text-xs text-left sticky top-0 bg-surface"><tr className="border-b">
              <th className="pb-2">PO Number</th><th className="pb-2">วันที่</th><th className="pb-2">สาขา</th>
              <th className="pb-2 text-right">หน่วย</th><th className="pb-2 text-right">รับแล้ว</th><th className="pb-2 text-right">คืน</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.po_number} className="border-b last:border-0">
                  <td className="py-1.5 font-semibold">{r.po_number}</td>
                  <td className="py-1.5 text-ink/50">{fmtDate(r.ship_date)}</td>
                  <td className="py-1.5 text-ink/60">{r.branch_label}</td>
                  <td className="py-1.5 text-right font-medium">{num(r.units)}</td>
                  <td className="py-1.5 text-right">{r.received ? <Badge tone="success">{r.received}</Badge> : <span className="text-ink/30">-</span>}</td>
                  <td className="py-1.5 text-right">{r.returned ? <Badge tone="danger">{r.returned}</Badge> : <span className="text-ink/30">-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
