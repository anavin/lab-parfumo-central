"use client";
import { useEffect, useRef } from "react";

/**
 * Hands-free hardware barcode scanner (USB/Bluetooth "keyboard wedge" devices).
 * A scanner types the code as very fast keystrokes then an Enter. We buffer keys
 * that arrive faster than a human could type and, on Enter, emit the code.
 *
 * - Ignores input while a text field / select is focused (that field handles its own
 *   typing) — so hands-free capture only runs when nothing editable is focused.
 * - Human keypresses (slow, or single keys) never reach the min length, so they're
 *   safely ignored.
 */
export function useBarcodeScanner(enabled: boolean, onScan: (code: string) => void) {
  const cb = useRef(onScan);
  useEffect(() => { cb.current = onScan; });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let buf = "";
    let last = 0;
    const MAX_GAP = 60;   // ms between keystrokes — scanners are much faster than fingers
    const MIN_LEN = 4;    // shortest code we accept

    const isEditable = (el: Element | null) => {
      if (!el) return false;
      const t = el.tagName;
      return t === "INPUT" || t === "TEXTAREA" || t === "SELECT"
        || (el as HTMLElement).isContentEditable
        || el.getAttribute("role") === "combobox" || el.getAttribute("role") === "textbox";
    };

    const onKey = (e: KeyboardEvent) => {
      if (isEditable(document.activeElement)) { buf = ""; return; }   // let focused fields handle it
      const now = Date.now();
      if (now - last > MAX_GAP) buf = "";   // gap too long → not (or a new) scan
      last = now;

      if (e.key === "Enter") {
        const code = buf.trim();
        buf = "";
        if (code.length >= MIN_LEN) { e.preventDefault(); cb.current(code); }
        return;
      }
      if (e.key.length === 1) buf += e.key;   // a single printable character
    };

    // The SUNMI built-in laser scanner (SS1104) outputs via broadcast, which the
    // native app forwards as a 'sunmi-hw-scan' event — accept it directly (no focus
    // guard, it isn't keystrokes).
    const onHw = (e: Event) => {
      const code = String((e as CustomEvent).detail || "").trim();
      if (code.length >= MIN_LEN) cb.current(code);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("sunmi-hw-scan", onHw as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("sunmi-hw-scan", onHw as EventListener);
    };
  }, [enabled]);
}
