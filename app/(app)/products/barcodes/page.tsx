import { Barcode as BarcodeIcon } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { q } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-user";
import { BarcodeLabels, type BarcodeRow } from "@/components/BarcodeLabels";

export const dynamic = "force-dynamic";

export default async function BarcodesPage() {
  await requirePermission("products");
  const rows = await q<BarcodeRow>(
    `select id, barcode, scent, coalesce(grade,'') grade, coalesce(size,'') size,
            coalesce(sku,'') sku, price::float price
     from products order by scent, size`);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px] mx-auto">
      <PageHeader icon={BarcodeIcon} title="สร้าง / พิมพ์บาร์โค้ด"
        subtitle="เลือกสินค้า ระบุจำนวนฉลาก แล้วพิมพ์เป็นสติกเกอร์ติดขวดได้เลย" />
      <BarcodeLabels rows={rows} />
    </div>
  );
}
