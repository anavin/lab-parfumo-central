import { num } from "@/lib/format";

export type StockRow = { barcode: string; scent: string; size: string; shipped: number; sold: number; returned: number; remaining: number };

const sizeNum = (s: string) => parseInt(String(s ?? "").replace(/[^\d]/g, ""), 10) || 0;

// Printable stock report for a branch: received / sold / returned / remaining per product, so
// staff can count the shelf against it. Plain block flow (prints reliably, no A4 gymnastics).
export function StockReportSheet({ branchLabel, rows, generatedAt }: { branchLabel: string; rows: StockRow[]; generatedAt: string }) {
  const items = [...rows].sort((a, b) => (a.scent || "").localeCompare(b.scent || "", "en") || sizeNum(a.size) - sizeNum(b.size));
  const t = items.reduce((s, r) => ({
    shipped: s.shipped + (Number(r.shipped) || 0), sold: s.sold + (Number(r.sold) || 0),
    returned: s.returned + (Number(r.returned) || 0), remaining: s.remaining + (Number(r.remaining) || 0),
  }), { shipped: 0, sold: 0, returned: 0, remaining: 0 });

  return (
    <div className="stock-sheet mx-auto w-full max-w-[820px] rounded-xl border border-line bg-white text-black shadow-sm px-10 py-8">
      <div className="flex items-start justify-between gap-6 border-b-2 border-black pb-3 mb-5">
        <div>
          <div className="text-[22px] font-extrabold tracking-tight leading-none">รายงานสต๊อกคงเหลือ</div>
          <div className="text-[14px] text-neutral-700 mt-1.5 font-semibold">{branchLabel}</div>
        </div>
        <div className="text-right shrink-0 text-[11px] text-neutral-500">
          ออกรายงานเมื่อ<br />{generatedAt} น.
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center text-sm text-neutral-500">ไม่มีสินค้าในสต๊อกของสาขานี้</div>
      ) : (
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="text-left text-neutral-500 text-[11px] uppercase tracking-wide border-b-2 border-black">
              <th className="pb-1.5 pr-3 font-semibold text-center">#</th>
              <th className="pb-1.5 pr-3 font-semibold">กลิ่น</th>
              <th className="pb-1.5 pr-3 font-semibold whitespace-nowrap">ขนาด</th>
              <th className="pb-1.5 pr-3 font-semibold text-right">รับมา</th>
              <th className="pb-1.5 pr-3 font-semibold text-right">ขายไป</th>
              <th className="pb-1.5 pr-3 font-semibold text-right">คืน</th>
              <th className="pb-1.5 font-semibold text-right">คงเหลือ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={i} className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-center tabular-nums text-neutral-500">{i + 1}</td>
                <td className="py-1.5 pr-3">{r.scent}</td>
                <td className="py-1.5 pr-3 whitespace-nowrap">{r.size}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{num(r.shipped)}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{num(r.sold)}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{r.returned ? num(r.returned) : "-"}</td>
                <td className={"py-1.5 text-right tabular-nums font-semibold " + (r.remaining <= 0 ? "text-neutral-400" : "")}>{num(r.remaining)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black font-bold">
              <td colSpan={3} className="py-2 pr-3 text-right">รวมทั้งสิ้น ({items.length} รายการ)</td>
              <td className="py-2 pr-3 text-right tabular-nums">{num(t.shipped)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{num(t.sold)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{num(t.returned)}</td>
              <td className="py-2 text-right tabular-nums">{num(t.remaining)}</td>
            </tr>
          </tfoot>
        </table>
      )}

      <div className="mt-10 grid grid-cols-2 gap-12 text-[13px]">
        <div className="text-center"><div className="border-t border-black pt-1.5">ผู้นับสต๊อก</div></div>
        <div className="text-center"><div className="border-t border-black pt-1.5">ผู้ตรวจ</div></div>
      </div>
    </div>
  );
}
