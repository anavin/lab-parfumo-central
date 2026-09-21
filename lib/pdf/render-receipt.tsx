import { renderToBuffer } from "@react-pdf/renderer";
import { billByReceipt, paymentsForRefs, promoLineInfo } from "@/lib/queries";
import { ReceiptDocument, type PdfReceiptItem, type ReceiptLang } from "@/lib/pdf/receipt-document";

/** Render one bill's receipt to a PDF buffer. Shared by the download route and
 *  the email action so both produce the exact same document. Returns null when
 *  the receipt number matches no bill. */
export async function renderReceiptPdf(receiptNo: string, lang: ReceiptLang, thermal = false): Promise<Buffer | null> {
  const rows = await billByReceipt(receiptNo);
  if (!rows.length) return null;
  const first = rows[0];
  const promoInfo = await promoLineInfo(first.entry_date, rows.map((r) => r.barcode));
  const items: PdfReceiptItem[] = rows.map((r) => {
    const pi = r.barcode ? promoInfo[r.barcode] : undefined;
    const isPromo = !!pi && Math.round(r.unit_price || 0) === Math.round(pi.special);
    const saving = isPromo ? (pi!.normal - (r.unit_price || 0)) * (r.qty || 0) : 0;   // fold promo into discount → gross shows normal price
    return { name: r.item || "-", size: r.size || "", qty: r.qty || 0, discount: (r.discount || 0) + saving, total: r.total || 0, promo: isPromo };
  });
  const tenders = (await paymentsForRefs([receiptNo]))[receiptNo] || [];
  return renderToBuffer(
    <ReceiptDocument receiptNo={receiptNo} date={first.entry_date} time={(first.sale_time || "").slice(0, 5)}
      salesperson={first.author} items={items} paymentChannel={first.payment_channel} tenders={tenders} lang={lang} thermal={thermal} />,
  );
}
