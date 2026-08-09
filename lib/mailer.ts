import nodemailer, { type Transporter } from "nodemailer";

// SMTP e-mail (e.g. Gmail / Google Workspace). Owner sets these on Vercel:
//   SMTP_HOST   default smtp.gmail.com
//   SMTP_PORT   default 465 (SSL) — use 587 for STARTTLS
//   SMTP_USER   the sending account (e.g. receipt@labparfumo.com)
//   SMTP_PASS   an App Password (Google account needs 2FA on) — NOT the login pw
//   MAIL_FROM   e.g. "Lab Parfumo <receipt@labparfumo.com>" (defaults to SMTP_USER)
//
// For Gmail/Workspace you MUST create an App Password
// (myaccount.google.com → Security → 2-Step Verification → App passwords).

let _tx: Transporter | null = null;

export function mailerConfigured(): boolean {
  return !!(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

function transport(): Transporter {
  if (_tx) return _tx;
  const port = Number(process.env.SMTP_PORT) || 465;
  _tx = nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
    port,
    secure: port === 465,   // 465 = implicit TLS; 587 = STARTTLS
    auth: { user: process.env.SMTP_USER!.trim(), pass: process.env.SMTP_PASS!.trim() },
  });
  return _tx;
}

export type MailAttachment = { filename: string; content: Buffer; contentType?: string };

/** Send one email. Throws on transport/auth errors (the caller maps to {ok,error}). */
export async function sendMail(opts: { to: string; subject: string; html: string; text?: string; attachments?: MailAttachment[] }) {
  const from = process.env.MAIL_FROM?.trim() || process.env.SMTP_USER!.trim();
  await transport().sendMail({
    from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text, attachments: opts.attachments,
  });
}
