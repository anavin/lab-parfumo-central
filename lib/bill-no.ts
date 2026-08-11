/**
 * Display number for a bill = the running segment of its receipt_no
 * (e.g. CTW-260811-003 → "003"). Using the receipt number means a bill shows the
 * SAME number on the salesperson page and the admin review page, and the number
 * stays stable across approve / un-approve (it's not a list position). Falls back
 * to the given position only when a bill has no receipt_no.
 */
export function billSeq(ref: string | null | undefined, fallback: number | string): string {
  const m = (ref || "").match(/(\d+)\s*$/);
  return m ? m[1] : String(fallback);
}
