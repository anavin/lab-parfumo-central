"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ClipboardCopy, Check, FileText } from "lucide-react";
import { getDailyReport } from "@/lib/actions/report";
import type { DailyReport as ReportData } from "@/lib/queries";

const SRC_SHORT: Record<string, string> = { CTW: "CTW", EVENT_SCS: "Event" };
const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const nf = (n: number) => Math.round(n || 0).toLocaleString("en-US");
const ddmmyy = (iso: string) => { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y.slice(2)}`; };

export function DailyReport({ defaultSource = "CTW", revision, mine = false }: { defaultSource?: string; revision?: string | number; mine?: boolean }) {
  const [date, setDate] = useState(bkkToday());
  const source = defaultSource;   // single location (CTW) — no branch picker
  const [data, setData] = useState<ReportData | null>(null);
  const [opening, setOpening] = useState("");   // เงินทอนยกมา (opening float carried from the previous day)
  const [deposit, setDeposit] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  // re-fetch on date change AND whenever `revision` changes (the page re-renders it
  // after a bill is saved/approved via router.refresh, so the report stays live)
  useEffect(() => {
    start(async () => { try { setData(await getDailyReport(date, source, mine)); } catch { setData(null); } });
  }, [date, source, revision, mine]);

  const openingN = Number(opening) || 0;
  const depositN = Number(deposit) || 0;
  // เงินสดหน้าร้าน (คงเหลือปลายวัน) = ยอดยกมา + เงินสดรับ − ฝากเข้าธนาคาร
  const change = Math.max(0, openingN + (data?.cash ?? 0) - depositN);

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
      `เงินทอนยกมา ${nf(openingN)} บาท`,
      `💵 เงินสดหน้าร้าน ${nf(change)} บาท`,
      `🏦 เข้าธนาคาร ${nf(depositN)} บาท`,
    ];
    return lines.join("\n");
  }, [data, source, date, change, depositN, openingN]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* clipboard blocked — user can select the text manually */ }
  };

  const inp = "w-full border border-line rounded-lg px-3 py-2.5 text-sm bg-surface text-ink focus:outline-none focus:border-brand";
  const ready = !!data && data.orders > 0;
  const srcLabel = SRC_SHORT[source] ?? source;

  // one aligned "receipt" line: label left, amount right
  const Line = ({ label, value, strong = false }: { label: React.ReactNode; value: string; strong?: boolean }) => (
    <div className="flex items-baseline justify-between gap-3">
      <span className={strong ? "text-sm font-semibold text-ink" : "text-sm text-muted"}>{label}</span>
      <span className={strong ? "text-xl font-bold text-brand-dark tabular-nums" : "text-sm font-semibold text-ink tabular-nums"}>{value}</span>
    </div>
  );
  const Rule = () => <div className="my-2.5 border-t border-dashed border-line" />;

  return (
    <div className="card p-4 sm:p-5">
      {/* header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand-dark flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ink leading-tight">รายงานประจำวัน</h3>
          <p className="text-xs text-muted">คัดลอกส่ง LINE ได้เลย</p>
        </div>
      </div>

      {/* controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="block col-span-2">
          <span className="text-xs text-muted mb-1 block">วันที่</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={bkkToday()} className={inp} />
        </label>
        <label className="block">
          <span className="text-xs text-muted mb-1 block">เงินทอนยกมา</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">฿</span>
            <input inputMode="numeric" value={opening} onFocus={(e) => e.target.select()}
              onChange={(e) => setOpening(e.target.value.replace(/[^\d]/g, ""))} placeholder="0"
              className={inp + " pl-7 text-right tabular-nums font-medium"} />
          </div>
        </label>
        <label className="block">
          <span className="text-xs text-muted mb-1 block">ฝากเข้าธนาคาร</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">฿</span>
            <input inputMode="numeric" value={deposit} onFocus={(e) => e.target.select()}
              onChange={(e) => setDeposit(e.target.value.replace(/[^\d]/g, ""))} placeholder="0"
              className={inp + " pl-7 text-right tabular-nums font-medium"} />
          </div>
        </label>
      </div>

      {/* receipt-style preview */}
      <div className="rounded-xl border border-line bg-canvas px-4 py-4">
        <div className="text-center pb-3 mb-3 border-b border-dashed border-line">
          <div className="text-[15px] font-bold text-ink">สรุปยอดขาย {srcLabel}</div>
          <div className="text-xs text-muted tabular-nums mt-0.5">{ddmmyy(date)}</div>
        </div>

        {pending && !data ? (
          <div className="py-8 text-center text-sm text-muted">กำลังโหลด…</div>
        ) : !ready ? (
          <div className="py-8 text-center text-sm text-muted">ยังไม่มียอดขายของวันนี้</div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Line label="จำนวนออเดอร์" value={`${data!.orders} รายการ`} />
              <Line label="เงินสด" value={`${nf(data!.cash)} บาท`} />
              <Line label="โอน / เครดิต" value={`${nf(data!.nonCash)} บาท`} />
            </div>
            <Rule />
            <Line label="รวมเป็นเงิน" value={`${nf(data!.total)} บาท`} strong />
            <Rule />
            <div className="space-y-1.5">
              <Line label={`🇹🇭 คนไทย · ${data!.thaiCount} ราย`} value={`${nf(data!.thaiAmt)} บาท`} />
              <Line label={`🌏 ต่างชาติ · ${data!.foreignCount} ราย`} value={`${nf(data!.foreignAmt)} บาท`} />
              {data!.otherCount > 0 && <Line label={`• อื่นๆ · ${data!.otherCount} ราย`} value={`${nf(data!.otherAmt)} บาท`} />}
            </div>
            <Rule />
            <div className="space-y-1.5">
              <Line label="เงินทอนยกมา" value={`${nf(openingN)} บาท`} />
              <Line label="💵 เงินสดหน้าร้าน" value={`${nf(change)} บาท`} strong />
              <Line label="🏦 เข้าธนาคาร" value={`${nf(depositN)} บาท`} />
            </div>
          </>
        )}
      </div>

      <p className="text-[11px] text-muted mt-2 text-center">เงินสดหน้าร้าน = เงินทอนยกมา + เงินสดรับ − ฝากเข้าธนาคาร · โอน/เครดิต = ทุกช่องทางที่ไม่ใช่เงินสด</p>

      <button onClick={copy} disabled={!ready}
        className="w-full mt-3 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark active:scale-[.99] transition disabled:opacity-50">
        {copied ? <><Check className="w-4 h-4" /> คัดลอกแล้ว</> : <><ClipboardCopy className="w-4 h-4" /> คัดลอกรายงาน</>}
      </button>
    </div>
  );
}
