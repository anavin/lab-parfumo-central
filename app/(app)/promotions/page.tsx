import { Tag } from "lucide-react";
import { requirePermission } from "@/lib/auth/require-user";
import { listPromotions } from "@/lib/actions/promotions";
import { productGradeSizes } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { PromotionManager } from "@/components/PromotionManager";

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  await requirePermission("products");
  const [promotions, dims] = await Promise.all([listPromotions(), productGradeSizes()]);
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader icon={Tag} title="โปรโมชัน"
        subtitle="ตั้งราคาพิเศษตามเกรด × ขนาด ในแต่ละช่วงเวลา — ระบบเติมราคาให้อัตโนมัติตอนขาย" />
      <PromotionManager promotions={promotions} grades={dims.grades} sizes={dims.sizes} />
    </div>
  );
}
