"use server";
import { q } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { renderReceiptPdf } from "@/lib/pdf/render-receipt";
import { sendMail, mailerConfigured } from "@/lib/mailer";
import { billByReceipt } from "@/lib/queries";
import { logAudit } from "@/lib/audit";
import { type ReceiptLang } from "@/lib/pdf/receipt-document";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SHOP = "Lab Parfumo";

/** Email the receipt PDF to a customer and record the address (for the mailing list). */
export async function emailReceipt(receiptNo: string, email: string, lang: ReceiptLang = "th"): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const ref = String(receiptNo || "").trim();
  const to = String(email || "").trim();
  if (!ref) return { ok: false, error: "ไม่พบเลขใบเสร็จ" };
  if (!EMAIL_RE.test(to)) return { ok: false, error: "อีเมลไม่ถูกต้อง" };
  if (!mailerConfigured()) return { ok: false, error: "ยังไม่ได้ตั้งค่าระบบอีเมล (SMTP)" };

  try {
    const rows = await billByReceipt(ref);
    if (!rows.length) return { ok: false, error: "ไม่พบใบเสร็จ" };
    const total = rows.reduce((s, r) => s + (r.total || 0), 0);

    const pdf = await renderReceiptPdf(ref, lang);
    if (!pdf) return { ok: false, error: "สร้างไฟล์ใบเสร็จไม่สำเร็จ" };

    const subject = lang === "en" ? `${SHOP} — Receipt ${ref}` : `${SHOP} — ใบเสร็จ ${ref}`;
    const body = lang === "en"
      ? `<p>Thank you for shopping at ${SHOP}.</p><p>Your receipt <b>${ref}</b> (total ฿${Math.round(total).toLocaleString()}) is attached as a PDF.</p><p>We hope to see you again soon 💛</p>`
      : `<p>ขอบคุณที่อุดหนุน ${SHOP} ค่ะ 💛</p><p>ใบเสร็จเลขที่ <b>${ref}</b> (ยอดรวม ฿${Math.round(total).toLocaleString()}) แนบมาในรูปแบบไฟล์ PDF</p><p>แล้วพบกันใหม่นะคะ</p>`;

    await sendMail({
      to, subject, html: body,
      attachments: [{ filename: `Receipt-${ref}-${lang.toUpperCase()}.pdf`, content: pdf, contentType: "application/pdf" }],
    });

    // record the address (fail-soft: a missing table shouldn't undo a sent email)
    try {
      await q(`insert into bill_emails (bill_ref, email, lang, sent_by) values ($1,$2,$3,$4)`, [ref, to, lang, user.id]);
    } catch (e: any) { if (e?.code !== "42P01") console.error("[emailReceipt] store failed", e); }

    await logAudit("update", "submission", ref, `ส่งใบเสร็จทางอีเมล ${ref} → ${to}`);
    return { ok: true };
  } catch (e: any) {
    console.error("[emailReceipt] send failed", e?.code, e?.responseCode, e?.command, e?.message, e);
    if (e?.code === "EAUTH") return { ok: false, error: "อีเมลผู้ส่งล็อกอินไม่ผ่าน — ตรวจ SMTP_USER / App Password (ต้องเปิด 2-Step ก่อน)" };
    if (e?.code === "EENVELOPE") return { ok: false, error: "อีเมลปลายทาง/ผู้ส่งไม่ถูกต้อง (ตรวจ MAIL_FROM ให้เป็นโดเมนเดียวกับ SMTP_USER)" };
    if (e?.code === "ETIMEDOUT" || e?.code === "ESOCKET" || e?.code === "ECONNECTION")
      return { ok: false, error: "ต่อ SMTP ไม่ได้ (ตรวจ SMTP_HOST/PORT — Gmail ใช้ smtp.gmail.com:465)" };
    // temporary: surface the raw code/message so we can diagnose the exact cause
    const detail = [e?.code, e?.responseCode, String(e?.message || "").slice(0, 140)].filter(Boolean).join(" · ");
    return { ok: false, error: `ส่งอีเมลไม่สำเร็จ: ${detail || "unknown"}` };
  }
}
