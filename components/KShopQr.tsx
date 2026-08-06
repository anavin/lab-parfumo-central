"use client";
import { useState } from "react";

// The shop's fixed K Shop / Thai QR Payment code, shown inline (no button/popup)
// as soon as a K Shop QR channel is chosen. Image lives at public/kshop-qr.png.
export function KShopQr() {
  const [broken, setBroken] = useState(false);
  return (
    <div className="mb-3 rounded-xl border border-line bg-white p-3 text-center">
      <div className="text-xs text-muted mb-2">ให้ลูกค้าสแกน QR นี้เพื่อชำระ (K Shop)</div>
      {broken ? (
        <div className="text-xs text-muted py-6">ยังไม่ได้อัปโหลดรูป QR — วางไฟล์ที่ <b>public/kshop-qr.png</b></div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/kshop-qr.png" alt="K Shop QR" className="w-full max-w-[260px] mx-auto rounded-lg" onError={() => setBroken(true)} />
      )}
    </div>
  );
}
