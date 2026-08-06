"use client";
export function PrintButton({ label = "🖨 พิมพ์ / บันทึก PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-ink text-surface hover:opacity-90 transition-colors"
    >
      {label}
    </button>
  );
}
