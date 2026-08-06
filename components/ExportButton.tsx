import { Download } from "lucide-react";

// Plain download link to the CSV export route (no client JS needed).
export function ExportButton({ kind, label = "ส่งออก CSV" }: { kind: "sales" | "stock" | "cash"; label?: string }) {
  return (
    <a href={`/api/export/${kind}`}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line bg-surface text-sm font-medium text-ink hover:bg-canvas">
      <Download className="w-4 h-4" /> {label}
    </a>
  );
}
