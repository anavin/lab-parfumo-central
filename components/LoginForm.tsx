"use client";
import { useState } from "react";

export function LoginForm({ next }: { next: string }) {
  const [busy, setBusy] = useState(false);          // covers both request + redirect
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | undefined>(undefined);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    setBusy(true); setError(null); setRemaining(undefined);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: fd.get("username"), password: fd.get("password"), next, remember: fd.get("remember") === "on" }),
      });
      const data = await r.json();
      if (data.ok) {
        // Plain fetch → no server-action router refresh to race with, so this hard
        // navigation lands cleanly (no blank page). Keep busy=true while it loads.
        window.location.assign(data.next || "/");
        return;
      }
      setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      setRemaining(typeof data.attemptsRemaining === "number" ? data.attemptsRemaining : undefined);
      setBusy(false);
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่อีกครั้ง");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <div>
        <label className="block text-xs text-muted mb-1">ชื่อผู้ใช้</label>
        <input name="username" autoFocus autoComplete="username"
          className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">รหัสผ่าน</label>
        <input name="password" type="password" autoComplete="current-password"
          className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand" />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted cursor-pointer select-none">
        <input name="remember" type="checkbox" className="accent-brand w-4 h-4" />
        จดจำฉันไว้ (ไม่ออกจากระบบอัตโนมัติ)
      </label>
      {error && (
        <div className="text-xs text-danger bg-danger-soft border border-danger/20 rounded-lg px-3 py-2">
          {error}
          {typeof remaining === "number" && remaining > 0 &&
            <span className="text-muted"> · เหลือ {remaining} ครั้ง</span>}
        </div>
      )}
      <button type="submit" disabled={busy}
        className="w-full bg-brand text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-dark disabled:opacity-50 transition-colors">
        {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
