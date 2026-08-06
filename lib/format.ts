export const baht = (n: number | null | undefined) =>
  "฿" + Math.round(Number(n ?? 0)).toLocaleString("en-US");

export const num = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString("en-US");

export const compactBaht = (n: number | null | undefined) => {
  const v = Number(n ?? 0);
  if (Math.abs(v) >= 1_000_000) return "฿" + (v / 1_000_000).toFixed(2) + "M";
  if (Math.abs(v) >= 1_000) return "฿" + (v / 1_000).toFixed(0) + "K";
  return "฿" + Math.round(v);
};

export const fmtDate = (d: string | null | undefined) => {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" });
};

// Thailand time zone — server (Vercel) runs in UTC, so timestamptz values must
// be formatted with an explicit tz or the clock shows 7 hours behind.
const BKK = "Asia/Bangkok";

/** Date only, Thailand time — e.g. "06 ส.ค. 68". */
export const fmtDateTH = (d: string | Date | null | undefined) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit", timeZone: BKK });
};

/** Time only (24h, with seconds), Thailand time — e.g. "14:30:05". */
export const fmtTimeTH = (d: string | Date | null | undefined) => {
  if (!d) return "-";
  return new Date(d).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: BKK });
};

/** Date + time on one line, Thailand time — e.g. "06 ส.ค. 68 14:30". */
export const fmtDateTimeTH = (d: string | Date | null | undefined) => {
  if (!d) return "-";
  return new Date(d).toLocaleString("th-TH", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: BKK });
};
