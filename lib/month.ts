const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** 'YYYY-MM-DD' → 'Nov-25' month label used across sales/customer rows.
 * Parses the string parts directly so it never rolls to the wrong month across
 * a timezone boundary (new Date('YYYY-MM-DD') is UTC midnight, read back local). */
export const monthLabel = (d: string) => {
  const [y, m] = d.split("-");
  const mi = Number(m) - 1;
  if (!y || mi < 0 || mi > 11) return d;
  return `${MONTHS[mi]}-${y.slice(2)}`;
};
