"use server";
// Generate a PromptPay QR for a bill amount, server-side, from the shop's own
// PromptPay ID (env PROMPTPAY_ID — a 10-digit mobile or 13-digit national/tax
// id). The QR encodes the shop's receiving account + amount; the customer's
// banking app does the transfer. No third party, no fees, no credentials.
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { requireUser } from "@/lib/auth/require-user";

export type PromptPayResult =
  | { ok: true; dataUrl: string; amount: number; name: string; idMasked: string }
  | { ok: false; error: string };

const maskId = (id: string) => (id.length <= 4 ? id : id.replace(/.(?=.{4})/g, "•"));

export async function promptPayQr(amountBaht: number): Promise<PromptPayResult> {
  await requireUser();
  const id = (process.env.PROMPTPAY_ID || "").replace(/[^0-9]/g, "");
  if (!id) return { ok: false, error: "ยังไม่ได้ตั้งค่าพร้อมเพย์ของร้าน — ตั้งค่า PROMPTPAY_ID ก่อน" };

  const amount = Math.round((Number(amountBaht) || 0) * 100) / 100;
  if (!(amount > 0)) return { ok: false, error: "ยอดเงินไม่ถูกต้อง" };

  try {
    const payload = generatePayload(id, { amount });
    const dataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 512, errorCorrectionLevel: "M" });
    return { ok: true, dataUrl, amount, name: (process.env.PROMPTPAY_NAME || "").trim(), idMasked: maskId(id) };
  } catch (e: any) {
    return { ok: false, error: "สร้าง QR ไม่สำเร็จ: " + (e?.message || "ตรวจสอบเลขพร้อมเพย์") };
  }
}
