/**
 * ใบกำกับภาษีอย่างย่อ/ใบเสร็จรับเงิน — server-rendered PDF (react-pdf), TH/EN.
 * Rendered on the server so Safari's flaky Save-as-PDF is bypassed entirely:
 * every browser downloads the same PDF. Thai via NotoSansThai (same as requisitions).
 */
import path from "path";
import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { PAYMENTS, SPLIT2 } from "@/lib/payments";

const FONTS_DIR = path.join(process.cwd(), "public", "fonts");
const PUBLIC = path.join(process.cwd(), "public");
let fontRegistered = false;
function registerFontOnce() {
  if (fontRegistered) return;
  Font.register({
    family: "NotoSansThai",
    fonts: [
      { src: path.join(FONTS_DIR, "NotoSansThai-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(FONTS_DIR, "NotoSansThai-Bold.ttf"), fontWeight: "bold" },
    ],
  });
  Font.registerHyphenationCallback((w) => [w]);
  fontRegistered = true;
}

export type ReceiptLang = "th" | "en";
export type PdfReceiptItem = { name: string; size: string; qty: number; discount: number; total: number };
export type PdfReceiptTender = { channel: string; amount: number };

const SHOP = {
  name: "บริษัท ทัช ไดเวอร์เจนซ์ จำกัด",
  branch: "LAB PARFUMO @ Central World",
  address: "288/31 หมู่ 12 ราชาเทวะ บางพลี สมุทรปราการ 10540",
  taxId: "0115564002651", tel: "081-234-1438", web: "www.labparfumo.com", ig: "@labparfumo",
};
const VAT_RATE = 0.07;

const T = {
  th: {
    headOffice: "(สำนักงานใหญ่)", taxId: "เลขประจำตัวผู้เสียภาษี", tel: "โทร.",
    doc: "ใบกำกับภาษีอย่างย่อ/ใบเสร็จรับเงิน",
    salesperson: "พนักงานขาย", date: "วันที่", payment: "ประเภทการชำระเงิน",
    lineDiscount: "ส่วนลด", totalQty: "จำนวนรวม",
    subtotal: "รวมเป็นเงิน", discount: "ส่วนลด", afterDiscount: "จำนวนเงินหลังหักส่วนลด",
    beforeVat: "ราคาไม่รวมภาษีมูลค่าเพิ่ม", vat: "ภาษีมูลค่าเพิ่ม 7%", grandTotal: "รวมทั้งสิ้น",
    // NOTE: react-pdf's Thai shaper drops the leading ร in "ราคารวม" here, so word it
    // without that cluster (renders identically in meaning): "รวมภาษีมูลค่าเพิ่มแล้ว".
    vatIncluded: "รวมภาษีมูลค่าเพิ่มแล้ว (VAT INCLUDED)",
    thanks: "ขอบคุณที่อุดหนุน Thank you", qrTitle: "สแกนเลย ทุกช่องทางออนไลน์", qrSub: "ช้อปออนไลน์ · โปรโมชั่น · ติดต่อเรา",
  },
  en: {
    headOffice: "(Head Office)", taxId: "Tax ID", tel: "Tel.",
    doc: "Abbreviated Tax Invoice / Receipt",
    salesperson: "Salesperson", date: "Date", payment: "Payment",
    lineDiscount: "Discount", totalQty: "Total Qty",
    subtotal: "Subtotal", discount: "Discount", afterDiscount: "After discount",
    beforeVat: "Amount before VAT", vat: "VAT 7%", grandTotal: "Grand Total",
    vatIncluded: "PRICES INCLUDE VAT", thanks: "Thank you", qrTitle: "Scan - all our channels", qrSub: "Shop online - Promotions - Contact",
  },
} as const;
const PAY_EN: Record<string, string> = {
  Cash: "Cash", "K Shop": "QR (K Shop)", "K Shop Credit Card": "Credit Card (QR)",
  "EDC Credit Card": "Credit Card", "EDC Alipay/WeChat": "Alipay / WeChat",
};
const payLabel = (v: string | null | undefined, lang: ReceiptLang) => {
  if (lang === "en") return !v ? "Cash" : v === SPLIT2 ? "Split payment" : (PAY_EN[v] || v);
  return !v ? "เงินสด" : v === SPLIT2 ? "จ่าย 2 ช่องทาง" : (PAYMENTS.find((p) => p.v === v)?.label.replace(/\s*\(.*\)$/, "") || v);
};
const nf = (n: number) => (Math.round((n || 0) * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ddmmyyyy = (iso: string) => { const [y, m, d] = (iso || "").split("-"); return `${d}/${m}/${y}`; };

const C = { ink: "#000", muted: "#555", faint: "#777" };
const s = StyleSheet.create({
  page: { fontFamily: "NotoSansThai", fontSize: 9, color: C.ink, paddingVertical: 24, alignItems: "center" },
  slip: { width: 300, paddingHorizontal: 20 },
  center: { textAlign: "center" },
  logo: { width: 150, height: 58, objectFit: "contain", alignSelf: "center", marginBottom: 6 },
  company: { fontSize: 11, fontWeight: "bold", textAlign: "center" },
  small: { fontSize: 9, textAlign: "center" },
  addr: { fontSize: 8, color: C.muted, textAlign: "center", marginTop: 2 },
  bold: { fontWeight: "bold" },
  solid: { borderTopWidth: 1, borderTopColor: C.ink, marginVertical: 8 },
  dashed: { borderTopWidth: 1, borderTopColor: "#999", borderStyle: "dashed", marginVertical: 8 },
  docTitle: { fontSize: 10, fontWeight: "bold" },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 1 },
  itemRow: { flexDirection: "row", marginTop: 3 },
  qty: { width: 18 },
  name: { flex: 1 },
  amt: { textAlign: "right" },
  qr: { width: 96, height: 96, alignSelf: "center", marginTop: 8 },
});

function Line({ dashed }: { dashed?: boolean }) { return <View style={dashed ? s.dashed : s.solid} />; }
function KV({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <View style={s.row}>
      <Text style={[strong ? s.bold : {}, strong ? { fontSize: 11 } : { color: C.muted }]}>{k}</Text>
      <Text style={strong ? [s.bold, { fontSize: 11 }] : {}}>{v}</Text>
    </View>
  );
}

export function ReceiptDocument({ receiptNo, date, time, salesperson, items, paymentChannel, tenders, lang = "th" }: {
  receiptNo: string; date: string; time?: string; salesperson: string; items: PdfReceiptItem[];
  paymentChannel?: string | null; tenders?: PdfReceiptTender[]; lang?: ReceiptLang;
}) {
  registerFontOnce();
  const t = T[lang];
  const lineFull = (it: PdfReceiptItem) => it.total + it.discount;
  const gross = items.reduce((a, it) => a + lineFull(it), 0);
  const discount = items.reduce((a, it) => a + it.discount, 0);
  const net = items.reduce((a, it) => a + it.total, 0);
  const exVat = net / (1 + VAT_RATE);
  const vat = net - exVat;
  const totalQty = items.reduce((a, it) => a + it.qty, 0);
  const payMethod = tenders && tenders.length >= 2
    ? tenders.map((x) => payLabel(x.channel, lang)).join(", ")
    : payLabel(paymentChannel, lang);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.slip}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image style={s.logo} src={path.join(PUBLIC, "lab-parfumo-logo.png")} />
          <Text style={s.company}>{SHOP.name}</Text>
          <Text style={s.small}>{t.headOffice}</Text>
          <Text style={s.small}>{SHOP.branch}</Text>
          <Text style={s.addr}>{SHOP.address}</Text>
          <Text style={[s.small, s.bold, { marginTop: 4 }]}>{t.taxId} {SHOP.taxId}</Text>
          <Text style={[s.small, s.bold]}>{t.tel} {SHOP.tel}</Text>

          <Line />
          <Text style={s.docTitle}>{t.doc}</Text>
          <Text style={{ color: C.muted }}>{receiptNo}</Text>

          <Line dashed />
          <KV k={t.salesperson} v={salesperson || "-"} />
          <KV k={t.date} v={`${ddmmyyyy(date)}${time ? ` ${time}` : ""}`} />
          <KV k={t.payment} v={payMethod} />

          <Line dashed />
          {items.map((it, i) => (
            <View key={i}>
              <View style={s.itemRow}>
                <Text style={s.qty}>{Math.round(it.qty)}</Text>
                <Text style={s.name}>{it.name}{it.size ? ` ${it.size}` : ""}</Text>
                <Text style={[s.amt, { width: 60 }]}>{nf(lineFull(it))}</Text>
              </View>
              {it.discount > 0 && (
                <View style={s.itemRow}>
                  <Text style={s.qty}> </Text>
                  <Text style={[s.name, { color: C.faint }]}>{t.lineDiscount}</Text>
                  <Text style={[s.amt, { width: 60, color: C.faint }]}>-{nf(it.discount)}</Text>
                </View>
              )}
            </View>
          ))}

          <Line dashed />
          <Text style={[s.bold, { marginBottom: 4 }]}>{t.totalQty} {Math.round(totalQty)}</Text>
          <KV k={t.subtotal} v={nf(gross)} />
          <KV k={t.discount} v={nf(discount)} />
          <KV k={t.afterDiscount} v={nf(net)} />
          <KV k={t.beforeVat} v={nf(exVat)} />
          <KV k={t.vat} v={nf(vat)} />
          <Line />
          <KV k={t.grandTotal} v={nf(net)} strong />

          <View style={{ borderTopWidth: 1, borderTopColor: C.ink, marginTop: 8, paddingTop: 8 }}>
            <Text style={[s.center, s.bold]}>{t.vatIncluded}</Text>
          </View>

          <Text style={[s.center, { marginTop: 10, color: C.muted }]}>{t.thanks}</Text>
          <Text style={[s.center, { fontSize: 8, color: C.faint, marginTop: 2 }]}>{t.tel} {SHOP.tel} · {SHOP.web}</Text>
          <Text style={[s.center, { fontSize: 8, color: C.faint }]}>IG & LINE {SHOP.ig}</Text>

          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image style={s.qr} src={path.join(PUBLIC, "lab-parfumo-qr.png")} />
          <Text style={[s.center, { fontSize: 8, marginTop: 3 }]}>{t.qrTitle}</Text>
          <Text style={[s.center, { fontSize: 8, color: C.faint }]}>{t.qrSub}</Text>
        </View>
      </Page>
    </Document>
  );
}
