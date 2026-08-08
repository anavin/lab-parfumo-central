"use client";
import { Printer, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function ReceiptPrintBar({ filename }: { filename: string }) {
  const router = useRouter();
  const print = () => {
    const prev = document.title;
    document.title = filename;
    const restore = () => { document.title = prev; window.removeEventListener("afterprint", restore); };
    window.addEventListener("afterprint", restore);
    window.print();
    setTimeout(restore, 1000);
  };
  return (
    <div className="no-print flex items-center justify-between gap-2 mb-4">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-sm text-muted hover:bg-canvas">
        <ArrowLeft className="w-4 h-4" /> กลับ
      </button>
      <button onClick={print} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-ink text-surface hover:opacity-90">
        <Printer className="w-4 h-4" /> พิมพ์ / บันทึก PDF
      </button>
    </div>
  );
}
