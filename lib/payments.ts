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
