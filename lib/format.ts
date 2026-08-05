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
