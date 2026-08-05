/** 'YYYY-MM-DD' → 'Nov-25' month label used across sales/customer rows. */
export const monthLabel = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleString("en-US", { month: "short" }) + "-" + String(dt.getFullYear()).slice(2);
};
