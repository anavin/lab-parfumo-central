"use client";
import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

/** Renders a scannable Code128 barcode. Inline SVG by default (sharp print, used by the
 *  product-label page whose centering CSS targets `svg`). Pass `asImage` to emit an <img>
 *  with the SVG embedded as a data URI instead — Safari keeps JS-injected <svg> out of the
 *  print snapshot when the print view sits idle, so documents (ใบเบิก) use the image form. */
export function Barcode({
  value, height = 50, width = 1.6, fontSize = 13, displayValue = true, margin = 4, asImage = false,
}: {
  value: string; height?: number; width?: number; fontSize?: number; displayValue?: boolean; margin?: number; asImage?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const opts = { format: "CODE128" as const, width, height, fontSize, displayValue, margin, lineColor: "#000000", background: "#ffffff" };
  useEffect(() => {
    const v = (value || "").trim();
    if (!v) return;
    if (asImage) {
      // render into a detached SVG, serialize to a data URI, and show it as a static image
      try {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        JsBarcode(svg, v, opts);
        const xml = new XMLSerializer().serializeToString(svg);
        const uri = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
        if (imgRef.current) imgRef.current.src = uri;
      } catch { /* invalid value — leave empty */ }
      return;
    }
    if (!svgRef.current) return;
    // a barcode must be black bars on white to scan/print — keep it white-backed even in
    // dark mode (a transparent bg made the black bars vanish on dark rows)
    try { JsBarcode(svgRef.current, v, opts); } catch { /* invalid — leave empty */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, height, width, fontSize, displayValue, margin, asImage]);
  // bg-white kept on the element itself so the print-label centering CSS (targets svg/img)
  // works and the black bars stay visible on dark table rows too
  if (asImage) return <img ref={imgRef} alt={value} className="max-w-full h-auto bg-white rounded-[3px]" />;
  return <svg ref={svgRef} className="max-w-full h-auto bg-white rounded-[3px]" />;
}
