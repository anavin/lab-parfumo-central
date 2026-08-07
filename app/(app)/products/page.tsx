import Link from "next/link";
import { PageHeader, Stat } from "@/components/ui";
import { num } from "@/lib/format";
import { q } from "@/lib/db";
import { FlaskConical, Barcode } from "lucide-react";
import { ProductsManager, type ProductRow } from "@/components/ProductsManager";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const rows = await q<ProductRow>(`
    select p.id, p.barcode, p.scent, p.grade, p.size, p.sku, p.price::float,
           coalesce(sum(s.qty),0)::float sold
    from products p left join sales s on s.product_id = p.id
    group by p.id order by sold desc, p.scent`);
  const [agg] = await q<{ n: number; grades: number }>(
    `select count(*)::int n, count(distinct grade)::int grades from products`);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1300px] mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <PageHeader icon={FlaskConical} title="สินค้า" subtitle="เพิ่ม / แก้ไขสินค้าและบาร์โค้ด" />
        <Link href="/products/barcodes"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-line text-sm font-medium text-ink hover:bg-canvas shrink-0">
          <Barcode className="w-4 h-4" /> พิมพ์บาร์โค้ด
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-6">
        <Stat label="จำนวนสินค้า" value={num(agg.n)} tone="brand" />
        <Stat label="ประเภท (Grade)" value={String(agg.grades)} />
      </div>
      <ProductsManager rows={rows} />
    </div>
  );
}
