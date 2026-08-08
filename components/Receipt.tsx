import { PAYMENTS, SPLIT2 } from "@/lib/payments";

// Abbreviated tax invoice / receipt (ใบกำกับภาษีอย่างย่อ/ใบเสร็จรับเงิน) — thermal-slip
// style. Prices are VAT-inclusive 7%. Shop details are the real legal entity.
const SHOP = {
  name: "บริษัท ทัช ไดเวอร์เจนซ์ จำกัด",
  taxBranch: "สำนักงานใหญ่",   // เปลี่ยนเป็น "สาขาที่ 00001" ถ้าจดทะเบียนเป็นสาขา
  branch: "LAB PARFUMO @ Central World",
  address: "288/31 หมู่ 12 ราชาเทวะ บางพลี สมุทรปราการ 10540",
  taxId: "0115564002651",
  tel: "081-234-1438",
  web: "www.labparfumo.com",
  ig: "@labparfumo",
};
const VAT_RATE = 0.07;

const nf = (n: number) => (Math.round((n || 0) * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ddmmyyyy = (iso: string) => { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };
const payLabel = (v?: string | null) => !v ? "เงินสด" : v === SPLIT2 ? "จ่าย 2 ช่องทาง" : (PAYMENTS.find((p) => p.v === v)?.label.replace(/\s*\(.*\)$/, "") || v);

export type ReceiptItem = { name: string; size: string; qty: number; unitPrice: number; discount: number; total: number };
export type ReceiptTender = { channel: string; amount: number };

export function Receipt({ receiptNo, date, time, salesperson, items, paymentChannel, tenders }: {
  receiptNo: string; date: string; time?: string; salesperson: string; items: ReceiptItem[];
  paymentChannel?: string; tenders?: ReceiptTender[];
}) {
  // full (before discount) = net + discount, so it always reconciles (gross − discount = net)
  // even for legacy rows where qty×unit_price drifts from the stored total.
  const lineFull = (it: ReceiptItem) => it.total + it.discount;
  const gross = items.reduce((s, it) => s + lineFull(it), 0);   // ก่อนหักส่วนลด
  const discount = items.reduce((s, it) => s + it.discount, 0);
  const net = items.reduce((s, it) => s + it.total, 0);                  // หลังหักส่วนลด = รวมทั้งสิ้น
  const exVat = net / (1 + VAT_RATE);
  const vat = net - exVat;
  const totalQty = items.reduce((s, it) => s + it.qty, 0);
  const payMethod = tenders && tenders.length >= 2
    ? tenders.map((t) => payLabel(t.channel)).join(", ")
    : payLabel(paymentChannel);

  const Row = ({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) => (
    <div className={`flex justify-between gap-3 ${strong ? "font-bold text-[13px]" : "text-[12px]"}`}>
      <span className="text-neutral-600">{label}</span><span className="tabular-nums">{value}</span>
    </div>
  );

  return (
    <div className="receipt mx-auto w-[302px] bg-white text-black px-5 py-6 font-sans">
      {/* header */}
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lab-parfumo-logo.png" alt="LAB PARFUMO" className="mx-auto w-[155px] max-w-[70%] h-auto object-contain" />
        <div className="text-[13px] font-bold mt-2 leading-snug">{SHOP.name}</div>
        <div className="text-[12px] leading-snug">({SHOP.taxBranch})</div>
        <div className="text-[12px] leading-snug">{SHOP.branch}</div>
        <div className="text-[11px] text-neutral-700 mt-1 leading-snug">{SHOP.address}</div>
        <div className="text-[12px] font-semibold mt-2">เลขผู้เสียภาษี {SHOP.taxId}</div>
        <div className="text-[12px] font-semibold">โทร. {SHOP.tel}</div>
      </div>

      <div className="border-t border-black my-3" />
      <div className="text-[13px] font-bold">ใบกำกับภาษีอย่างย่อ/ใบเสร็จรับเงิน</div>
      <div className="text-[12px] text-neutral-700">{receiptNo}</div>

      <div className="border-t border-dashed border-neutral-400 my-3" />
      <div className="text-[12px] space-y-1">
        <div className="flex justify-between gap-3"><span className="font-semibold">พนักงานขาย</span><span className="text-right">{salesperson || "-"}</span></div>
        <div className="flex justify-between gap-3"><span className="font-semibold">วันที่</span><span className="tabular-nums text-right">{ddmmyyyy(date)}{time ? ` ${time}` : ""}</span></div>
        <div className="flex justify-between gap-3"><span className="font-semibold">ประเภทการชำระเงิน</span><span className="text-right">{payMethod}</span></div>
      </div>

      <div className="border-t border-dashed border-neutral-400 my-3" />
      {/* items: qty · name · amount (gross per line) */}
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="text-[12px]">
            <div className="flex gap-2">
              <span className="w-7 shrink-0 tabular-nums">{Math.round(it.qty)}</span>
              <span className="flex-1 min-w-0">{it.name}{it.size ? ` ${it.size}` : ""}</span>
              <span className="tabular-nums text-right">{nf(lineFull(it))}</span>
            </div>
            {it.discount > 0 && (
              <div className="flex gap-2 text-neutral-500">
                <span className="w-7 shrink-0" />
                <span className="flex-1 min-w-0 pl-2">ส่วนลด</span>
                <span className="tabular-nums text-right">-{nf(it.discount)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-neutral-400 my-3" />
      <div className="text-[12px] font-semibold mb-2">จำนวนรวม {Math.round(totalQty)}</div>
      <div className="space-y-1">
        <Row label="รวมเป็นเงิน" value={nf(gross)} />
        <Row label="ส่วนลด" value={nf(discount)} />
        <Row label="จำนวนเงินหลังหักส่วนลด" value={nf(net)} />
        <Row label="ราคาไม่รวมภาษีมูลค่าเพิ่ม" value={nf(exVat)} />
        <Row label="ภาษีมูลค่าเพิ่ม 7%" value={nf(vat)} />
      </div>

      <div className="border-t border-black mt-3 pt-2">
        <Row label="รวมทั้งสิ้น" value={nf(net)} strong />
      </div>
      <div className="border-t border-double border-black mt-3 pt-3 text-center text-[12px] font-semibold">ราคารวมภาษีมูลค่าเพิ่มแล้ว (VAT INCLUDED)</div>

      <div className="text-center mt-4">
        <div className="text-[12px] text-neutral-700 font-medium">ขอบคุณที่อุดหนุน 🙏 Thank you</div>
        <div className="text-[10px] text-neutral-500 mt-1 leading-relaxed">โทร. {SHOP.tel} · {SHOP.web}<br />IG {SHOP.ig}</div>
      </div>
    </div>
  );
}
