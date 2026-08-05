"use client";
import { useState, useTransition } from "react";
import { QrCode, X } from "lucide-react";
import { promptPayQr, type PromptPayResult } from "@/lib/actions/promptpay";
import { baht } from "@/lib/format";

// Shows a PromptPay QR for the given amount so the customer can scan & pay.
export function PromptPayButton({ amount, className }: { amount: number; className?: string }) {
  const [pending, start] = useTransition();
  const [qr, setQr] = useState<Extract<PromptPayResult, { ok: true }> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const open = () => start(async () => {
    setErr(null);
    const r = await promptPayQr(amount);
    if (r.ok) setQr(r); else setErr(r.error);
  });

  return (
    <>
      <button type="button" onClick={open} disabled={pending || !(amount > 0)}
        className={className ?? "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-brand text-brand-dark text-sm font-semibold hover:bg-brand-soft disabled:opacity-50"}>
        <QrCode className="w-4 h-4" /> {pending ? "กำลังสร้าง…" : "QR พร้อมเพย์"}
      </button>

      {err && <div className="mt-2 text-xs text-danger">{err}</div>}

      {qr && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setQr(null)}>
          <div className="bg-white rounded-2xl w-full max-w-xs p-5 text-center shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-ink">สแกนเพื่อจ่าย · PromptPay</span>
              <button onClick={() => setQr(null)} className="p-1 rounded-lg text-muted hover:bg-canvas" aria-label="ปิด"><X className="w-5 h-5" /></button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.dataUrl} alt="PromptPay QR" className="w-full max-w-[260px] mx-auto rounded-lg border border-line" />
            <div className="mt-3 text-2xl font-bold text-brand-dark tabular-nums">{baht(qr.amount)}</div>
            {qr.name && <div className="text-sm text-ink mt-0.5">{qr.name}</div>}
            <div className="text-[11px] text-muted-soft mt-1">พร้อมเพย์ {qr.idMasked}</div>
            <div className="text-[11px] text-muted mt-3">ให้ลูกค้าสแกนด้วยแอปธนาคาร แล้วกดยืนยันเมื่อได้รับเงิน</div>
            <button onClick={() => setQr(null)} className="mt-4 w-full py-2.5 rounded-lg bg-ink text-white text-sm font-semibold hover:bg-black">เสร็จสิ้น</button>
          </div>
        </div>
      )}
    </>
  );
}
