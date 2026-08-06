"use client";
import { useEffect } from "react";

// Registers the service worker (installable PWA + offline shell). No-op in
// browsers without SW support or on http (SW needs https / localhost).
export function SwRegister() {
  useEffect(() => {
    // Only in production: dev JS chunks aren't content-hashed, so a cache-first
    // SW would serve stale code. In dev, proactively remove any old SW/caches.
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
      if (typeof caches !== "undefined") caches.keys().then((ks) => ks.forEach((k) => caches.delete(k))).catch(() => {});
      return;
    }
    const onLoad = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
  }, []);
  return null;
}
