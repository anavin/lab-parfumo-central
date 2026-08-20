import { FileUp } from "lucide-react";
import { requirePermission } from "@/lib/auth/require-user";
import { PageHeader } from "@/components/ui";
import { StockImport } from "@/components/StockImport";

export const dynamic = "force-dynamic";

export default async function StockImportPage() {
  await requirePermission("requisitions");
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader icon={FileUp} title="นำเข้าสต๊อก CTW"
        subtitle="อัปโหลดไฟล์ Excel คงเหลือ → แก้ไข → ส่งให้แอดมินอนุมัติ แล้วใช้เป็นสต๊อก CTW" />
      <StockImport />
    </div>
  );
}
