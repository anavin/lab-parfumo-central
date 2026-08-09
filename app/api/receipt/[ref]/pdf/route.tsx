import { getCurrentUser } from "@/lib/auth/session";
import { renderReceiptPdf } from "@/lib/pdf/render-receipt";
import { type ReceiptLang } from "@/lib/pdf/receipt-document";

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

  const buffer = await renderReceiptPdf(decoded, lang);
  if (!buffer) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="Receipt-${decoded}-${lang.toUpperCase()}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
