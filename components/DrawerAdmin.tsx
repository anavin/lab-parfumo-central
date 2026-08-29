"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, FileText } from "lucide-react";
import { confirmDrawer } from "@/lib/actions/cash";
import { DailyReport } from "@/components/DailyReport";
import { PhotoStrip } from "@/components/BillPhotos";
import { baht } from "@/lib/format";
import type { CashAttachment } from "@/lib/queries";

type Row = { entry_date: string; opening: number; seed: number; deposit: number; closing: number; confirmed: boolean; posted: boolean; counted: number | null; variance: number | null };
const fmtDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "2-digit" });

function VarianceChip({ v }: { v: number }) {
  if (v === 0) return <span className="chip-ok">ตรง</span>;
  return <span className={v > 0 ? "chip-info" : "chip-danger"}>{v > 0 ? `เกิน ฿${v.toLocaleString()}` : `ขาด ฿${Math.abs(v).toLocaleString()}`}</span>;
}

function DrawerRow({ r, slips, branch }: { r: Row; slips: CashAttachment[]; branch: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [opening, setOpening] = useState(String(Math.round(r.opening)));
  const [seed, setSeed] = useState(String(Math.round(r.seed)));
  const [deposit, setDeposit] = useState(String(Math.round(r.deposit)));
  const [counted, setCounted] = useState(r.counted == null ? "" : String(Math.round(r.counted)));
  const [viewDate, setViewDate] = useState<string | null>(null);   // report expanded for this day
  const inp = "w-24 border border-line rounded-md px-2 py-1 text-sm text-right tabular-nums bg-surface text-ink focus:outline-none focus:border-brand disabled:bg-canvas disabled:text-muted";
  // live over/short while editing: counted − expected closing (blank = not yet counted)
  const liveVar = counted.trim() === "" ? null : Math.round((Number(counted) || 0) - r.closing);

  const save = () => start(async () => {
    const c = counted.trim() === "" ? null : Number(counted) || 0;
    const res = await confirmDrawer(r.entry_date, branch, Number(opening) || 0, Number(seed) || 0, Number(deposit) || 0, c);
    if (res?.ok) router.refresh(); else alert(res?.error ?? "บันทึกไม่สำเร็จ");
  });

  return (
    <>
      <tr className="border-b border-line-soft hover:bg-canvas align-middle">
        <td className="px-5 py-2.5 font-medium text-ink whitespace-nowrap">{fmtDay(r.entry_date)}</td>
        <td className="px-3 py-2.5 text-right">
          <input value={opening} disabled={r.confirmed || pending} inputMode="numeric"
            onChange={(e) => setOpening(e.target.value.replace(/[^\d]/g, ""))} onFocus={(e) => e.target.select()} className={inp} />
        </td>
        <td className="px-3 py-2.5 text-right">
          <input value={seed} disabled={r.confirmed || pending} inputMode="numeric"
            onChange={(e) => setSeed(e.target.value.replace(/[^\d]/g, ""))} onFocus={(e) => e.target.select()} className={inp} />
        </td>
        <td className="px-3 py-2.5 text-right align-top">
          <input value={deposit} disabled={r.confirmed || pending} inputMode="numeric"
            onChange={(e) => setDeposit(e.target.value.replace(/[^\d]/g, ""))} onFocus={(e) => e.target.select()} className={inp} />
          {/* slips are attached by the salesperson on /my — admin only reviews them here */}
          <div className="mt-1 flex justify-end"><PhotoStrip photos={slips} size={44} kind="cash" /></div>
        </td>
        <td className="px-3 py-2.5 text-right font-semibold text-ink tabular-nums whitespace-nowrap">{baht(r.closing)}</td>
        <td className="px-3 py-2.5 text-right whitespace-nowrap">
          <input value={counted} disabled={r.confirmed || pending} inputMode="numeric" placeholder="—"
            onChange={(e) => setCounted(e.target.value.replace(/[^\d]/g, ""))} onFocus={(e) => e.target.select()} className={inp} />
          <div className="mt-1 flex justify-end h-5">
            {liveVar != null && <VarianceChip v={liveVar} />}
          </div>
        </td>
        <td className="px-5 py-2.5 text-right whitespace-nowrap">
          <button onClick={() => setViewDate((v) => (v ? null : r.entry_date))}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium mr-1 ${viewDate ? "text-brand-dark bg-brand/10" : "text-muted hover:text-ink hover:bg-canvas"}`}>
            <FileText className="w-3.5 h-3.5" /> ดูรายงาน
          </button>
          {r.confirmed ? (
            <span className="inline-flex items-center gap-1 text-xs text-success font-medium"><Lock className="w-3.5 h-3.5" /> เข้าระบบแล้ว</span>
          ) : (
            <button onClick={save} disabled={pending}
              className="btn btn-brand text-xs">
              <Check className="w-3.5 h-3.5" /> {pending ? "กำลังบันทึก…" : "ยืนยัน & บันทึกเข้าระบบ"}
            </button>
          )}
        </td>
      </tr>
      {viewDate && (
        <tr className="border-b border-line-soft bg-canvas/40">
          <td colSpan={7} className="px-4 py-3">
            <div className="max-w-md mx-auto">
              <DailyReport date={viewDate} onDateChange={setViewDate} defaultSource={branch} readOnly />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function DrawerAdmin({ rows, attachments = {}, branch = "CTW" }: { rows: Row[]; attachments?: Record<string, CashAttachment[]>; branch?: string }) {
  if (!rows.length) return <div className="p-8 text-center text-muted text-sm">ยังไม่มีข้อมูลเงินสดหน้าร้าน</div>;
  return (
    <>
      <table className="w-full text-sm">
        <thead className="bg-canvas"><tr className="th border-b border-line-soft">
          <th className="px-5 py-2.5 text-left">วันที่</th>
          <th className="px-3 py-2.5 text-right">ยกมา</th>
          <th className="px-3 py-2.5 text-right">เอาไปสาขา</th>
          <th className="px-3 py-2.5 text-right">🏦 เข้าธนาคาร / สลิป (จากพนักงาน)</th>
          <th className="px-3 py-2.5 text-right">คงเหลือหน้าร้าน</th>
          <th className="px-3 py-2.5 text-right">นับจริง / ผลต่าง</th>
          <th className="px-5 py-2.5 text-right">จัดการ</th>
        </tr></thead>
        {/* key includes branch (+ its figures) so switching สาขา remounts each row and its
            input state resets to the new branch — otherwise old numbers linger until refresh */}
        <tbody>{rows.map((r) => <DrawerRow key={`${branch}-${r.entry_date}`} r={r} slips={attachments[r.entry_date] ?? []} branch={branch} />)}</tbody>
      </table>
      <p className="text-[11px] text-muted px-5 py-2">
        กด “ดูรายงาน” เพื่อตรวจยอดขายของวันนั้น · ตรวจ/แก้ ยกมา–เอาไปสาขา–เข้าธนาคาร แล้ว “ยืนยัน & บันทึกเข้าระบบ” → ยอดเข้าธนาคารลงบัญชีเงินสด (โพสต์ครั้งเดียว แล้วล็อกแถว) · คงเหลือ = ยกมา + เอาไปสาขา + เงินสดขาย − เข้าธนาคาร · สาขาใหม่ ยกมา = 0 · “นับจริง” = เงินสดที่นับได้จริงในลิ้นชัก → ผลต่าง เกิน/ขาด เทียบกับคงเหลือ
      </p>
    </>
  );
}
