"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, X, Trash2, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/img";

// Many in-app browsers (LINE, Facebook, etc.) and raw Android WebViews block the
// camera, so "ถ่ายรูป" silently does nothing. Detect them to guide the user to a
// real browser / the gallery picker (which can still reach the camera).
function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /(FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|MicroMessenger|KAKAOTALK|Snapchat|TikTok|musical_ly|Twitter)/i.test(ua)
    || /; wv\)/.test(ua);   // Android WebView marker
}

// ---- editable picker (used while entering a bill) --------------------------
export function PhotoPicker({ value, onChange, max = 6 }:
  { value: string[]; onChange: (next: string[]) => void; max?: number }) {
  const camRef = useRef<HTMLInputElement>(null);
  const libRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [inApp, setInApp] = useState(false);
  useEffect(() => { setInApp(isInAppBrowser()); }, []);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setErr(null);
    try {
      const room = Math.max(0, max - value.length);
      const picked = Array.from(files).slice(0, room);
      const out: string[] = [];
      let failed = 0;
      for (const f of picked) { try { out.push(await compressImage(f)); } catch { failed++; } }
      if (out.length) onChange([...value, ...out]);
      const notes: string[] = [];
      if (failed) notes.push(`แนบไม่สำเร็จ ${failed} รูป — รองรับ JPG/PNG (รูป HEIC จาก iPhone บางเครื่องแปลงไม่ได้ ลองกด “ถ่ายรูป” ในแอปแทน)`);
      if (files.length > room) notes.push(`แนบได้สูงสุด ${max} รูป`);
      setErr(notes.join(" · ") || null);
    } finally { setBusy(false); if (camRef.current) camRef.current.value = ""; if (libRef.current) libRef.current.value = ""; }
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const full = value.length >= max;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-muted">แนบรูปหลักฐาน (สลิป/อื่นๆ)</span>
        <span className="text-[11px] text-muted-soft">{value.length}/{max}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((src, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-line group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full h-full object-cover cursor-zoom-in" onClick={() => setView(src)} />
            <button type="button" onClick={() => remove(i)} aria-label="ลบรูป"
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {!full && (
          <>
            <button type="button" onClick={() => camRef.current?.click()} disabled={busy}
              className="w-16 h-16 rounded-lg border border-dashed border-line flex flex-col items-center justify-center gap-0.5 text-muted hover:bg-canvas disabled:opacity-50">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              <span className="text-[10px]">ถ่ายรูป</span>
            </button>
            <button type="button" onClick={() => libRef.current?.click()} disabled={busy}
              className="w-16 h-16 rounded-lg border border-dashed border-line flex flex-col items-center justify-center gap-0.5 text-muted hover:bg-canvas disabled:opacity-50">
              <ImagePlus className="w-5 h-5" />
              <span className="text-[10px]">เลือกรูป</span>
            </button>
          </>
        )}
      </div>
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => add(e.target.files)} />
      <input ref={libRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} />
      {inApp && (
        <div className="mt-2 text-[11px] text-warn bg-warn-soft border border-warn/30 rounded-lg px-2.5 py-2 leading-snug">
          ถ้ากล้องเปิดไม่ได้ในหน้านี้ ให้กด <b>“เลือกรูป”</b> (เลือกกล้องได้) หรือเปิดลิงก์ใน <b>Chrome / Samsung Internet</b> — หรือกด “เพิ่มลงในหน้าจอหลัก” เพื่อใช้เป็นแอป
        </div>
      )}
      {err && <div className="mt-2 text-[11px] text-danger leading-snug">{err}</div>}
      {view && <Lightbox src={view} onClose={() => setView(null)} />}
    </div>
  );
}

// ---- read-only strip (used in the bill list & the admin review) ------------
export function PhotoStrip({ photos, onDelete, size = 56 }:
  { photos: { id?: number; data: string }[]; onDelete?: (id: number) => void; size?: number }) {
  const [view, setView] = useState<string | null>(null);
  if (!photos?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {photos.map((p, i) => (
        <div key={p.id ?? i} className="relative rounded-md overflow-hidden border border-line" style={{ width: size, height: size }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.data} alt="หลักฐาน" className="w-full h-full object-cover cursor-zoom-in" onClick={() => setView(p.data)} />
          {onDelete && p.id != null && (
            <button type="button" onClick={() => onDelete(p.id!)} aria-label="ลบรูป"
              className="absolute top-0 right-0 w-4 h-4 rounded-bl bg-black/60 text-white flex items-center justify-center hover:bg-red-600">
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ))}
      {view && <Lightbox src={view} onClose={() => setView(null)} />}
    </div>
  );
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4" onClick={onClose}>
      <button aria-label="ปิด" className="absolute top-4 right-4 text-white/80 hover:text-white"><X className="w-7 h-7" /></button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="หลักฐานการชำระเงิน" className="max-w-full max-h-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
