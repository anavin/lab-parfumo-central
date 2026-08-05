import { PageHeader } from "@/components/ui";
import { ShipmentForm } from "@/components/ShipmentForm";
import { listPOs } from "@/lib/actions/lookups";

export const dynamic = "force-dynamic";

export default async function NewShipment() {
  const pos = await listPOs();
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1000px] mx-auto">
      <PageHeader title="บันทึกการส่งสินค้า" subtitle="เลือก PO แล้วใส่รหัสหน่วยสินค้าที่ส่งจริง" />
      <ShipmentForm pos={pos} />
    </div>
  );
}
