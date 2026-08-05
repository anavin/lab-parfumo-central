import { PageHeader, Stat, Card } from "@/components/ui";
import { baht, num } from "@/lib/format";
import { q } from "@/lib/db";
import { FlaskConical } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const rows = await q<{ barcode: string; scent: string; grade: string; size: string; sku: string; price: number; sold: number }>(`
    select p.barcode, p.scent, p.grade, p.size, p.sku, p.price::float,
           coalesce(sum(s.qty),0)::float sold
    from products p left join sales s on s.product_id = p.id
    group by p.id order by sold desc, p.scent`);
  const [agg] = await q<{ n: number; grades: number }>(
    `select count(*)::int n, count(distinct grade)::int grades from products`);

  return (
    <div className="p-8 max-w-[1100px] mx-auto">
      <PageHeader icon={FlaskConical} title="สินค้า" subtitle="มาสเตอร์สินค้าจาก Main Data Base" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="จำนวนสินค้า" value={num(agg.n)} tone="brand" />
        <Stat label="ประเภท (Grade)" value={String(agg.grades)} />
      </div>
      <Card title={`รายการสินค้า (${rows.length}) · เรียงตามยอดขาย`}>
        <div className="max-h-[620px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-black/40 text-xs text-left sticky top-0 bg-white"><tr className="border-b"><th className="pb-2">Barcode</th><th className="pb-2">กลิ่น</th><th className="pb-2">Grade</th><th className="pb-2">ขนาด</th><th className="pb-2 text-right">ราคา</th><th className="pb-2 text-right">ขายแล้ว</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.barcode} className="border-b last:border-0">
                  <td className="py-1.5 font-mono text-xs text-black/50">{r.barcode}</td>
                  <td className="py-1.5 font-medium">{r.scent}</td>
                  <td className="py-1.5 text-black/50">{r.grade}</td>
                  <td className="py-1.5 text-black/50">{r.size}</td>
                  <td className="py-1.5 text-right">{r.price ? baht(r.price) : "-"}</td>
                  <td className="py-1.5 text-right font-medium">{num(r.sold)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
