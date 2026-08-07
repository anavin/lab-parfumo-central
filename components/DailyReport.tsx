"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ClipboardCopy, Check, FileText } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { getDailyReport } from "@/lib/actions/report";
import type { DailyReport as ReportData } from "@/lib/queries";

const SOURCES = [{ value: "CTW", label: "Central World (CTW)" }, { value: "EVENT_SCS", label: "Event (SCS)" }];
const SRC_SHORT: Record<string, string> = { CTW: "CTW", EVENT_SCS: "Event" };
const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const nf = (n: number) => Math.round(n || 0).toLocaleString("en-US");
const ddmmyy = (iso: string) => { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y.slice(2)}`; };

export function DailyReport({ defaultSource = "CTW" }: { defaultSource?: string }) {
  const [date, setDate] = useState(bkkToday());
  const [source, setSource] = useState(defaultSource);
  const [data, setData] = useState<ReportData | null>(null);
  const [deposit, setDeposit] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    start(async () => { try { setData(await getDailyReport(date, source)); } catch { setData(null); } });
  }, [date, source]);

  const depositN = Number(deposit) || 0;
  const change = Math.max(0, (data?.cash ?? 0) - depositN);   // เงินทอน = เงินสดรับ − ฝากธนาคาร

  const text = useMemo(() => {
    if (!data) return "";
    const lines = [
      `สรุปยอดขาย ${SRC_SHORT[source] ?? source} ${ddmmyy(date)}`,
      ``,
      `จำนวนออเดอร์ ${data.orders} รายการ`,
      `- เงินสด ${nf(data.cash)} บาท`,
      `- โอน/เครดิต ${nf(data.nonCash)} บาท`,
      ``,
      `รวมเป็นเงิน ${nf(data.total)} บาท`,
      ``,
      `คนไทย ${data.thaiCount} ราย เป็นเงิน ${nf(data.thaiAmt)} บาท`,
      `คนต่างชาติ ${data.foreignCount} ราย เป็นเงิน ${nf(data.foreignAmt)} บาท`,
      ...(data.otherCount > 0 ? [`อื่นๆ/ไม่ระบุ ${data.otherCount} ราย เป็นเงิน ${nf(data.otherAmt)} บาท`] : []),
      ``,
      `💵 เงินทอน ${nf(change)} บาท`,
      `🏦 เข้าธนาคาร ${nf(depositN)} บาท`,
    ];
    return lines.join("\n");
  }, [data, source, date, change, depositN]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* clipboard blocked — user can select the text manually */ }
  };

  const inp = "border border-line rounded-lg px-2.5 py-2 text-sm bg-surface text-ink focus:outline-none focus:border-brand";
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-brand-dark" />
        <h3 className="text-base font-semibold text-ink">รายงานประจำวัน</h3>
        <span className="text-xs text-muted">· คัดลอกส่งได้เลย</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={bkkToday()} className={inp} />
        <div className="min-w-[190px]"><Select value={source} onValueChange={setSource} options={SOURCES} /></div>
        <label className="flex items-center gap-1.5 text-sm text-muted ml-auto">
          <span className="whitespace-nowrap">ฝากเข้าธนาคาร</span>
          <input inputMode="numeric" value={deposit} onFocus={(e) => e.target.select()}
            onChange={(e) => setDeposit(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="0" className={inp + " w-28 text-right tabular-nums"} />
        </label>
      </div>

      <div className="relative">
        <pre className="whitespace-pre-wrap font-sans text-sm text-ink bg-canvas border border-line rounded-lg px-4 py-3 min-h-[220px] leading-relaxed">
          {pending && !data ? "กำลังโหลด…" : (data && data.orders === 0 ? `ยังไม่มียอดขายของ ${SRC_SHORT[source] ?? source} วันที่ ${ddmmyy(date)}` : text)}
        </pre>
        <div className="mt-1.5 text-[11px] text-muted">เงินทอน = เงินสดรับ ({nf(data?.cash ?? 0)}) − ฝากธนาคาร ({nf(depositN)}) · โอน/เครดิต = ทุกช่องทางที่ไม่ใช่เงินสด</div>
      </div>

      <div className="flex justify-end mt-3">
        <button onClick={copy} disabled={!text}
          className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">
          {copied ? <><Check className="w-4 h-4" /> คัดลอกแล้ว</> : <><ClipboardCopy className="w-4 h-4" /> คัดลอกรายงาน</>}
        </button>
      </div>
    </div>
  );
}
