"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ClipboardCopy, Check, FileText, Paperclip, Loader2, Camera } from "lucide-react";
import { getDailyReport, getMyCashFloat, saveMyCashFloat } from "@/lib/actions/report";
import { getCashSlips, addCashAttachments, deleteCashAttachment } from "@/lib/actions/cash";
import { PhotoStrip } from "@/components/BillPhotos";
import { CameraCapture } from "@/components/CameraCapture";
import { compressImage } from "@/lib/img";
const hasGetUserMedia = () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
import type { DailyReport as ReportData, CashAttachment } from "@/lib/queries";
import { branchName } from "@/lib/branches";
const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const nf = (n: number) => Math.round(n || 0).toLocaleString("en-US");
const ddmmyy = (iso: string) => { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y.slice(2)}`; };

export function DailyReport({ defaultSource = "CTW", revision, mine = false, date: dateProp, onDateChange, readOnly = false }: {
  defaultSource?: string; revision?: string | number; mine?: boolean;
  date?: string; onDateChange?: (d: string) => void; readOnly?: boolean;   // readOnly = verify view (no autosave)
}) {
  const [dateI, setDateI] = useState(bkkToday());
  const date = dateProp ?? dateI;
  const setDate = onDateChange ?? setDateI;
  const source = defaultSource;   // branch (สาขา) this report is for — chosen on /my, or CTW default
  const [data, setData] = useState<ReportData | null>(null);
  const [opening, setOpening] = useState("");   // เงินสดหน้าร้านยกมา (auto: carried from the previous day)
  const [seed, setSeed] = useState("");         // เงินสดที่เอาไปสาขา (float brought to the branch today)
  const [deposit, setDeposit] = useState("");
  const [locked, setLocked] = useState(false);  // admin has confirmed this day → read-only on /my
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);   // brief "จำแล้ว" flash on autosave (mine only)
  const [pending, start] = useTransition();
  const loaded = useRef(false);
  const [slips, setSlips] = useState<CashAttachment[]>([]);   // bank-deposit slips for the day
  const slipRef = useRef<HTMLInputElement>(null);
  const slipCamRef = useRef<HTMLInputElement>(null);
  const [slipBusy, setSlipBusy] = useState(false);
  const [slipErr, setSlipErr] = useState<string | null>(null);
  const [slipCam, setSlipCam] = useState(false);   // in-app camera overlay for deposit slips

  // re-fetch on date change AND whenever `revision` changes (the page re-renders it
  // after a bill is saved/approved via router.refresh, so the report stays live)
  useEffect(() => {
    start(async () => { try { setData(await getDailyReport(date, source, mine)); } catch { setData(null); } });
  }, [date, source, revision, mine]);

  // load the shared shop-drawer opening/deposit for the day (carries forward). Loaded for
  // every viewer now that the drawer is shared; only /my autosaves changes back.
  useEffect(() => {
    loaded.current = false;
    getMyCashFloat(date, source)
      .then((r) => { setOpening(r.opening ? String(Math.round(r.opening)) : ""); setSeed(r.seed ? String(Math.round(r.seed)) : ""); setDeposit(r.deposit ? String(Math.round(r.deposit)) : ""); setLocked(!!(r as any).locked); })
      .catch(() => {})
      .finally(() => { loaded.current = true; });
  }, [date, mine, source]);

  // bank-deposit slips for this (day, branch)
  useEffect(() => {
    getCashSlips(date, source).then(setSlips).catch(() => setSlips([]));
  }, [date, revision, source]);

  const addSlips = async (files: FileList | File[] | null) => {
    if (!files?.length) return;
    setSlipBusy(true); setSlipErr(null);
    try {
      const room = Math.max(0, 6 - slips.length);
      const out: string[] = [];
      for (const f of Array.from(files).slice(0, room)) { try { out.push(await compressImage(f)); } catch { /* skip bad image */ } }
      if (!out.length) { setSlipErr("แนบไม่สำเร็จ — รองรับ JPG/PNG"); return; }
      const res = await addCashAttachments(date, out, source);
      if (res?.ok) setSlips(await getCashSlips(date, source)); else setSlipErr(res?.error ?? "แนบไม่สำเร็จ");
    } finally { setSlipBusy(false); if (slipRef.current) slipRef.current.value = ""; if (slipCamRef.current) slipCamRef.current.value = ""; }
  };
  const removeSlip = (id: number) => {
    setSlips((s) => s.filter((x) => x.id !== id));   // optimistic
    deleteCashAttachment(id).catch(() => getCashSlips(date, source).then(setSlips));
  };

  const openingN = Number(opening) || 0;
  const seedN = Number(seed) || 0;
  const depositN = Number(deposit) || 0;
  // the shop drawer is shared per (day, branch), so it uses BRANCH-WIDE cash — not just
  // this salesperson's — otherwise two people at one branch see/overwrite wrong closings.
  const cashOnHand = openingN + seedN + (data?.branchCash ?? data?.cash ?? 0);   // เงินสดหน้าร้าน = ยกมา + เอาไป + เงินสดรับทั้งสาขา (ก่อนฝาก)
  const closing = Math.max(0, cashOnHand - depositN); // คงเหลือ = เงินสดหน้าร้าน − เข้าธนาคาร → ยกไปวันถัดไป

  // on /my: autosave the drawer figures (debounced) so they persist + carry forward
  useEffect(() => {
    if (!mine || readOnly || locked || !loaded.current) return;   // don't churn an admin-confirmed day
    const t = setTimeout(() => {
      saveMyCashFloat(date, source, openingN, seedN, depositN, closing).then((r) => { if (r?.ok) { setSaved(true); setTimeout(() => setSaved(false), 1500); } }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [mine, date, source, openingN, seedN, depositN, closing, locked]);

  const text = useMemo(() => {
    if (!data) return "";
    const lines = [
      `สรุปยอดขาย ${branchName(source)} ${ddmmyy(date)}`,
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
      `เงินสดยกมา ${nf(openingN)} บาท`,
      ...(seedN ? [`เงินสดที่เอาไปสาขา ${nf(seedN)} บาท`] : []),
      `เงินสดหน้าร้าน ${nf(cashOnHand)} บาท`,
      `🏦 เข้าธนาคาร ${nf(depositN)} บาท`,
      `💵 เงินสดหน้าร้านคงเหลือ ${nf(closing)} บาท`,
    ];
    return lines.join("\n");
  }, [data, source, date, cashOnHand, closing, depositN, openingN, seedN]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* clipboard blocked — user can select the text manually */ }
  };

  const inp = "w-full border border-line rounded-lg px-3 py-2.5 text-sm bg-surface text-ink focus:outline-none focus:border-brand";
  const ready = !!data && data.orders > 0;
  const srcLabel = branchName(source);

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
      {/* header — hidden in the verify view (slip only) */}
      {!readOnly && (
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand-dark flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ink leading-tight">รายงานประจำวัน · {srcLabel}</h3>
          <p className="text-xs text-muted">
            คัดลอกส่ง LINE ได้เลย
            {mine && (saved
              ? <span className="text-success ml-1">· ✓ จำแล้ว</span>
              : <span className="text-muted-soft ml-1">· จำค่าเงินสดให้อัตโนมัติ</span>)}
          </p>
        </div>
      </div>
      )}

      {!readOnly && locked && (
        <div className="mb-3 text-[11px] text-muted bg-canvas border border-line rounded-lg px-3 py-2">🔒 แอดมินยืนยันเงินสดของวันนี้แล้ว — แก้ไขไม่ได้</div>
      )}
      {/* controls — hidden in the verify view */}
      {!readOnly && (
      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="block col-span-2">
          <span className="text-xs text-muted mb-1 block">วันที่</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={bkkToday()} className={inp} />
        </label>
        <label className="block">
          <span className="text-xs text-muted mb-1 block">เงินสดยกมา <span className="text-muted-soft">(อัตโนมัติ)</span></span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">฿</span>
            {/* ยกมา is always the carried-forward closing of the previous day (0 for a new
                branch) — read-only; brought cash goes in "เงินสดที่เอาไปสาขา" below. */}
            <input inputMode="numeric" value={opening} readOnly title="ยกจากคงเหลือเมื่อวาน (สาขาใหม่ = 0)"
              placeholder="0" className={inp + " pl-7 text-right tabular-nums font-medium bg-canvas text-muted"} />
          </div>
        </label>
        <label className="block">
          <span className="text-xs text-muted mb-1 block">เงินสดที่เอาไปสาขา</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">฿</span>
            <input inputMode="numeric" value={seed} onFocus={(e) => e.target.select()} readOnly={readOnly || locked}
              onChange={(e) => setSeed(e.target.value.replace(/[^\d]/g, ""))} placeholder="0"
              className={inp + " pl-7 text-right tabular-nums font-medium" + (readOnly || locked ? " bg-canvas text-muted" : "")} />
          </div>
        </label>
        <label className="block col-span-2">
          <span className="text-xs text-muted mb-1 block">ฝากเข้าธนาคาร</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">฿</span>
            <input inputMode="numeric" value={deposit} onFocus={(e) => e.target.select()} readOnly={readOnly || locked}
              onChange={(e) => setDeposit(e.target.value.replace(/[^\d]/g, ""))} placeholder="0"
              className={inp + " pl-7 text-right tabular-nums font-medium" + (readOnly || locked ? " bg-canvas text-muted" : "")} />
          </div>
        </label>
        {/* bank-deposit slip photos — attached right under ฝากเข้าธนาคาร */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted">สลิปฝากธนาคาร</span>
            <span className="text-[11px] text-muted-soft">{slips.length}/6</span>
          </div>
          <PhotoStrip photos={slips} size={56} onDelete={removeSlip} kind="cash" />
          {slips.length < 6 && (
            <div className="flex justify-end gap-2 mt-1.5">
              <button type="button" onClick={() => (hasGetUserMedia() ? setSlipCam(true) : slipCamRef.current?.click())} disabled={slipBusy}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg border border-dashed border-line text-xs text-muted hover:bg-canvas disabled:opacity-50">
                {slipBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} ถ่ายรูป
              </button>
              <button type="button" onClick={() => slipRef.current?.click()} disabled={slipBusy}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg border border-dashed border-line text-xs text-muted hover:bg-canvas disabled:opacity-50">
                <Paperclip className="w-4 h-4" /> แนบสลิป
              </button>
            </div>
          )}
          <input ref={slipRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addSlips(e.target.files)} />
          <input ref={slipCamRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => addSlips(e.target.files)} />
          {slipErr && <div className="mt-1 text-[11px] text-danger leading-snug">{slipErr}</div>}
          {slipCam && <CameraCapture onCapture={(f) => { setSlipCam(false); addSlips([f]); }} onClose={() => setSlipCam(false)} />}
        </div>
      </div>
      )}

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
              <Line label="เงินสดยกมา" value={`${nf(openingN)} บาท`} />
              {seedN > 0 && <Line label="เงินสดที่เอาไปสาขา" value={`${nf(seedN)} บาท`} />}
              <Line label="เงินสดหน้าร้าน" value={`${nf(cashOnHand)} บาท`} />
              <Line label="🏦 เข้าธนาคาร" value={`${nf(depositN)} บาท`} strong />
              <Line label="💵 เงินสดหน้าร้านคงเหลือ" value={`${nf(closing)} บาท`} strong />
            </div>
            <p className="text-[11px] text-muted mt-1.5 text-center">คงเหลือ {nf(closing)} → ยกไปเป็น &quot;เงินสดยกมา&quot; ของวันพรุ่งนี้</p>
          </>
        )}
      </div>

      {!readOnly && (
        <p className="text-[11px] text-muted mt-2 text-center">เงินสดหน้าร้าน = ยกมา + เอาไปสาขา + เงินสดรับ · คงเหลือ = เงินสดหน้าร้าน − เข้าธนาคาร · โอน/เครดิต = ทุกช่องทางที่ไม่ใช่เงินสด</p>
      )}

      {!readOnly && (
        <button onClick={copy} disabled={!ready}
          className="w-full mt-3 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark active:scale-[.99] transition disabled:opacity-50">
          {copied ? <><Check className="w-4 h-4" /> คัดลอกแล้ว</> : <><ClipboardCopy className="w-4 h-4" /> คัดลอกรายงาน</>}
        </button>
      )}
    </div>
  );
}
