"use client";
import { useEffect } from "react";

// Registers the service worker (installable PWA + offline shell). No-op in
// browsers without SW support or on http (SW needs https / localhost).
export function SwRegister() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const onLoad = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
      if (document.readyState === "complete") onLoad();
      else window.addEventListener("load", onLoad, { once: true });
    }
  }, []);
  return null;
}
