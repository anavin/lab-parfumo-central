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

export type ScanResult = { ok: boolean; label: string; sub?: string };

// Camera barcode scanner (iOS Safari + Android Chrome, rear camera).
// - single mode: fires onDetected once, then closes.
// - continuous mode: after each scan it PAUSES and shows what was found; the
//   user taps "ตกลง" to scan the next one. onDetected may return a ScanResult
//   (what to show); otherwise a generic success is shown.
// Reads needed before ACCEPTING a code that isn't a known product barcode — guards
// against a blurry frame decoding to a wrong number (a misread rarely repeats identically).
const UNKNOWN_CONFIRM = 3;

export function BarcodeScanner({ onDetected, onClose, continuous = false, knownCodes }: {
  onDetected: (code: string) => void | Promise<ScanResult | void>;
  onClose: () => void;
  continuous?: boolean;
  knownCodes?: Set<string> | null;   // all product barcodes — decoded value is checked against these first
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [hint, setHint] = useState(false);   // "can't scan?" tips after a few seconds with no lock
  const doneRef = useRef(false);    // single mode guard
  const pausedRef = useRef(false);  // continuous: waiting for confirm
  const cooldownRef = useRef(0);    // ignore reads until this time (ms) after resuming
  const cbRef = useRef(onDetected); // keep latest callback without restarting the camera
  useEffect(() => { cbRef.current = onDetected; });
  const knownRef = useRef(knownCodes);            // latest known set without restarting the camera
  useEffect(() => { knownRef.current = knownCodes; });
  const voteRef = useRef<{ last: string; n: number }>({ last: "", n: 0 });   // consensus for unknown codes

  useEffect(() => {
    relaxUpcEanChecksum();
    const video = videoRef.current!;
    let stream: MediaStream | null = null;
    let zxingControls: { stop: () => void } | null = null;
    let raf = 0;
    let stopped = false;

    const stopAll = () => {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      try { zxingControls?.stop(); } catch {}
      stream?.getTracks().forEach((t) => t.stop());
    };

    // Is this decoded value an actual product barcode? (exact, or ignoring leading zeros
    // that some readers add/drop between UPC-A / EAN-13.)
    const isKnown = (code: string) => {
      const k = knownRef.current;
      if (!k || !k.size) return false;
      if (k.has(code)) return true;
      const bare = code.replace(/^0+/, "");
      return k.has(bare) || k.has("0" + code) || k.has("00" + code);
    };

    // Commit a code downstream (fires onDetected). Continuous pauses for confirm; single closes.
    const commit = (code: string) => {
      voteRef.current = { last: "", n: 0 };
      if (continuous) {
        pausedRef.current = true;
        try { navigator.vibrate?.(45); } catch {}
        setChecking(true);
        Promise.resolve(cbRef.current(code)).then((r) => {
          setChecking(false);
          setResult(r && typeof r === "object" ? r : { ok: true, label: code });
          setCount((c) => c + 1);
        }).catch(() => { setChecking(false); setResult({ ok: false, label: code }); });
      } else if (!doneRef.current) {
        doneRef.current = true;
        try { navigator.vibrate?.(45); } catch {}
        stopAll();
        cbRef.current(code);
      }
    };

    // Shared handler for a decoded code (both native + ZXing paths funnel here).
    const onCode = (raw: string) => {
      const code = (raw || "").trim();
      if (!code) return;
      if (continuous ? (pausedRef.current || Date.now() < cooldownRef.current) : doneRef.current) return;

      // matches a real product → trust it immediately; otherwise require several
      // identical reads so a one-off misread never gets accepted.
      if (isKnown(code)) { commit(code); return; }
      const v = voteRef.current;
      if (v.last === code) v.n += 1; else { v.last = code; v.n = 1; }
      if (v.n >= UNKNOWN_CONFIRM) commit(code);
    };

    // Grab the rear camera at the highest resolution the device will give — more
    // pixels on the barcode = far fewer "won't scan" misses. Fall back gracefully.
    const getStream = async () => {
      const tries: MediaStreamConstraints[] = [
        { video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        { video: true, audio: false },
      ];
      let lastErr: any;
      for (const c of tries) {
        try { return await navigator.mediaDevices.getUserMedia(c); } catch (e) { lastErr = e; }
      }
      throw lastErr;
    };

    (async () => {
      try {
        stream = await getStream();
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play().catch(() => {});

        // Continuous autofocus — the single biggest fix for blurry, unreadable frames.
        const track = stream.getVideoTracks()[0];
        try { await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as any] }); } catch {}

        // BASE decoder on EVERY device: ZXing, patched to accept the shop's
        // non-standard EAN-13 check digits. Native/standard scanners REJECT those
        // labels, so this must always run — it's the only thing that reads them.
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);   // work harder to lock onto a barcode
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 100 });
        zxingControls = await reader.decodeFromStream(stream, video, (res) => { if (res) onCode(res.getText()); });

        // BONUS parallel fast-path: the OS detector (Android/Chrome) locks onto
        // VALID codes (e.g. the CODE-128 labels we print) almost instantly. Runs
        // alongside ZXing on the same video; onCode() de-dupes whichever fires first.
        const NativeBD: any = (window as any).BarcodeDetector;
        if (NativeBD) {
          let detector: any;
          try { detector = new NativeBD({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] }); }
          catch { detector = new NativeBD(); }
          const tick = async () => {
            if (stopped) return;
            try {
              const codes = await detector.detect(video);
              if (codes && codes.length && codes[0].rawValue) { onCode(codes[0].rawValue); }
            } catch {}
            if (!stopped) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }
      } catch (e: any) {
        setError(
          e?.name === "NotAllowedError"
            ? "ไม่ได้รับอนุญาตให้ใช้กล้อง — เปิดสิทธิ์กล้องในเบราว์เซอร์แล้วลองใหม่"
            : "เปิดกล้องไม่ได้ — ต้องเปิดผ่าน https และเบราว์เซอร์รองรับกล้อง"
        );
      }
    })();

    return () => { stopAll(); };
  }, [continuous]);

  // show scanning tips if nothing locks within a few seconds of actively scanning
  useEffect(() => {
    if (error || checking || result) { setHint(false); return; }
    setHint(false);
    const t = setTimeout(() => setHint(true), 7000);
    return () => clearTimeout(t);
  }, [error, checking, result]);

  const scanNext = () => { setResult(null); voteRef.current = { last: "", n: 0 }; cooldownRef.current = Date.now() + 1000; pausedRef.current = false; };
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
          {!error && !paused && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-5">
              <div className="relative w-[74%] h-[34%] rounded-xl overflow-hidden" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)" }}>
                <div className="absolute inset-0 border border-white/30 rounded-xl" />
                {/* corner brackets (pulse) */}
                <span className="lp-corner absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-brand rounded-tl-xl" />
                <span className="lp-corner absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-brand rounded-tr-xl" />
                <span className="lp-corner absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-brand rounded-bl-xl" />
                <span className="lp-corner absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-brand rounded-br-xl" />
                {/* sweeping scan line */}
                <div className="lp-scanline absolute left-3 right-3 h-[3px] bg-brand rounded" style={{ boxShadow: "0 0 10px 2px rgba(161,124,72,0.85)" }} />
              </div>
              <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                <ScanLine className="w-4 h-4 animate-pulse text-brand" /> กำลังสแกน…
              </div>
              {hint && (
                <div className="mx-6 max-w-[85%] rounded-lg bg-black/60 px-3 py-2 text-center text-[12px] leading-relaxed text-white/90">
                  สแกนไม่ติด? ลอง <b className="text-brand">ถอยเข้า–ออก</b> ให้ภาพชัด · จัดบาร์โค้ดให้อยู่กลางกรอบ · เพิ่มแสง/เลี่ยงแสงสะท้อน
                </div>
              )}
            </div>
          )}
          {error && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/90">{error}</div>}

          {/* checking overlay */}
          {checking && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white/80">
              <ScanLine className="w-10 h-10 mb-3 animate-pulse" />
              <div className="text-sm">กำลังตรวจสอบ…</div>
            </div>
          )}

          {/* BIG result overlay — clear, full camera view */}
          {result && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center px-6">
              <div className={"w-20 h-20 rounded-full flex items-center justify-center mb-4 " + (result.ok ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400")}>
                {result.ok ? <Check className="w-11 h-11" strokeWidth={2.5} /> : <AlertTriangle className="w-10 h-10" />}
              </div>
              <div className={"text-sm font-semibold mb-3 " + (result.ok ? "text-green-400" : "text-amber-400")}>
                {result.ok ? "เพิ่มลงบิลแล้ว" : "ไม่พบในระบบ — เพิ่มไว้ให้กรอกชื่อเอง"}
              </div>
              <div className="text-white text-2xl font-bold leading-snug">{result.label}</div>
              {result.sub && <div className="text-white/60 text-base mt-1">{result.sub}</div>}
              <button onClick={scanNext} className="mt-8 w-full inline-flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-brand text-white text-base font-semibold hover:bg-brand-dark active:scale-[.99] transition">
                <ScanLine className="w-5 h-5" /> ตกลง — สแกนต่อ
              </button>
              <button onClick={onClose} className="mt-2 text-white/60 text-sm py-2 hover:text-white">เสร็จสิ้น</button>
            </div>
          )}
        </div>

        {/* footer (only when not showing a result) */}
        {!result && !checking && (continuous ? (
          <div className="p-3 flex items-center justify-between gap-3">
            <span className="text-sm text-white/80">{count > 0 ? <>เพิ่มแล้ว <b className="text-white">{count}</b> รายการ · สแกนต่อ</> : "สแกนที่บาร์โค้ด"}</span>
            <button onClick={onClose} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark">
              <Check className="w-4 h-4" /> เสร็จ
            </button>
          </div>
        ) : (
          <div className="px-4 py-3 text-center text-[12px] text-white/60">สแกนไปที่บาร์โค้ดสินค้า</div>
        ))}
      </div>
    </div>
  );
}
