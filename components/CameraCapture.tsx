"use client";
import { useEffect, useRef, useState } from "react";
import { X, RefreshCw, Loader2, Camera } from "lucide-react";

/**
 * In-page camera (getUserMedia) for taking a photo — works in WebViews / kiosk browsers
 * that block the OS camera intent from <input capture>, as long as camera permission is
 * granted (same path the barcode scanner uses). Captures a frame to a JPEG File.
 */
export function CameraCapture({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");

  useEffect(() => {
    let cancelled = false;
    setReady(false); setErr(null);
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } }, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) { v.srcObject = stream; try { await v.play(); } catch {} setReady(true); }
      } catch (e: any) {
        const n = e?.name || "";
        setErr(n === "NotAllowedError" ? "ไม่ได้รับอนุญาตให้ใช้กล้อง — เปิดสิทธิ์กล้องของแอป/เบราว์เซอร์แล้วลองใหม่"
          : n === "NotFoundError" ? "ไม่พบกล้องบนอุปกรณ์นี้"
          : "เปิดกล้องไม่ได้ — ลองกด “เลือกรูป” แทน");
      }
    })();
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; };
  }, [facing]);

  const snap = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth || busy) return;
    setBusy(true);
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    c.toBlob((blob) => {
      setBusy(false);
      if (blob) onCapture(new File([blob], `photo-${blob.size}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      <div className="flex items-center justify-between p-3 text-white shrink-0">
        <button type="button" onClick={onClose} aria-label="ปิด" className="p-1"><X className="w-6 h-6" /></button>
        <span className="text-sm font-medium">ถ่ายรูป</span>
        <button type="button" onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))} aria-label="สลับกล้อง" className="p-1"><RefreshCw className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {err ? (
          <div className="px-8 text-center text-white/80 text-sm leading-relaxed">{err}</div>
        ) : (
          <>
            <video ref={videoRef} playsInline muted className="max-h-full max-w-full" />
            {!ready && <Loader2 className="w-8 h-8 text-white/80 animate-spin absolute" />}
          </>
        )}
      </div>
      <div className="p-5 flex justify-center shrink-0">
        {err ? (
          <button type="button" onClick={onClose} className="px-5 py-3 rounded-full bg-white/15 text-white text-sm font-medium">ปิด</button>
        ) : (
          <button type="button" onClick={snap} disabled={!ready || busy} aria-label="ถ่าย"
            className="w-16 h-16 rounded-full bg-white ring-4 ring-white/30 active:scale-95 transition disabled:opacity-40 flex items-center justify-center">
            {busy ? <Loader2 className="w-6 h-6 text-black animate-spin" /> : <Camera className="w-6 h-6 text-black" />}
          </button>
        )}
      </div>
    </div>
  );
}
