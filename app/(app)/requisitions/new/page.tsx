import { PageHeader } from "@/components/ui";
import { RequisitionForm } from "@/components/RequisitionForm";
import { listBranches } from "@/lib/actions/lookups";
import { stockLive } from "@/lib/queries";

export const dynamic = "force-dynamic";

const LOW_THRESHOLD = 3;      // remaining ≤ this = low/out
const REORDER_TO = 12;        // suggest topping each low item back up to this

export default async function NewRequisition({ searchParams }: { searchParams: Promise<{ prefill?: string }> }) {
  const sp = await searchParams;
  const branches = await listBranches();

  // Prefill with the low/out-of-stock items (with a suggested top-up qty) when
  // arriving from the stock alert.
  let initial: any = undefined;
  let subtitle = "ระบบจะออกเลข PO อัตโนมัติ";
  if (sp.prefill === "lowstock") {
    const low = (await stockLive()).filter((r) => Number(r.remaining) <= LOW_THRESHOLD);
    if (low.length) {
      initial = {
        remark: "เบิกเติมสินค้าใกล้หมด",
        items: low.map((r) => ({
          key: 0, barcode: r.barcode, scent: r.scent, size: r.size,
          qty: Math.max(1, REORDER_TO - Number(r.remaining)), product_id: null,
        })),
      };
      subtitle = `เติมสินค้าใกล้หมด ${low.length} รายการ · ปรับจำนวนได้ก่อนบันทึก`;
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1000px] mx-auto">
      <PageHeader title="สร้างใบเบิกใหม่" subtitle={subtitle} />
      <RequisitionForm branches={branches} mode="new" initial={initial} />
    </div>
  );
}
