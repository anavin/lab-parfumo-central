import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/require-user";
import { stockLive } from "@/lib/queries";
import { isBranch, branchName } from "@/lib/branches";
import { StockReportSheet } from "@/components/StockReportSheet";
import { PrintNow } from "@/components/PrintNow";

// Standalone print page — same shell-free approach as the daily report, so browser print and
// the one-click PDF (Puppeteer) both come out clean.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params;
  return { title: `Stock-${branch}` };
}

export default async function StockReportPrintPage({ params }: { params: Promise<{ branch: string }> }) {
  await requirePermission("stock");
  const { branch } = await params;
  if (!isBranch(branch)) notFound();
  const rows = await stockLive(branch);
  const generatedAt = new Date().toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok",
  });

  return (
    <div className="min-h-screen bg-white text-black" style={{ fontFamily: "'IBM Plex Sans Thai','Sarabun',sans-serif" }}>
      <div className="mx-auto w-full max-w-[860px] px-4 py-4">
        <div className="mb-4 no-print"><PrintNow title={`Stock-${branchName(branch)}`} /></div>
        <StockReportSheet branchLabel={branchName(branch)} rows={rows} generatedAt={generatedAt} />
      </div>
    </div>
  );
}
