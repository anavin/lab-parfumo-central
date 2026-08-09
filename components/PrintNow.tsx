"use client";
import { useEffect } from "react";
import { Printer, ArrowLeft } from "lucide-react";

// Standalone print page toolbar: sets a tidy PDF filename (document.title) and
// auto-opens the print dialog once fonts are ready. Also a manual print button.
export function PrintNow({ title }: { title: string }) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    let done = false;
    const go = () => { if (done) return; done = true; try { window.print(); } catch {} };
    // wait for Thai webfonts so nothing renders blank/wrong, then print
    const ready = (document as any).fonts?.ready as Promise<unknown> | undefined;
    const t = setTimeout(go, 1200);
    ready?.then(() => setTimeout(go, 250)).catch(() => {});
    return () => { clearTimeout(t); document.title = prev; };
  }, [title]);

  const print = () => { document.title = title; window.print(); };
  return (
    <div className="no-print flex items-center justify-between gap-2">
      <button onClick={() => window.close()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-300 text-sm text-neutral-600 hover:bg-neutral-100">
        <ArrowLeft className="w-4 h-4" /> ปิด
      </button>
      <button onClick={print} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-neutral-900 text-white hover:opacity-90">
        <Printer className="w-4 h-4" /> พิมพ์ / บันทึก PDF
      </button>
    </div>
  );
}
