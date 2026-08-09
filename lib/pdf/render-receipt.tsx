import { renderToBuffer } from "@react-pdf/renderer";
import { billByReceipt, paymentsForRefs } from "@/lib/queries";
import { ReceiptDocument, type PdfReceiptItem, type ReceiptLang } from "@/lib/pdf/receipt-document";

/** Render one bill's receipt to a PDF buffer. Shared by the download route and
 *  the email action so both produce the exact same document. Returns null when
 *  the receipt number matches no bill. */
export async function renderReceiptPdf(receiptNo: string, lang: ReceiptLang): Promise<Buffer | null> {
  const rows = await billByReceipt(receiptNo);
  if (!rows.length) return null;
  const first = rows[0];
  const items: PdfReceiptItem[] = rows.map((r) => ({
    name: r.item || "-", size: r.size || "", qty: r.qty || 0, discount: r.discount || 0, total: r.total || 0,
  }));
  const tenders = (await paymentsForRefs([receiptNo]))[receiptNo] || [];
  return renderToBuffer(
    <ReceiptDocument receiptNo={receiptNo} date={first.entry_date} time={(first.sale_time || "").slice(0, 5)}
      salesperson={first.author} items={items} paymentChannel={first.payment_channel} tenders={tenders} lang={lang} />,
  );
}
