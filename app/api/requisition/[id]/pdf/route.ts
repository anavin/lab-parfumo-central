import { requirePermission } from "@/lib/auth/require-user";
import { q } from "@/lib/db";

// One-click PDF: render the SAME /print/requisition page with headless Chrome and stream the
// PDF back as a download — byte-for-byte the preview, no browser print dialog.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function launchBrowser() {
  const puppeteer = await import("puppeteer-core");
  if (process.env.VERCEL) {
    // Vercel serverless → bundled headless chromium
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
  // local dev → a locally installed Chrome
  const executablePath = process.env.CHROME_PATH
    || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  return puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("requisitions");
  const { id } = await params;
  const [po] = await q<{ po_number: string }>(`select po_number from purchase_orders where id=$1`, [Number(id)]);
  if (!po) return new Response("ไม่พบใบเบิก", { status: 404 });

  // resolve the public origin (behind Vercel's proxy req.url host can be internal)
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : new URL(req.url).origin;
  const url = `${origin}/print/requisition/${Number(id)}`;
  const cookie = req.headers.get("cookie") ?? "";   // forward the session so the print page authenticates

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    if (cookie) await page.setExtraHTTPHeaders({ cookie });
    await page.emulateMediaType("print");
    await page.goto(url, { waitUntil: "networkidle0", timeout: 45000 });
    await page.evaluate(() => (document as any).fonts?.ready).catch(() => {});
    await new Promise((r) => setTimeout(r, 300));   // let the barcode SVG finish drawing
    const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true });
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${po.po_number}-Requisition.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[requisition pdf]", e);
    return new Response("สร้าง PDF ไม่สำเร็จ — ลองใช้ปุ่มพิมพ์แทน", { status: 500 });
  } finally {
    await browser?.close().catch(() => {});
  }
}
