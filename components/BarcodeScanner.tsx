"use client";
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import { X, Camera } from "lucide-react";

// Camera barcode scanner. Uses ZXing (works on iOS Safari + Android Chrome),
// prefers the rear camera, and calls onDetected once with the decoded string.
export function BarcodeScanner({ onDetected, onClose }: { onDetected: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.QR_CODE, BarcodeFormat.ITF,
    ]);
    const reader = new BrowserMultiFormatReader(hints);
    let controls: { stop: () => void } | null = null;

    reader
      .decodeFromConstraints({ video: { facingMode: { ideal: "environment" } } }, videoRef.current!, (result) => {
        if (result && !doneRef.current) {
          doneRef.current = true;
          controls?.stop();
          onDetected(result.getText());
        }
      })
      .then((c) => { controls = c; })
      .catch((e) => {
        setError(
          e?.name === "NotAllowedError"
            ? "ไม่ได้รับอนุญาตให้ใช้กล้อง — เปิดสิทธิ์กล้องในเบราว์เซอร์แล้วลองใหม่"
            : "เปิดกล้องไม่ได้ — ต้องเปิดผ่าน https และเบราว์เซอร์รองรับกล้อง"
        );
      });

    return () => { controls?.stop(); };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-ink rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <span className="text-sm font-semibold flex items-center gap-2"><Camera className="w-4 h-4" /> สแกนบาร์โค้ด</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10" aria-label="ปิด"><X className="w-5 h-5" /></button>
        </div>
        <div className="relative bg-black aspect-[3/4]">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {!error && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-[72%] h-[34%] border-2 border-white/80 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
          )}
          {error && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/90">{error}</div>}
        </div>
        <div className="px-4 py-3 text-center text-[12px] text-white/60">เล็งกล้องไปที่บาร์โค้ดสินค้า</div>
      </div>
    </div>
  );
}
