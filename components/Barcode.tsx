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
        format: "CODE128", width, height, fontSize, displayValue, margin,
        lineColor: "#000000", background: "transparent",
      });
    } catch {
      // invalid barcode value — leave the svg empty rather than crashing the page
    }
  }, [value, height, width, fontSize, displayValue, margin]);
  return <svg ref={ref} className="max-w-full h-auto" />;
}
