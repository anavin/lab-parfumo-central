"use client";
import { useState } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Receipt, type ReceiptItem, type ReceiptTender, type ReceiptLang } from "./Receipt";

// Client wrapper: TH/EN language toggle + print, around the printable receipt.
export function ReceiptView({ filename, receiptNo, date, time, salesperson, items, paymentChannel, tenders }: {
  filename: string; receiptNo: string; date: string; time?: string; salesperson: string;
  items: ReceiptItem[]; paymentChannel?: string; tenders?: ReceiptTender[];
}) {
  const router = useRouter();
  const [lang, setLang] = useState<ReceiptLang>("th");

  const print = () => {
    const prev = document.title;
    document.title = `${filename}-${lang.toUpperCase()}`;
    const restore = () => { document.title = prev; window.removeEventListener("afterprint", restore); };
    window.addEventListener("afterprint", restore);
    window.print();
    setTimeout(restore, 4000);   // keep the title through a slow Save-as-PDF dialog
  };

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
          <button onClick={print} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-ink text-surface hover:opacity-90">
            <Printer className="w-4 h-4" /> พิมพ์ / บันทึก PDF
          </button>
        </div>
      </div>
      <div className="print-area receipt-sheet rounded-xl border border-line shadow-sm bg-white text-black">
        <Receipt lang={lang} receiptNo={receiptNo} date={date} time={time} salesperson={salesperson}
          items={items} paymentChannel={paymentChannel} tenders={tenders} />
      </div>
    </>
  );
}
