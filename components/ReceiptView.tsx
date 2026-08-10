"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Printer, ArrowLeft, Download, Mail, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { emailReceipt } from "@/lib/actions/receipt";
import { Receipt, type ReceiptItem, type ReceiptTender, type ReceiptLang } from "./Receipt";

// Bridge injected by the SUNMI Android wrapper app (sunmi-pos-app). When the
// receipt page runs inside that WebView, window.SunmiBridge lets us print the
// on-screen receipt straight to the device's built-in thermal printer.
declare global {
  interface Window {
    SunmiBridge?: { printImage?: (base64Png: string) => void; isReady?: () => boolean };
  }
}

// Client wrapper: TH/EN language toggle + server-PDF actions, around the on-screen receipt.
// Both buttons use the server-rendered PDF (always 1 clean page) instead of the browser's
// own print, which Safari renders blank / with a phantom 2nd page.
export function ReceiptView({ filename, receiptNo, date, time, salesperson, items, paymentChannel, tenders }: {
  filename: string; receiptNo: string; date: string; time?: string; salesperson: string;
  items: ReceiptItem[]; paymentChannel?: string; tenders?: ReceiptTender[];
}) {
  const router = useRouter();
  const [lang, setLang] = useState<ReceiptLang>("th");
  const [email, setEmail] = useState("");
  const [sending, startSend] = useTransition();
  const [sent, setSent] = useState(false);
  const [mailErr, setMailErr] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [nativePrinter, setNativePrinter] = useState(false);   // running inside the SUNMI app?
  const [thermalBusy, setThermalBusy] = useState(false);
  const [thermalErr, setThermalErr] = useState<string | null>(null);

  useEffect(() => { setNativePrinter(typeof window !== "undefined" && !!window.SunmiBridge?.printImage); }, []);

  // Render the on-screen receipt to a crisp black-&-white PNG for the 58mm thermal
  // head. Thermal heads print 1-bit: grey pixels dither to sparse dots (faint), so
  // we render at 2×, downscale to the head's 384-dot width, then BINARIZE to pure
  // black/white — that's what makes the slip sharp instead of pale.
  const PRINT_WIDTH = 384;        // 58mm head = 384 dots (80mm = 576)
  const THRESHOLD = 180;          // lum < this → black (keeps thin text + dashed rules)
  const printThermal = async () => {
    if (!sheetRef.current) return;
    setThermalBusy(true); setThermalErr(null);
    try {
      const el = sheetRef.current.querySelector<HTMLElement>(".receipt") ?? sheetRef.current;
      const { default: html2canvas } = await import("html2canvas");
      const big = await html2canvas(el, { backgroundColor: "#ffffff", scale: 2, useCORS: true, logging: false });

      // downscale to exactly the print width (Android then prints 1:1, no re-blur)
      const out = document.createElement("canvas");
      out.width = PRINT_WIDTH;
      out.height = Math.max(1, Math.round((big.height * PRINT_WIDTH) / big.width));
      const ctx = out.getContext("2d");
      if (!ctx) throw new Error("no ctx");
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(big, 0, 0, out.width, out.height);

      // binarize → solid black text/lines on white (no faint grey)
      const im = ctx.getImageData(0, 0, out.width, out.height);
      const d = im.data;
      for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const v = lum < THRESHOLD ? 0 : 255;
        d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
      }
      ctx.putImageData(im, 0, 0);

      const base64 = out.toDataURL("image/png").split(",")[1] || "";
      if (!base64) throw new Error("empty image");
      window.SunmiBridge?.printImage?.(base64);
    } catch (e) {
      console.error("[thermal] print failed", e);
      setThermalErr("พิมพ์ไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally { setThermalBusy(false); }
  };

  const sendEmail = () => {
    setMailErr(null); setSent(false);
    startSend(async () => {
      const res = await emailReceipt(receiptNo, email.trim(), lang);
      if (res?.ok) { setSent(true); setEmail(""); setTimeout(() => setSent(false), 4000); }
      else setMailErr(res?.error ?? "ส่งอีเมลไม่สำเร็จ");
    });
  };

  // The receipt usually opens in a NEW TAB (target=_blank) where there's no history,
  // so router.back() does nothing. Fall back to the page that opened it, else close.
  const goBack = () => {
    if (window.history.length > 1) { router.back(); return; }
    const ref = document.referrer;
    try { if (ref && new URL(ref).origin === location.origin) { location.href = ref; return; } } catch {}
    window.close();
  };
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
          <button onClick={goBack} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted hover:bg-canvas hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> กลับ
          </button>
          <div className="inline-flex rounded-lg bg-canvas p-0.5 border border-line" role="group" aria-label="ภาษา">
            <Tab v="th">ไทย</Tab>
            <Tab v="en">EN</Tab>
          </div>
        </div>
        {/* row 2: actions — equal-weight buttons; both use the server PDF (1 clean page, works in Safari) */}
        <div className="grid grid-cols-2 gap-2">
          <a href={pdfUrl("download")}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-line bg-surface text-ink text-sm font-semibold whitespace-nowrap hover:bg-canvas active:scale-[.99] transition">
            <Download className="w-4 h-4 shrink-0" /> ดาวน์โหลด PDF
          </a>
          <a href={pdfUrl("inline")} target="_blank" rel="noopener" title="เปิด PDF เพื่อสั่งพิมพ์"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-line bg-surface text-ink text-sm font-semibold whitespace-nowrap hover:bg-canvas active:scale-[.99] transition">
            <Printer className="w-4 h-4 shrink-0" /> พิมพ์
          </a>
        </div>
        {/* thermal print — only inside the SUNMI app (built-in printer) */}
        {nativePrinter && (
          <div>
            <button onClick={printThermal} disabled={thermalBusy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand text-white text-sm font-semibold whitespace-nowrap hover:bg-brand-dark active:scale-[.99] transition disabled:opacity-50">
              {thermalBusy ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <Printer className="w-4 h-4 shrink-0" />} พิมพ์สลิป (เครื่องนี้)
            </button>
            {thermalErr && <div className="mt-1.5 text-xs text-danger">{thermalErr}</div>}
          </div>
        )}
        {/* row 3: email the receipt to the customer (also collects their email) */}
        <div>
          <div className="flex gap-2">
            <input type="email" inputMode="email" value={email} onChange={(e) => { setEmail(e.target.value); setMailErr(null); }}
              onKeyDown={(e) => { if (e.key === "Enter" && email.trim() && !sending) sendEmail(); }}
              placeholder="อีเมลลูกค้า เพื่อส่งใบเสร็จ" disabled={sending}
              className="flex-1 min-w-0 border border-line rounded-xl px-3 py-3 text-sm bg-surface text-ink focus:outline-none focus:border-brand disabled:bg-canvas" />
            <button onClick={sendEmail} disabled={sending || !email.trim()}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-ink text-surface text-sm font-semibold whitespace-nowrap hover:opacity-90 active:scale-[.99] transition disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <Mail className="w-4 h-4 shrink-0" />} ส่งอีเมล
            </button>
          </div>
          {sent && <div className="mt-1.5 text-xs text-success inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> ส่งใบเสร็จให้ลูกค้าแล้ว</div>}
          {mailErr && <div className="mt-1.5 text-xs text-danger">{mailErr}</div>}
        </div>
      </div>
      <div ref={sheetRef} className="print-area receipt-sheet rounded-xl border border-line shadow-sm bg-white text-black">
        <Receipt lang={lang} receiptNo={receiptNo} date={date} time={time} salesperson={salesperson}
          items={items} paymentChannel={paymentChannel} tenders={tenders} />
      </div>
    </>
  );
}
