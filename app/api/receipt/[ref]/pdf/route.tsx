import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentUser } from "@/lib/auth/session";
import { billByReceipt, paymentsForRefs } from "@/lib/queries";
import { ReceiptDocument, type PdfReceiptItem, type ReceiptLang } from "@/lib/pdf/receipt-document";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { ref } = await params;
  const decoded = decodeURIComponent(ref);
  const sp = new URL(req.url).searchParams;
  const lang: ReceiptLang = sp.get("lang") === "en" ? "en" : "th";
  // disp=inline → view in the browser's PDF viewer (for printing); default = download
  const disposition = sp.get("disp") === "inline" ? "inline" : "attachment";

  const rows = await billByReceipt(decoded);
  if (!rows.length) return new Response("Not found", { status: 404 });

  const first = rows[0];
  const items: PdfReceiptItem[] = rows.map((r) => ({
    name: r.item || "-", size: r.size || "", qty: r.qty || 0, discount: r.discount || 0, total: r.total || 0,
  }));
  const tenders = (await paymentsForRefs([decoded]))[decoded] || [];

  const buffer = await renderToBuffer(
    <ReceiptDocument receiptNo={decoded} date={first.entry_date} time={(first.sale_time || "").slice(0, 5)}
      salesperson={first.author} items={items} paymentChannel={first.payment_channel} tenders={tenders} lang={lang} />,
  );
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="Receipt-${decoded}-${lang.toUpperCase()}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
