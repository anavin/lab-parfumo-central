"use client";
import { useState } from "react";
import { Printer, ArrowLeft, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { Receipt, type ReceiptItem, type ReceiptTender, type ReceiptLang } from "./Receipt";

// Client wrapper: TH/EN language toggle + server-PDF actions, around the on-screen receipt.
// Both buttons use the server-rendered PDF (always 1 clean page) instead of the browser's
// own print, which Safari renders blank / with a phantom 2nd page.
export function ReceiptView({ filename, receiptNo, date, time, salesperson, items, paymentChannel, tenders }: {
  filename: string; receiptNo: string; date: string; time?: string; salesperson: string;
  items: ReceiptItem[]; paymentChannel?: string; tenders?: ReceiptTender[];
}) {
  const router = useRouter();
  const [lang, setLang] = useState<ReceiptLang>("th");
  const pdfUrl = (disp: "inline" | "download") =>
    `/api/receipt/${encodeURIComponent(receiptNo)}/pdf?lang=${lang}${disp === "inline" ? "&disp=inline" : ""}`;

  const Tab = ({ v, children }: { v: ReceiptLang; children: React.ReactNode }) => (
    <button onClick={() => setLang(v)}
      className={`px-3 py-2 text-sm font-medium transition-colors ${lang === v ? "bg-ink text-surface" : "text-muted hover:bg-canvas"}`}>
      {children}
    </button>
  );

  return (
    <>
      <div className="no-print flex items-center justify-between gap-2 mb-4">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-sm text-muted hover:bg-canvas">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </button>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-line overflow-hidden" role="group" aria-label="ภาษา">
            <Tab v="th">ไทย</Tab>
            <Tab v="en">EN</Tab>
          </div>
          {/* both use the server PDF (always 1 clean page, works in Safari) */}
          <a href={pdfUrl("download")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-ink text-surface hover:opacity-90">
            <Download className="w-4 h-4" /> ดาวน์โหลด PDF
          </a>
          <a href={pdfUrl("inline")} target="_blank" rel="noopener" title="เปิด PDF เพื่อสั่งพิมพ์"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-sm font-medium text-muted hover:bg-canvas">
            <Printer className="w-4 h-4" /> พิมพ์
          </a>
        </div>
      </div>
      <div className="print-area receipt-sheet rounded-xl border border-line shadow-sm bg-white text-black">
        <Receipt lang={lang} receiptNo={receiptNo} date={date} time={time} salesperson={salesperson}
          items={items} paymentChannel={paymentChannel} tenders={tenders} />
      </div>
    </>
  );
}
