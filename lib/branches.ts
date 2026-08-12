/**
 * Single source of truth for sales branches (สาขา).
 *
 * Add a branch here and it flows to every source selector, label, bill-ref
 * prefix, and the cash + stock branch filters. `code` is the canonical value
 * stored in sales.source / submissions.source and used everywhere as the key.
 */
export type Branch = {
  code: string; name: string; prefix: string; storeCode: string; active: boolean;
  // Optional "stock baseline" date (YYYY-MM-DD). Sales BEFORE this date at this branch
  // are NOT deducted from branch stock (they stay in sales stats/reports). Use it for a
  // branch whose earlier sales were events with their own stock — so branch stock starts
  // fresh from received requisitions on this date.
  stockFrom?: string;
  // When true, selling at this branch only lets you search products that are in stock
  // here (the branch checks its shelf stock). Off = search the whole catalog.
  stockGated?: boolean;
};

export const BRANCHES: Branch[] = [
  // storeCode is written as a PO's branch_label when allocating stock to a branch;
  // the stock engine derives the branch from the "NN_XXX" token, so it must contain it.
  { code: "CTW", name: "Central World", prefix: "CTW", storeCode: "01_CTW", active: true },
  // SCS was event-only before 2026-08-12; earlier sales don't count against its new stock.
  // stockGated: selling here only searches products in stock at SCS.
  { code: "SCS", name: "Seacon Square", prefix: "SCS", storeCode: "02_SCS", active: true, stockFrom: "2026-08-12", stockGated: true },
];

/** Default branch when none is chosen (first active branch). */
export const DEFAULT_BRANCH = BRANCHES[0].code; // "CTW"

const byCode = new Map(BRANCHES.map((b) => [b.code, b]));

/** {value,label} options for a <Select> — active branches only. */
export function branchOptions(): { value: string; label: string }[] {
  return BRANCHES.filter((b) => b.active).map((b) => ({ value: b.code, label: b.name }));
}

/** Display name for a branch code (falls back to the code itself). */
export function branchName(code: string | null | undefined): string {
  return (code && byCode.get(normalizeBranch(code))?.name) || code || "";
}

/** Bill-ref prefix for a branch code, e.g. "CTW-260806-001". */
export function branchPrefix(code: string | null | undefined): string {
  return byCode.get(normalizeBranch(code))?.prefix || DEFAULT_BRANCH;
}

/** PO branch_label for a branch code (so allocated stock counts for that branch). */
export function branchStoreCode(code: string | null | undefined): string {
  return byCode.get(normalizeBranch(code))?.storeCode || normalizeBranch(code);
}

/** True when `code` is a known, active branch. */
export function isBranch(code: string | null | undefined): boolean {
  return !!code && byCode.has(code);
}

/** True when selling at this branch should be limited to in-stock products. */
export function isStockGated(code: string | null | undefined): boolean {
  return !!byCode.get(normalizeBranch(code))?.stockGated;
}

/**
 * Normalize any legacy / label form to a canonical branch code:
 *  - legacy sales source "EVENT_SCS" → "SCS"
 *  - branches-table store_code "0N_XXX" (e.g. "02_SCS") → "SCS"
 *  - branch_label "02_SCS-Seacon…" → "SCS"
 * Unknown values are returned trimmed as-is so callers can decide.
 */
export function normalizeBranch(v: string | null | undefined): string {
  if (!v) return DEFAULT_BRANCH;
  const s = v.trim();
  if (byCode.has(s)) return s;
  if (s === "EVENT_SCS") return "SCS";
  const m = s.match(/^\d+_([A-Za-z]+)/); // "01_CTW", "02_SCS-Seacon…"
  if (m && byCode.has(m[1].toUpperCase())) return m[1].toUpperCase();
  return s;
}

/** Clamp any input to a KNOWN branch code (falls back to DEFAULT_BRANCH). Use at
 *  server-action trust boundaries so a forged/legacy value can't be stored raw. */
export function resolveBranch(v: string | null | undefined): string {
  const n = normalizeBranch(v);
  return byCode.has(n) ? n : DEFAULT_BRANCH;
}
