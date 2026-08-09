import { requirePermission } from "@/lib/auth/require-user";
import { dailyReport, dailySaleRows } from "@/lib/queries";
import { DailyReportSheet } from "@/components/DailyReportSheet";
import { PrintNow } from "@/components/PrintNow";

// Standalone, shell-free print page. Rendered outside the (app) layout so there's
// no sidebar / dark theme / complex CSS — a clean white page that Safari prints
// reliably (unlike printing the full /review page, which Safari renders blank).
export const dynamic = "force-dynamic";

const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

// the <title> becomes the default PDF filename in the browser's Save-as-PDF
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ date?: string; source?: string }> }) {
  const sp = await searchParams;
  const date = (sp.date || "").match(/^\d{4}-\d{2}-\d{2}$/)?.[0] || bkkToday();
  const source = sp.source || "CTW";
  return { title: `${source}-Daily-Report-${date}` };
}

export default async function DailyReportPrintPage({ searchParams }: { searchParams: Promise<{ date?: string; source?: string; detail?: string }> }) {
  await requirePermission("review");
  const sp = await searchParams;
  const date = (sp.date || "").match(/^\d{4}-\d{2}-\d{2}$/)?.[0] || bkkToday();
  const source = sp.source || "CTW";
  const showDetail = sp.detail !== "0";

  const [data, rows] = await Promise.all([dailyReport(date, source, null), dailySaleRows(date, source)]);
  const generatedAt = new Date().toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok",
  });

  return (
    <div className="min-h-screen bg-white text-black" style={{ fontFamily: "'IBM Plex Sans Thai','Sarabun',sans-serif" }}>
      <div className="mx-auto w-full max-w-[820px] px-4 py-4">
        <div className="mb-4"><PrintNow title={`${source}-Daily-Report-${date}`} /></div>
        <DailyReportSheet date={date} source={source} data={data} rows={rows} showDetail={showDetail} generatedAt={generatedAt} />
      </div>
    </div>
  );
}
