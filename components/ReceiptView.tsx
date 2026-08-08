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
      className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${lang === v ? "bg-ink text-surface shadow-sm" : "text-muted hover:text-ink"}`}>
      {children}
    </button>
  );

  return (
    <>
      <div className="no-print mb-4 space-y-2.5">
        {/* row 1: back · language */}
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted hover:bg-canvas hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> กลับ
          </button>
          <div className="inline-flex rounded-lg bg-canvas p-0.5 border border-line" role="group" aria-label="ภาษา">
            <Tab v="th">ไทย</Tab>
            <Tab v="en">EN</Tab>
          </div>
        </div>
        {/* row 2: actions — both use the server PDF (always 1 clean page, works in Safari) */}
        <div className="flex items-stretch gap-2">
          <a href={pdfUrl("download")}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-ink text-surface text-sm font-semibold whitespace-nowrap shadow-sm hover:opacity-90 active:scale-[.99] transition">
            <Download className="w-4 h-4 shrink-0" /> ดาวน์โหลด PDF
          </a>
          <a href={pdfUrl("inline")} target="_blank" rel="noopener" title="เปิด PDF เพื่อสั่งพิมพ์"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-line bg-surface text-sm font-medium text-ink whitespace-nowrap hover:bg-canvas active:scale-[.99] transition">
            <Printer className="w-4 h-4 shrink-0" /> พิมพ์
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
