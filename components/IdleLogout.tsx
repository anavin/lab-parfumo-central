"use client";
import { useEffect, useRef } from "react";

const IDLE_MS = 5 * 60_000;   // 5 minutes — must match SESSION_IDLE_MIN

// Logs the user out after 5 minutes with no activity, unless they chose
// "remember me" (readable lp_remember cookie set at login).
export function IdleLogout() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const remembered = document.cookie.split("; ").some((c) => c === "lp_remember=1");
    if (remembered) return;

    let out = false;
    const logout = async () => {
      if (out) return; out = true;
      try { await fetch("/api/logout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: "idle" }) }); } catch {}
      window.location.assign("/login");
    };
    const reset = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(logout, IDLE_MS); };
    const events: (keyof WindowEventMap)[] = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel", "click"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    const onVis = () => { if (document.visibilityState === "visible") reset(); };
    document.addEventListener("visibilitychange", onVis);
    reset();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return null;
}
