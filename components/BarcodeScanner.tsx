"use client";
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat, EAN13Reader } from "@zxing/library";
import { X, Camera, Check } from "lucide-react";

// The shop's EAN-13 labels were generated with non-standard check digits, so
// ZXing's strict checksum rejects most of them. Relax EAN/UPC checksum
// validation (correctness is enforced afterwards by exact product lookup — a
// misread simply won't match a product). Patches the static once.
let checksumRelaxed = false;
function relaxUpcEanChecksum() {
  if (checksumRelaxed) return;
  checksumRelaxed = true;
  const yes = () => true;
  let C: any = EAN13Reader;
  for (let depth = 0; C && depth < 8; depth++) {
    if (Object.prototype.hasOwnProperty.call(C, "checkChecksum")) C.checkChecksum = yes;
    if (Object.prototype.hasOwnProperty.call(C, "checkStandardUPCEANChecksum")) C.checkStandardUPCEANChecksum = yes;
    C = Object.getPrototypeOf(C);
  }
}

// Camera barcode scanner. Works on iOS Safari + Android Chrome, prefers the rear
// camera. In `continuous` mode it keeps scanning (for building a multi-item
// bill) and stays open until the user taps เสร็จ; otherwise it fires once.
export function BarcodeScanner({ onDetected, onClose, continuous = false }: { onDetected: (code: string) => void; onClose: () => void; continuous?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const doneRef = useRef(false);
  const last = useRef<{ code: string; t: number }>({ code: "", t: 0 });

  useEffect(() => {
    relaxUpcEanChecksum();
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_39, BarcodeFormat.QR_CODE, BarcodeFormat.ITF,
    ]);
    const reader = new BrowserMultiFormatReader(hints);
    let controls: { stop: () => void } | null = null;

    reader
      .decodeFromConstraints({ video: { facingMode: { ideal: "environment" } } }, videoRef.current!, (result) => {
        if (!result) return;
        const code = result.getText();
        const now = Date.now();
        if (continuous) {
          if (code === last.current.code && now - last.current.t < 1500) return; // debounce same code
          last.current = { code, t: now };
          setCount((c) => c + 1);
          setFlash(true);
          setTimeout(() => setFlash(false), 220);
          onDetected(code);
        } else if (!doneRef.current) {
          doneRef.current = true;
          controls?.stop();
          onDetected(code);
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
  }, [onDetected, continuous]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-ink rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <span className="text-sm font-semibold flex items-center gap-2"><Camera className="w-4 h-4" /> สแกนบาร์โค้ด</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10" aria-label="ปิด"><X className="w-5 h-5" /></button>
        </div>
        <div className="relative bg-black aspect-[3/4]">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {!error && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className={`w-[72%] h-[32%] border-2 rounded-xl transition-colors ${flash ? "border-green-400" : "border-white/80"}`} style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)" }} />
            </div>
          )}
          {flash && <div className="pointer-events-none absolute inset-0 bg-green-400/20" />}
          {error && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/90">{error}</div>}
        </div>
        {continuous ? (
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-sm text-white/80">{count > 0 ? <>เพิ่มแล้ว <b className="text-white">{count}</b> รายการ</> : "เล็งกล้องที่บาร์โค้ด"}</span>
            <button onClick={onClose} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark">
              <Check className="w-4 h-4" /> เสร็จ
            </button>
          </div>
        ) : (
          <div className="px-4 py-3 text-center text-[12px] text-white/60">เล็งกล้องไปที่บาร์โค้ดสินค้า</div>
        )}
      </div>
    </div>
  );
}
