"use server";
import { requireUser } from "@/lib/auth/require-user";
import { can } from "@/lib/auth/permissions";
import { dailyReport, dailySaleRows, dailySalesByMonth, getDailyCash, saveDailyCash } from "@/lib/queries";
import { DEFAULT_BRANCH, resolveBranch } from "@/lib/branches";

// a user who may see branch-wide (not just their own) sales/bills
const isPrivileged = (u: { role: any; permissions: any }) => can(u, "review") || can(u, "sales");

/** Aggregate daily sales for the copy-ready report. `mine` = only the signed-in
 *  salesperson's own sales; a non-privileged user is ALWAYS scoped to their own. */
export async function getDailyReport(date: string, source: string, mine = false) {
  const user = await requireUser();
  return dailyReport(date, source, (mine || !isPrivileged(user)) ? user.id : null);
}

/** Daily sales totals across a month (branch-wide) — review page (privileged only). */
export async function getMonthlyDaily(month: string, source: string) {
  const user = await requireUser();
  if (!isPrivileged(user)) throw new Error("ไม่มีสิทธิ์ดูข้อมูลรวมของสาขา");
  return dailySalesByMonth(month, source);
}

/** Per-bill detail for one day (branch-wide) — printable report (privileged only). */
export async function getDailyBills(date: string, source: string) {
  const user = await requireUser();
  if (!isPrivileged(user)) throw new Error("ไม่มีสิทธิ์ดูข้อมูลรวมของสาขา");
  return dailySaleRows(date, source);
}

/** Load a branch's shop drawer for a day (opening carries forward per branch). */
export async function getMyCashFloat(date: string, branch: string = DEFAULT_BRANCH) {
  await requireUser();
  return getDailyCash(date, resolveBranch(branch));
}

/** Autosave a branch's shop drawer for a day (records who last edited). */
export async function saveMyCashFloat(date: string, branch: string, opening: number, seed: number, deposit: number, closing: number) {
  const user = await requireUser();
  return saveDailyCash(date, resolveBranch(branch), opening, seed, deposit, closing, user.id);
}
