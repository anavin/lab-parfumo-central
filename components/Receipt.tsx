import { PAYMENTS, SPLIT2 } from "@/lib/payments";
import { LOGO_DATA_URI, QR_DATA_URI } from "@/lib/receipt-assets";

// Abbreviated tax invoice / receipt (ใบกำกับภาษีอย่างย่อ/ใบเสร็จรับเงิน) — thermal-slip
// style. Prices are VAT-inclusive 7%. Shop details are the real legal entity.
// Bilingual (TH/EN) — labels switch by `lang`; legal identifiers stay as registered.
const SHOP = {
  branch: "LAB PARFUMO @ Central World",
  taxId: "0115564002651",
  tel: "081-234-1438",
  web: "www.labparfumo.com",
  ig: "@labparfumo",
};
const VAT_RATE = 0.07;

export type ReceiptLang = "th" | "en";
const T = {
  th: {
    company: "บริษัท ทัช ไดเวอร์เจนซ์ จำกัด",
    address: "288/31 หมู่ที่ 12 ตําบลราชาเทวะ อําเภอบางพลี จังหวัดสมุทรปราการ 10540",
    headOffice: "(สำนักงานใหญ่)", taxId: "เลขประจำตัวผู้เสียภาษี", tel: "โทร.",
    doc: "ใบกำกับภาษีอย่างย่อ/ใบเสร็จรับเงิน",
    salesperson: "พนักงานขาย", date: "วันที่", payment: "ประเภทการชำระเงิน",
    lineDiscount: "ส่วนลด", totalQty: "จำนวนรวม",
    subtotal: "รวมเป็นเงิน", discount: "ส่วนลด", afterDiscount: "จำนวนเงินหลังหักส่วนลด",
    beforeVat: "ราคาไม่รวมภาษีมูลค่าเพิ่ม", vat: "ภาษีมูลค่าเพิ่ม 7%", grandTotal: "รวมทั้งสิ้น",
    vatIncluded: "ราคารวมภาษีมูลค่าเพิ่มแล้ว (VAT INCLUDED)",
    thanks: "ขอบคุณที่อุดหนุน 🙏 Thank you",
    qrTitle: "สแกนเลย · ทุกช่องทางออนไลน์", qrSub: "ช้อปออนไลน์ · โปรโมชั่น · ติดต่อเรา",
  },
  en: {
    company: "TOUCH DIVERGENCE CO., LTD",
    address: "288/31 Moo 12, Racha Thewa Sub District, Bang Phli District, Samut Prakan 10540",
    headOffice: "(Head Office)", taxId: "Tax ID", tel: "Tel.",
    doc: "Abbreviated Tax Invoice / Receipt",
    salesperson: "Salesperson", date: "Date", payment: "Payment",
    lineDiscount: "Discount", totalQty: "Total Qty",
    subtotal: "Subtotal", discount: "Discount", afterDiscount: "After discount",
    beforeVat: "Amount before VAT", vat: "VAT 7%", grandTotal: "Grand Total",
    vatIncluded: "PRICES INCLUDE VAT",
    thanks: "Thank you 🙏",
    qrTitle: "Scan · all our channels", qrSub: "Shop online · Promotions · Contact",
  },
} as const;

// English display names for the payment channels (values stay Thai in the DB).
const PAY_EN: Record<string, string> = {
  Cash: "Cash", "K Shop": "QR (K Shop)", "K Shop Credit Card": "Credit Card (QR)",
  "EDC Credit Card": "Credit Card", "EDC Alipay/WeChat": "Alipay / WeChat",
};

const nf = (n: number) => (Math.round((n || 0) * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ddmmyyyy = (iso: string) => { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };
const payLabel = (v: string | null | undefined, lang: ReceiptLang) => {
  if (lang === "en") return !v ? "Cash" : v === SPLIT2 ? "Split payment" : (PAY_EN[v] || v);
  return !v ? "เงินสด" : v === SPLIT2 ? "จ่าย 2 ช่องทาง" : (PAYMENTS.find((p) => p.v === v)?.label.replace(/\s*\(.*\)$/, "") || v);
};

export type ReceiptItem = { name: string; size: string; qty: number; unitPrice: number; discount: number; total: number };
export type ReceiptTender = { channel: string; amount: number };

export function Receipt({ receiptNo, date, time, salesperson, items, paymentChannel, tenders, lang = "th" }: {
  receiptNo: string; date: string; time?: string; salesperson: string; items: ReceiptItem[];
  paymentChannel?: string; tenders?: ReceiptTender[]; lang?: ReceiptLang;
}) {
  const t = T[lang];
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
    ? tenders.map((tn) => payLabel(tn.channel, lang)).join(", ")
    : payLabel(paymentChannel, lang);

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
        <img src={LOGO_DATA_URI} alt="LAB PARFUMO" className="mx-auto w-[155px] max-w-[70%] h-auto object-contain" />
        <div className="text-[13px] font-bold mt-2 leading-snug">{t.company}</div>
        <div className="text-[12px] leading-snug">{t.headOffice}</div>
        <div className="text-[12px] leading-snug">{SHOP.branch}</div>
        <div className="text-[11px] text-neutral-700 mt-1 leading-snug">{t.address}</div>
        <div className="text-[12px] font-semibold mt-2">{t.taxId} {SHOP.taxId}</div>
        <div className="text-[12px] font-semibold">{t.tel} {SHOP.tel}</div>
      </div>

      <div className="border-t border-black my-3" />
      <div className="text-[13px] font-bold">{t.doc}</div>
      <div className="text-[12px] text-neutral-700">{receiptNo}</div>

      <div className="border-t border-dashed border-neutral-400 my-3" />
      <div className="text-[12px] space-y-1">
        <div className="flex justify-between gap-3"><span className="font-semibold">{t.salesperson}</span><span className="text-right">{salesperson || "-"}</span></div>
        <div className="flex justify-between gap-3"><span className="font-semibold">{t.date}</span><span className="tabular-nums text-right">{ddmmyyyy(date)}{time ? ` ${time}` : ""}</span></div>
        <div className="flex justify-between gap-3"><span className="font-semibold">{t.payment}</span><span className="text-right">{payMethod}</span></div>
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
                <span className="flex-1 min-w-0 pl-2">{t.lineDiscount}</span>
                <span className="tabular-nums text-right">-{nf(it.discount)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-neutral-400 my-3" />
      <div className="text-[12px] font-semibold mb-2">{t.totalQty} {Math.round(totalQty)}</div>
      <div className="space-y-1">
        <Row label={t.subtotal} value={nf(gross)} />
        <Row label={t.discount} value={nf(discount)} />
        <Row label={t.afterDiscount} value={nf(net)} />
        <Row label={t.beforeVat} value={nf(exVat)} />
        <Row label={t.vat} value={nf(vat)} />
      </div>

      <div className="border-t border-black mt-3 pt-2">
        <Row label={t.grandTotal} value={nf(net)} strong />
      </div>
      <div className="border-t border-double border-black mt-3 pt-3 text-center text-[12px] font-semibold">{t.vatIncluded}</div>

      <div className="text-center mt-4">
        <div className="text-[12px] text-neutral-700 font-medium">{t.thanks}</div>
        <div className="text-[10px] text-neutral-500 mt-1 leading-relaxed">{t.tel} {SHOP.tel} · {SHOP.web}<br />IG &amp; LINE {SHOP.ig}</div>
      </div>

      {/* follow / review QR (Linktree) */}
      <div className="text-center mt-4 pt-3 border-t border-dashed border-neutral-400">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={QR_DATA_URI} alt="Lab Parfumo QR" className="mx-auto w-[110px] h-[110px] object-contain" />
        <div className="text-[11px] text-neutral-700 font-medium mt-1">{t.qrTitle}</div>
        <div className="text-[10px] text-neutral-500">{t.qrSub}</div>
      </div>
    </div>
  );
}
