import { PageHeader, Stat, Card, Badge } from "@/components/ui";
import { num } from "@/lib/format";
import { stockLive, stockSummary } from "@/lib/queries";
import { Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const [rows, s] = await Promise.all([stockLive(), stockSummary()]);
  const tone = (r: number): "danger" | "warn" | "success" => (r <= 0 ? "danger" : r <= 3 ? "warn" : "success");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px] mx-auto">
      <PageHeader icon={Package} title="สต๊อกคงเหลือ" subtitle="คำนวณสดจาก ส่งไป − ขาย (อัปเดตอัตโนมัติเมื่อบันทึกส่ง/ขาย)" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Stat label="คงเหลือรวม" value={num(s.remaining)} tone="success" />
        <Stat label="ส่งไปทั้งหมด" value={num(s.shipped)} />
        <Stat label="ขายไปแล้ว" value={num(s.sold)} />
        <Stat label="ใกล้หมด (≤3)" value={String(s.low)} tone="brand" />
        <Stat label="หมดสต๊อก" value={String(s.out)} tone="danger" />
      </div>
      <Card title={`รายการสินค้า (${rows.length} SKU) · เรียงตามคงเหลือน้อยสุด`}>
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-black/40 text-xs text-left sticky top-0 bg-white"><tr className="border-b">
              <th className="pb-2">กลิ่น</th><th className="pb-2">ขนาด</th>
              <th className="pb-2 text-right">ส่งไป</th><th className="pb-2 text-right">ขาย</th>
              <th className="pb-2 text-right">คืน</th><th className="pb-2 text-right">คงเหลือ</th><th className="pb-2">สถานะ</th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1.5 font-medium">{r.scent}</td>
                  <td className="py-1.5 text-black/50">{r.size}</td>
                  <td className="py-1.5 text-right text-black/60">{num(r.shipped)}</td>
                  <td className="py-1.5 text-right text-black/60">{num(r.sold)}</td>
                  <td className="py-1.5 text-right text-black/40">{r.returned ? num(r.returned) : "-"}</td>
                  <td className="py-1.5 text-right font-semibold">{num(r.remaining)}</td>
                  <td className="py-1.5"><Badge tone={tone(r.remaining)}>{r.remaining <= 0 ? "หมด" : r.remaining <= 3 ? "ใกล้หมด" : "ปกติ"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
