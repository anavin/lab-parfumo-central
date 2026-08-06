"use client";
import { useState } from "react";
import { QrCode, X } from "lucide-react";

// Shows the shop's fixed K Shop / Thai QR Payment code for the customer to scan.
// The image lives at public/kshop-qr.png (accepts PromptPay transfer + cards).
export function KShopQrButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={className ?? "w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-brand text-brand-dark text-sm font-semibold hover:bg-brand-soft"}>
        <QrCode className="w-4 h-4" /> แสดง QR K Shop
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-3 w-full max-w-xs shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-sm font-semibold text-ink">QR K Shop</span>
              <button onClick={() => setOpen(false)} aria-label="ปิด" className="p-1 rounded-lg text-muted hover:bg-canvas"><X className="w-5 h-5" /></button>
            </div>
            {broken ? (
              <div className="aspect-[3/4] rounded-lg border border-dashed border-line flex items-center justify-center text-center text-xs text-muted p-4">
                ยังไม่ได้อัปโหลดรูป QR<br />วางไฟล์ไว้ที่ <b>public/kshop-qr.png</b>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/kshop-qr.png" alt="K Shop QR" className="w-full rounded-lg" onError={() => setBroken(true)} />
            )}
            <button onClick={() => setOpen(false)} className="mt-2 w-full py-2.5 rounded-lg bg-ink text-white text-sm font-medium hover:bg-black">ปิด</button>
          </div>
        </div>
      )}
    </>
  );
}
