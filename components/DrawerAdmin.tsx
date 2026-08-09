"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, FileText } from "lucide-react";
import { confirmDrawer } from "@/lib/actions/cash";
import { DailyReport } from "@/components/DailyReport";
import { baht } from "@/lib/format";

type Row = { entry_date: string; opening: number; deposit: number; closing: number; confirmed: boolean; posted: boolean };
const fmtDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "2-digit" });

function DrawerRow({ r }: { r: Row }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [opening, setOpening] = useState(String(Math.round(r.opening)));
  const [deposit, setDeposit] = useState(String(Math.round(r.deposit)));
  const [viewDate, setViewDate] = useState<string | null>(null);   // report expanded for this day
  const inp = "w-24 border border-line rounded-md px-2 py-1 text-sm text-right tabular-nums bg-surface text-ink focus:outline-none focus:border-brand disabled:bg-canvas disabled:text-muted";

  const save = () => start(async () => {
    const res = await confirmDrawer(r.entry_date, Number(opening) || 0, Number(deposit) || 0);
    if (res?.ok) router.refresh(); else alert(res?.error ?? "บันทึกไม่สำเร็จ");
  });

  return (
    <>
      <tr className="border-b border-line-soft hover:bg-canvas align-middle">
        <td className="px-5 py-2.5 font-medium text-ink whitespace-nowrap">{fmtDay(r.entry_date)}</td>
        <td className="px-3 py-2.5 text-right">
          <input value={opening} disabled={r.posted || pending} inputMode="numeric"
            onChange={(e) => setOpening(e.target.value.replace(/[^\d]/g, ""))} onFocus={(e) => e.target.select()} className={inp} />
        </td>
        <td className="px-3 py-2.5 text-right">
          <input value={deposit} disabled={r.posted || pending} inputMode="numeric"
            onChange={(e) => setDeposit(e.target.value.replace(/[^\d]/g, ""))} onFocus={(e) => e.target.select()} className={inp} />
        </td>
        <td className="px-3 py-2.5 text-right font-semibold text-ink tabular-nums whitespace-nowrap">{baht(r.closing)}</td>
        <td className="px-5 py-2.5 text-right whitespace-nowrap">
          <button onClick={() => setViewDate((v) => (v ? null : r.entry_date))}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium mr-1 ${viewDate ? "text-brand-dark bg-brand/10" : "text-muted hover:text-ink hover:bg-canvas"}`}>
            <FileText className="w-3.5 h-3.5" /> ดูรายงาน
          </button>
          {r.posted ? (
            <span className="inline-flex items-center gap-1 text-xs text-success font-medium"><Lock className="w-3.5 h-3.5" /> เข้าระบบแล้ว</span>
          ) : (
            <span className="inline-flex items-center gap-2">
              {r.confirmed && <span className="inline-flex items-center gap-1 text-xs text-success font-medium"><Check className="w-3.5 h-3.5" /> ยืนยันแล้ว</span>}
              <button onClick={save} disabled={pending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-dark disabled:opacity-50">
                <Check className="w-3.5 h-3.5" /> {pending ? "กำลังบันทึก…" : r.confirmed ? "ยืนยันใหม่" : "ยืนยัน & บันทึกเข้าระบบ"}
              </button>
            </span>
          )}
        </td>
      </tr>
      {viewDate && (
        <tr className="border-b border-line-soft bg-canvas/40">
          <td colSpan={5} className="px-4 py-3">
            <div className="max-w-md mx-auto">
              <DailyReport date={viewDate} onDateChange={setViewDate} readOnly />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function DrawerAdmin({ rows }: { rows: Row[] }) {
  if (!rows.length) return <div className="p-8 text-center text-muted text-sm">ยังไม่มีข้อมูลเงินสดหน้าร้าน</div>;
  return (
    <>
      <table className="w-full text-sm">
        <thead className="bg-canvas"><tr className="th border-b border-line-soft">
          <th className="px-5 py-2.5 text-left">วันที่</th>
          <th className="px-3 py-2.5 text-right">ยกมา</th>
          <th className="px-3 py-2.5 text-right">🏦 เข้าธนาคาร</th>
          <th className="px-3 py-2.5 text-right">คงเหลือหน้าร้าน</th>
          <th className="px-5 py-2.5 text-right">จัดการ</th>
        </tr></thead>
        <tbody>{rows.map((r) => <DrawerRow key={r.entry_date} r={r} />)}</tbody>
      </table>
      <p className="text-[11px] text-muted px-5 py-2">
        กด “ดูรายงาน” เพื่อตรวจยอดขายของวันนั้น · ตรวจ/แก้ ยกมา–เข้าธนาคาร แล้ว “ยืนยัน & บันทึกเข้าระบบ” → ยอดเข้าธนาคารลงบัญชีเงินสด (โพสต์ครั้งเดียว แล้วล็อกแถว) · คงเหลือ = ยกมา + เงินสดขาย − เข้าธนาคาร
      </p>
    </>
  );
}
