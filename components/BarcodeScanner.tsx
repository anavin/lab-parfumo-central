"use client";
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat, EAN13Reader } from "@zxing/library";
import { X, Camera, Check, AlertTriangle, ScanLine } from "lucide-react";

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

export type ScanResult = { ok: boolean; label: string };

// Camera barcode scanner (iOS Safari + Android Chrome, rear camera).
// - single mode: fires onDetected once, then closes.
// - continuous mode: after each scan it PAUSES and shows what was found; the
//   user taps "ตกลง" to scan the next one. onDetected may return a ScanResult
//   (what to show); otherwise a generic success is shown.
export function BarcodeScanner({ onDetected, onClose, continuous = false }: {
  onDetected: (code: string) => void | Promise<ScanResult | void>;
  onClose: () => void;
  continuous?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const doneRef = useRef(false);    // single mode guard
  const pausedRef = useRef(false);  // continuous: waiting for confirm
  const cooldownRef = useRef(0);    // ignore reads until this time (ms) after resuming
  const cbRef = useRef(onDetected); // keep latest callback without restarting the camera
  useEffect(() => { cbRef.current = onDetected; });

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
      .decodeFromConstraints({ video: { facingMode: { ideal: "environment" } } }, videoRef.current!, (res) => {
        if (!res) return;
        const code = res.getText();
        if (continuous) {
          if (pausedRef.current || Date.now() < cooldownRef.current) return; // ignore until confirmed / off cooldown
          pausedRef.current = true;
          setChecking(true);
          Promise.resolve(cbRef.current(code)).then((r) => {
            setChecking(false);
            setResult(r && typeof r === "object" ? r : { ok: true, label: code });
            setCount((c) => c + 1);
          }).catch(() => { setChecking(false); setResult({ ok: false, label: code }); });
        } else if (!doneRef.current) {
          doneRef.current = true;
          controls?.stop();
          cbRef.current(code);
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
  }, [continuous]);

  const scanNext = () => { setResult(null); cooldownRef.current = Date.now() + 1000; pausedRef.current = false; };
  const paused = checking || result !== null;

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
              <div className={`w-[72%] h-[32%] border-2 rounded-xl transition-colors ${paused ? "border-white/30" : "border-white/85"}`} style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)" }} />
            </div>
          )}
          {paused && !error && <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white/70 text-sm">หยุดชั่วคราว</div>}
          {error && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/90">{error}</div>}
        </div>

        {/* footer */}
        {continuous ? (
          <div className="p-3">
            {checking ? (
              <div className="text-center text-white/80 text-sm py-3">กำลังตรวจสอบ…</div>
            ) : result ? (
              <div>
                <div className={`rounded-xl px-4 py-3 mb-3 ${result.ok ? "bg-green-500/15 text-green-300" : "bg-amber-500/15 text-amber-300"}`}>
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    {result.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {result.ok ? "เพิ่มลงบิลแล้ว" : "ไม่พบในระบบ — เพิ่มไว้ให้กรอกชื่อเอง"}
                  </div>
                  <div className="text-white text-[15px] mt-1 leading-snug">{result.label}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={scanNext} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark">
                    <ScanLine className="w-4 h-4" /> ตกลง — สแกนต่อ
                  </button>
                  <button onClick={onClose} className="px-4 py-3 rounded-xl border border-white/20 text-white/85 text-sm font-medium hover:bg-white/10">เสร็จสิ้น</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-white/80">{count > 0 ? <>เพิ่มแล้ว <b className="text-white">{count}</b> รายการ · เล็งกล้องต่อ</> : "เล็งกล้องที่บาร์โค้ด"}</span>
                <button onClick={onClose} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark">
                  <Check className="w-4 h-4" /> เสร็จ
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-3 text-center text-[12px] text-white/60">เล็งกล้องไปที่บาร์โค้ดสินค้า</div>
        )}
      </div>
    </div>
  );
}
