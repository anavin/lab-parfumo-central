"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, ChevronDown, Loader2, ScanLine } from "lucide-react";
import { receiveRequisition } from "@/lib/actions/requisitions";
import { useBarcodeScanner } from "@/lib/useBarcodeScanner";

type Line = { id: number; scent: string; size: string; qty: number; barcode: string };
type PR = { id: number; po_number: string; order_date: string; units: number; lines: Line[] };

const inp = "border border-line rounded-lg px-2 py-1.5 text-sm bg-surface text-ink focus:outline-none focus:border-brand";

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
  const setRow = (i: number, patch: Partial<(typeof rows)[number]>) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const anyDiff = rows.some((r) => (Number(r.recv) || 0) !== Math.round(r.qty));

  // scan-to-count: tap "สแกนนับ" to zero the counts, then shoot each item's barcode
  // to tally what actually arrived (works with the SUNMI laser + hardware scanners).
  const startScan = () => { setRows((rs) => rs.map((r) => ({ ...r, recv: "0" }))); setScanning(true); };
  const say = (m: string) => { setFlash(m); setTimeout(() => setFlash((f) => (f === m ? null : f)), 1500); };
  useBarcodeScanner(open && scanning, (code) => {
    const c = String(code || "").trim();
    const idx = rows.findIndex((r) => r.barcode === c);
    if (idx < 0) { say(`ไม่พบ ${c} ในใบเบิกนี้`); return; }
    setRows((rs) => rs.map((x, j) => (j === idx ? { ...x, recv: String((Number(x.recv) || 0) + 1) } : x)));
    say(`+1 · ${rows[idx].scent}`);
    try { navigator.vibrate?.(30); } catch {}
  });

  const receive = () => start(async () => {
    setErr(null);
    const lines = rows.map((r) => ({ id: r.id, received_qty: Number(r.recv) || 0, remark: r.remark }));
    const res = await receiveRequisition(po.id, lines, remark);
    if (res.ok) router.refresh(); else setErr(res.error ?? "รับไม่สำเร็จ");
  });

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
          {rows.map((r, i) => {
            const diff = (Number(r.recv) || 0) !== Math.round(r.qty);
            return (
              <div key={r.id} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-[11px] text-muted-soft shrink-0">{i + 1}</span>
                <span className="flex-1 min-w-0 truncate text-ink">{r.scent} <span className="text-muted text-xs">{r.size}</span></span>
                <span className="text-[11px] text-muted-soft shrink-0">เบิก {Math.round(r.qty)}</span>
                <input value={r.recv} inputMode="numeric" onFocus={(e) => e.target.select()}
                  onChange={(e) => setRow(i, { recv: e.target.value.replace(/[^\d]/g, "") })}
                  className={inp + " w-12 text-right tabular-nums shrink-0" + (diff ? " border-warn text-warn-dark" : "")} />
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
          <button onClick={receive} disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
            {anyDiff ? "ยืนยันรับ (มีส่วนต่าง)" : "รับของเข้าสต๊อก"}
          </button>
        </div>
      )}
    </div>
  );
}
