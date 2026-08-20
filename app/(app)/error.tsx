"use client";
import { useEffect } from "react";

// Transient Supabase/serverless connection blips can make a Server Component
// render throw. Rather than showing the raw error dialog, auto-retry once (the
// connection usually recovers), then fall back to a manual retry button.
let lastAuto = 0;

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const now = Date.now();
    if (now - lastAuto > 5000) {   // at most one auto-retry per 5s to avoid loops
      lastAuto = now;
      const t = setTimeout(reset, 600);
      return () => clearTimeout(t);
    }
  }, [reset]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div>
        <div className="text-base font-semibold text-ink mb-1">กำลังโหลดใหม่…</div>
        <p className="text-sm text-muted mb-4">การเชื่อมต่อสะดุดชั่วคราว ระบบกำลังลองใหม่ให้อัตโนมัติ</p>
        <button onClick={() => { lastAuto = 0; reset(); }} className="btn btn-brand">ลองใหม่</button>
      </div>
    </div>
  );
}
