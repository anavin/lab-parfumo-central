"use client";
import { useEffect } from "react";

// Root-level boundary — also catches errors thrown by the (app) layout itself
// (requireUser / pendingCount DB calls), which the (app)/error.tsx cannot.
// Auto-retries once on a transient blip, then offers a manual retry.
let lastAuto = 0;

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const now = Date.now();
    if (now - lastAuto > 5000) {
      lastAuto = now;
      const t = setTimeout(reset, 600);
      return () => clearTimeout(t);
    }
  }, [reset]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <div>
        <div className="text-base font-semibold text-ink mb-1">กำลังโหลดใหม่…</div>
        <p className="text-sm text-muted mb-4">การเชื่อมต่อสะดุดชั่วคราว ระบบกำลังลองใหม่ให้อัตโนมัติ</p>
        <button onClick={() => { lastAuto = 0; reset(); }} className="btn btn-brand">ลองใหม่</button>
      </div>
    </div>
  );
}
