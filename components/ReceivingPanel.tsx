"use client";
import { useState, useTransition, useEffect } from "react";
import { beep } from "@/lib/feedback";
import { useRouter } from "next/navigation";
import { PackageCheck, ChevronDown, Loader2, ScanLine, Warehouse } from "lucide-react";
import { receiveRequisition, ctwRequisitionStatus } from "@/lib/actions/requisitions";
import { useBarcodeScanner } from "@/lib/useBarcodeScanner";

const CTW_STATUS_LABEL: Record<string, string> = {
  created: "คลังรับใบเบิกแล้ว รอตัดสต๊อก", issued: "คลังตัดสต๊อกแล้ว รอจัดส่ง",
  dispatched: "คลังจัดส่งแล้ว — รับได้", received: "รับแล้ว",
};

type Line = { id: number; scent: string; size: string; qty: number; barcode: string };
type PR = { id: number; po_number: string; order_date: string; units: number; lines: Line[] };

const inp = "border border-line rounded-lg px-2 py-2 min-h-[40px] text-sm bg-surface text-ink focus:outline-none focus:border-brand";

/** Goods-receipt inbox on /my — approved requisitions the branch hasn't received yet. */
export function ReceivingPanel({ pending }: { pending: PR[] }) {
  if (!pending.length) return null;
  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold text-ink mb-2 flex items-center gap-1.5">
        <PackageCheck className="w-4 h-4 text-brand-dark" /> ของรอรับเข้าสาขา
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand text-white text-[11px] font-bold">{pending.length}</span>
      </h2>
      <div className="space-y-3">{pending.map((po) => <ReceiveCard key={po.id} po={po} />)}</div>
    </div>
  );
}

function ReceiveCard({ po }: { po: PR }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(() => po.lines.map((l) => ({ ...l, recv: String(Math.round(l.qty)), remark: "" })));
  const [remark, setRemark] = useState("");
  const [saving, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [ctw, setCtw] = useState<{ enabled: boolean; ok?: boolean; status?: string; dispatched?: boolean; error?: string } | null>(null);
  // lazily check central-warehouse status when the card is opened (avoids N API calls on page load)
  useEffect(() => {
    if (!open || ctw) return;
    ctwRequisitionStatus(po.id).then(setCtw).catch(() => setCtw({ enabled: false }));
  }, [open]);
  const setRow = (i: number, patch: Partial<(typeof rows)[number]>) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const anyDiff = rows.some((r) => (Number(r.recv) || 0) !== Math.round(r.qty));

  // scan-to-count: tap "สแกนนับ" to zero the counts, then shoot each item's barcode
  // to tally what actually arrived (works with the SUNMI laser + hardware scanners).
  const startScan = () => { setRows((rs) => rs.map((r) => ({ ...r, recv: "0" }))); setScanning(true); };
  // success flashes auto-clear; a "not found" warning stays until the next scan
  const say = (m: string, persist = false) => { setFlash(m); if (!persist) setTimeout(() => setFlash((f) => (f === m ? null : f)), 1500); };
  useBarcodeScanner(open && scanning, (code) => {
    const c = String(code || "").trim();
    const idx = rows.findIndex((r) => r.barcode === c);
    if (idx < 0) { beep("error"); try { navigator.vibrate?.([60, 40, 60]); } catch {} say(`⚠ ไม่พบ ${c} ในใบเบิกนี้`, true); return; }
    setRows((rs) => rs.map((x, j) => (j === idx ? { ...x, recv: String((Number(x.recv) || 0) + 1) } : x)));
    say(`+1 · ${rows[idx].scent}`);
    beep("ok"); try { navigator.vibrate?.(30); } catch {}
  });

  const receive = () => start(async () => {
    setErr(null);
    const lines = rows.map((r) => ({ id: r.id, received_qty: Number(r.recv) || 0, remark: r.remark }));
    const res = await receiveRequisition(po.id, lines, remark);
    if (res.ok) { if (res.warn) alert(`รับของแล้ว แต่:\n${res.warn}`); router.refresh(); }
    else setErr(res.error ?? "รับไม่สำเร็จ");
  });
  // when the warehouse integration is on, block receiving until the warehouse has dispatched
  const ctwBlocks = !!ctw?.enabled && ctw.ok === true && ctw.dispatched === false;

  return (
    <div className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 hover:bg-canvas/60 text-left">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink truncate">{po.po_number}</div>
          <div className="text-[11px] text-muted">{po.order_date} · {Math.round(po.units)} ชิ้น · {po.lines.length} รายการ</div>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-dark shrink-0">
          ตรวจรับ <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 border-t border-line-soft pt-2 space-y-2">
          {ctw?.enabled && (
            <div className={`flex items-center gap-1.5 text-[11px] rounded-lg px-2.5 py-1.5 ${ctw.ok === false ? "bg-danger-soft text-danger" : ctw.dispatched ? "bg-success-soft text-success" : "bg-warn-soft text-warn"}`}>
              <Warehouse className="w-3.5 h-3.5 shrink-0" />
              {ctw.ok === false ? `คลังกลาง: ${ctw.error}` : `คลังกลาง: ${CTW_STATUS_LABEL[ctw.status || ""] ?? ctw.status ?? "-"}`}
            </div>
          )}
          {rows.map((r, i) => {
            const diff = (Number(r.recv) || 0) !== Math.round(r.qty);
            return (
              <div key={r.id} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-[11px] text-muted-soft shrink-0">{i + 1}</span>
                <span className="flex-1 min-w-0 truncate text-ink">{r.scent} <span className="text-muted text-xs">{r.size}</span></span>
                <span className="text-[11px] text-muted-soft shrink-0">เบิก {Math.round(r.qty)}</span>
                <input value={r.recv} inputMode="numeric" onFocus={(e) => e.target.select()}
                  onChange={(e) => setRow(i, { recv: e.target.value.replace(/[^\d]/g, "") })}
                  className={inp + " w-14 text-right tabular-nums shrink-0" + (diff ? " border-warn text-warn-dark" : "")} />
                {diff && <input value={r.remark} placeholder="เหตุผล" onChange={(e) => setRow(i, { remark: e.target.value })} className={inp + " w-24 shrink-0 text-xs"} />}
              </div>
            );
          })}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => (scanning ? setScanning(false) : startScan())}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border ${scanning ? "border-brand bg-brand text-white" : "border-line text-muted hover:bg-canvas"}`}>
              <ScanLine className="w-4 h-4" /> {scanning ? "กำลังสแกน… (แตะเพื่อหยุด)" : "สแกนนับ"}
            </button>
            {flash && <span className="text-xs text-brand-dark font-medium">{flash}</span>}
          </div>
          <input value={remark} placeholder="หมายเหตุรวม (ถ้ามี)" onChange={(e) => setRemark(e.target.value)} className={inp + " w-full"} />
          {err && <div className="text-xs text-danger">{err}</div>}
          <button onClick={receive} disabled={saving || ctwBlocks}
            className="btn btn-brand w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
            {ctwBlocks ? "รอคลังกลางจัดส่งก่อน" : anyDiff ? "ยืนยันรับ (มีส่วนต่าง)" : "รับของเข้าสต๊อก"}
          </button>
        </div>
      )}
    </div>
  );
}
