import { requirePermission } from "@/lib/auth/require-user";
import { isBranch, branchName } from "@/lib/branches";

// One-click stock-report PDF — renders /print/stock/[branch] with headless Chrome. Same method
// as the requisition PDF (see memory: pdf-download-puppeteer).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function launchBrowser() {
  const puppeteer = await import("puppeteer-core");
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true });
  }
  const executablePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  return puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
}

export async function GET(req: Request, { params }: { params: Promise<{ branch: string }> }) {
  await requirePermission("stock");
  const { branch } = await params;
  if (!isBranch(branch)) return new Response("ไม่พบสาขา", { status: 404 });

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : new URL(req.url).origin;
  const url = `${origin}/print/stock/${encodeURIComponent(branch)}`;
  const cookie = req.headers.get("cookie") ?? "";

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    if (cookie) await page.setExtraHTTPHeaders({ cookie });
    await page.emulateMediaType("print");
    await page.goto(url, { waitUntil: "networkidle0", timeout: 45000 });
    await page.evaluate(() => (document as any).fonts?.ready).catch(() => {});
    await new Promise((r) => setTimeout(r, 200));
    const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true });
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Stock-${branchName(branch)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[stock pdf]", e);
    return new Response("สร้าง PDF ไม่สำเร็จ — ลองใช้ปุ่มพิมพ์แทน\n\n" + (e as Error)?.message, { status: 500 });
  } finally {
    await browser?.close().catch(() => {});
  }
}
