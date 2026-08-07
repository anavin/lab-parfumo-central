"use client";
import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

/** Renders a scannable Code128 barcode as inline SVG (prints sharp at any size). */
export function Barcode({
  value, height = 50, width = 1.6, fontSize = 13, displayValue = true, margin = 4,
}: {
  value: string; height?: number; width?: number; fontSize?: number; displayValue?: boolean; margin?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const v = (value || "").trim();
    if (!v) return;
    try {
      JsBarcode(ref.current, v, {
        // a barcode must be black bars on white to scan/print — keep it white-backed
        // even in dark mode (a transparent bg made the black bars vanish on dark rows)
        format: "CODE128", width, height, fontSize, displayValue, margin,
        lineColor: "#000000", background: "#ffffff",
      });
    } catch {
      // invalid barcode value — leave the svg empty rather than crashing the page
    }
  }, [value, height, width, fontSize, displayValue, margin]);
  // bg-white on the svg itself (not a wrapper) keeps the print-label centering CSS —
  // which targets `svg` directly — working, while guaranteeing the black bars stay
  // visible on dark table rows too
  return <svg ref={ref} className="max-w-full h-auto bg-white rounded-[3px]" />;
}
