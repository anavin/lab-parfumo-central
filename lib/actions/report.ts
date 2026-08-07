"use server";
import { requireUser } from "@/lib/auth/require-user";
import { dailyReport } from "@/lib/queries";

/** Aggregate a branch's daily sales for the copy-ready report. Any signed-in user. */
export async function getDailyReport(date: string, source: string) {
  await requireUser();
  return dailyReport(date, source);
}
