import { code39 } from "@/lib/pdf/code39";

/**
 * On-screen (HTML) Code 39 barcode — uses the SAME encoder as the PDF so the
 * preview and the printed/downloaded document match exactly. Renders as inline
 * SVG (server-safe, no client JS). The value is printed beneath for reference.
 */
export function BarcodeSvg({ value, width = 130, height = 30 }: { value: string; width?: number; height?: number }) {
  const v = (value || "").trim();
  if (!v) return <span className="text-black/40">-</span>;
  const bc = code39(v);
  const scale = width / bc.totalModules;
  return (
    <span className="inline-flex flex-col items-center leading-none">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} shapeRendering="crispEdges">
        {bc.bars.map((b, i) => (
          <rect key={i} x={b.x * scale} y={0} width={b.w * scale} height={height} fill="#000" />
        ))}
      </svg>
      <span className="mt-0.5 text-[9px] tracking-wide text-black/60 tabular-nums">{v}</span>
    </span>
  );
}
