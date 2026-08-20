import { PageHeader, Stat, Card, LinkBtn } from "@/components/ui";
import { Truck } from "lucide-react";
import { num } from "@/lib/format";
import { shipmentSummary } from "@/lib/queries";
import { ShipmentsTable } from "@/components/ShipmentsTable";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ShipmentsPage() {
  const rows = await shipmentSummary();
  const [agg] = await q<{ units: number; pos: number; returned: number }>(`
    select count(*)::int units, count(distinct po_number)::int pos,
           count(*) filter (where receive_status='Returned')::int returned
    from shipment_items`);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader icon={Truck} title="ส่ง / คืนสินค้า" subtitle="ติดตามการส่งสินค้าระดับหน่วย (SKU)"
        action={<div className="flex gap-2"><LinkBtn href="/shipments/return" variant="ghost">↩ บันทึกคืน</LinkBtn><LinkBtn href="/shipments/new">+ บันทึกส่งสินค้า</LinkBtn></div>} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <Stat label="หน่วยที่ส่ง" value={num(agg.units)} tone="brand" />
        <Stat label="จำนวน PO" value={num(agg.pos)} />
        <Stat label="คืนแล้ว" value={num(agg.returned)} tone="danger" />
      </div>
      <Card title={`สรุปการส่งตาม PO (${rows.length}) · คลิกหัวคอลัมน์เพื่อเรียง`}>
        <ShipmentsTable rows={rows} />
      </Card>
    </div>
  );
}
