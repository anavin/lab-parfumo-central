// Payment channels — values match the existing sales data so the dashboard
// groups correctly. Shared by the staff entry form and the admin review editor.
export const PAYMENTS = [
  { v: "Cash", label: "เงินสด" },
  { v: "EDC Credit Card", label: "บัตรเครดิต (EDC)" },
  { v: "K Shop", label: "K SHOP" },
  { v: "K Shop Credit Card", label: "K SHOP บัตรเครดิต" },
  { v: "EDC Alipay/WeChat", label: "Alipay / WeChat" },
  { v: "EDC Thai QR Payment", label: "Thai QR" },
  { v: "EDC PromptCard", label: "PromptCard" },
  { v: "PromptPay", label: "พร้อมเพย์ (PromptPay)" },
];

// Marker value used when a bill is paid across two channels; the per-channel
// amounts are stored separately (bill_payments) so reports stay accurate.
export const SPLIT2 = "จ่าย 2 ทาง";
export const isSplit = (v?: string | null) => v === SPLIT2;

// ---- split-tender math (shared by the new-bill form and the edit forms) ----
export type Tender = { channel: string; amount: any };
/** Per-row amounts — the last row auto-fills whatever is left of `net`. */
export function splitAmounts(tenders: Tender[], net: number): number[] {
  const others = tenders.slice(0, -1).reduce((s, t) => s + (Number(t.amount) || 0), 0);
  return tenders.map((t, i) => (i < tenders.length - 1 ? Number(t.amount) || 0 : Math.max(0, net - others)));
}
export const splitSum = (tenders: Tender[], net: number) => splitAmounts(tenders, net).reduce((a, b) => a + b, 0);
export const splitOk = (tenders: Tender[], net: number) =>
  net > 0 && tenders.length >= 2 && tenders.every((t) => String(t.channel || "").trim()) && Math.round(splitSum(tenders, net)) === Math.round(net);
/** Resolve to concrete {channel, amount} rows (last amount = remainder). */
export const resolveTenders = (tenders: Tender[], net: number) =>
  splitAmounts(tenders, net).map((amount, i) => ({ channel: tenders[i].channel, amount }));
