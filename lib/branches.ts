/**
 * Single source of truth for sales branches (สาขา).
 *
 * Add a branch here and it flows to every source selector, label, bill-ref
 * prefix, and the cash + stock branch filters. `code` is the canonical value
 * stored in sales.source / submissions.source and used everywhere as the key.
 */
export type Branch = { code: string; name: string; prefix: string; active: boolean };

export const BRANCHES: Branch[] = [
  { code: "CTW", name: "Central World", prefix: "CTW", active: true },
  { code: "SCS", name: "Seacon Square", prefix: "SCS", active: true },
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

/** True when `code` is a known, active branch. */
export function isBranch(code: string | null | undefined): boolean {
  return !!code && byCode.has(code);
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
