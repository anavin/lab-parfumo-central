"use server";
import { requireUser } from "@/lib/auth/require-user";
import { dailyReport } from "@/lib/queries";

/** Aggregate daily sales for the copy-ready report. `mine` = only the signed-in
 *  salesperson's own sales (for /my); otherwise the whole branch (for admin pages). */
export async function getDailyReport(date: string, source: string, mine = false) {
  const user = await requireUser();
  return dailyReport(date, source, mine ? user.id : null);
}
