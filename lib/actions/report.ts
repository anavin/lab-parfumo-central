"use server";
import { requireUser } from "@/lib/auth/require-user";
import { dailyReport, dailySaleRows, dailySalesByMonth, getDailyCash, saveDailyCash } from "@/lib/queries";
import { DEFAULT_BRANCH, normalizeBranch } from "@/lib/branches";

/** Aggregate daily sales for the copy-ready report. `mine` = only the signed-in
 *  salesperson's own sales (for /my); otherwise the whole branch (for admin pages). */
export async function getDailyReport(date: string, source: string, mine = false) {
  const user = await requireUser();
  return dailyReport(date, source, mine ? user.id : null);
}

/** Daily sales totals across a month (branch-wide) — for the review-page chart. */
export async function getMonthlyDaily(month: string, source: string) {
  await requireUser();
  return dailySalesByMonth(month, source);
}

/** Per-bill detail for one day (branch-wide) — for the printable daily report. */
export async function getDailyBills(date: string, source: string) {
  await requireUser();
  return dailySaleRows(date, source);
}

/** Load a branch's shop drawer for a day (opening carries forward per branch). */
export async function getMyCashFloat(date: string, branch: string = DEFAULT_BRANCH) {
  await requireUser();
  return getDailyCash(date, normalizeBranch(branch));
}

/** Autosave a branch's shop drawer for a day (records who last edited). */
export async function saveMyCashFloat(date: string, branch: string, opening: number, deposit: number, closing: number) {
  const user = await requireUser();
  return saveDailyCash(date, normalizeBranch(branch), opening, deposit, closing, user.id);
}
