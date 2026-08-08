import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { dailyReport, dailySaleRows } from "@/lib/queries";
import { DailyReportDocument } from "@/lib/pdf/daily-report-document";

export const dynamic = "force-dynamic";

const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("unauthorized", { status: 401 });
  if (!can(user, "review")) return new Response("forbidden", { status: 403 });

  const sp = new URL(req.url).searchParams;
  const date = (sp.get("date") || "").match(/^\d{4}-\d{2}-\d{2}$/)?.[0] || bkkToday();
  const source = sp.get("source") || "CTW";
  const disposition = sp.get("disp") === "inline" ? "inline" : "attachment";

  const [report, bills] = await Promise.all([dailyReport(date, source, null), dailySaleRows(date, source)]);
  const generatedAt = new Date().toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok",
  });

  const buffer = await renderToBuffer(
    <DailyReportDocument date={date} source={source} report={report} bills={bills} generatedAt={generatedAt} />,
  );
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${source}-Daily-Report-${date}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
