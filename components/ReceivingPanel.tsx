"use client";
import { useState, useTransition, useEffect, useMemo } from "react";
import { beep } from "@/lib/feedback";
import { useRouter } from "next/navigation";
import { PackageCheck, ChevronDown, Loader2, ScanLine, Warehouse } from "lucide-react";
import { receiveRequisition, ctwRequisitionStatus } from "@/lib/actions/requisitions";
import { useBarcodeScanner } from "@/lib/useBarcodeScanner";
import type { ReceiptPR, ShippedSku } from "@/lib/queries";

const CTW_STATUS_LABEL: Record<string, string> = {
  created: "คลังรับใบเบิกแล้ว รอตัดสต๊อก", issued: "คลังตัดสต๊อกแล้ว รอจัดส่ง",
  dispatched: "คลังจัดส่งแล้ว — รับได้", received: "รับแล้ว",
};
const norm = (s: any) => String(s || "").toLowerCase().replace(/[^a-z0-9ก-๙]/g, "");

/** Goods-receipt inbox on /my — requisitions the branch must check + receive. */
export function ReceivingPanel({ pending }: { pending: ReceiptPR[] }) {
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

function ReceiveCard({ po }: { po: ReceiptPR }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [scanned, setScanned] = useState<Set<string>>(new Set());   // SKUs ticked off by scanning (visual check)
  const [ctw, setCtw] = useState<{ enabled: boolean; ok?: boolean; status?: string; dispatched?: boolean; error?: string } | null>(null);

  useEffect(() => {
    if (!open || ctw) return;
    ctwRequisitionStatus(po.id).then(setCtw).catch(() => setCtw({ enabled: false }));
  }, [open]);

  // SKUs the warehouse shipped, grouped onto each requisition line (match by barcode, then name+size)
  const rows = useMemo(() => po.lines.map((l) => {
    const skus = (po.shipped_skus || []).filter((s) =>
      (s.barcode && l.barcode && s.barcode.trim() === l.barcode.trim()) ||
      (!s.barcode && norm(s.product) === norm(l.scent) && norm(s.size) === norm(l.size)));
    return { ...l, skus };
  }), [po]);
  const totalQty = rows.reduce((s, r) => s + (Number(r.qty) || 0), 0);
  const allSkus = (po.shipped_skus || []).map((s) => s.sku).filter(Boolean) as string[];

  const say = (m: string, persist = false) => { setFlash(m); if (!persist) setTimeout(() => setFlash((f) => (f === m ? null : f)), 1500); };
  // scan a SKU to tick it off (pure visual check against the shipped list; doesn't change qty)
  useBarcodeScanner(open && scanning, (code) => {
    const c = String(code || "").trim();
    const hit = allSkus.find((s) => s.trim() === c) || (po.shipped_skus || []).find((s) => s.barcode?.trim() === c)?.sku || null;
    if (!hit) { beep("error"); try { navigator.vibrate?.([60, 40, 60]); } catch {} say(`⚠ ไม่พบ ${c} ในใบนี้`, true); return; }
    setScanned((prev) => new Set(prev).add(hit));
    say(`✓ ${hit}`); beep("ok"); try { navigator.vibrate?.(30); } catch {}
  });

  const ctwBlocks = !!ctw?.enabled && ctw.ok === true && ctw.dispatched === false;
  const receive = () => start(async () => {
    setErr(null);
    // when the integration is on the server uses the warehouse's real SKUs; these are the fallback
    const lines = po.lines.map((l) => ({ id: l.id, received_qty: Number(l.qty) || 0 }));
    const res = await receiveRequisition(po.id, lines);
    if (res.ok) { if (res.warn) alert(`รับของแล้ว แต่:\n${res.warn}`); router.refresh(); }
    else setErr(res.error ?? "รับไม่สำเร็จ");
  });

  return (
    <div className="rounded-xl border border-line bg-surface shadow-sm overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 hover:bg-canvas/60 text-left">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink truncate">{po.po_number}</div>
          <div className="text-[11px] text-muted">{po.order_date} · {Math.round(totalQty)} ชิ้น · {po.lines.length} รายการ</div>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-dark shrink-0">
          ตรวจรับ <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="border-t border-line-soft">
          {ctw?.enabled && (
            <div className={`flex items-center gap-1.5 text-[11px] px-3.5 py-1.5 ${ctw.ok === false ? "bg-danger-soft text-danger" : ctw.dispatched ? "bg-success-soft text-success" : "bg-warn-soft text-warn"}`}>
              <Warehouse className="w-3.5 h-3.5 shrink-0" />
              {ctw.ok === false ? `คลังกลาง: ${ctw.error}` : `คลังกลาง: ${CTW_STATUS_LABEL[ctw.status || ""] ?? ctw.status ?? "-"}`}
            </div>
          )}

          {/* check table — verify qty + the exact SKUs the warehouse shipped, on screen (no printing) */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-canvas/70 text-left text-[11px] text-muted border-b border-line">
                  <th className="px-3 py-2 w-8">#</th>
                  <th className="px-3 py-2">Grade</th>
                  <th className="px-3 py-2">สินค้า</th>
                  <th className="px-3 py-2">ขนาด</th>
                  <th className="px-3 py-2 text-right">จำนวน</th>
                  <th className="px-3 py-2">หน่วย</th>
                  <th className="px-3 py-2">SKU ที่ส่งมา</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className="border-b border-line/60 align-top">
                    <td className="px-3 py-2 text-muted tabular-nums">{i + 1}</td>
                    <td className="px-3 py-2 text-muted whitespace-nowrap">{r.grade || "—"}</td>
                    <td className="px-3 py-2 font-medium text-ink">{r.scent}</td>
                    <td className="px-3 py-2 text-muted whitespace-nowrap">{r.size || "—"}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-ink">{Math.round(Number(r.qty) || 0)}</td>
                    <td className="px-3 py-2 text-muted whitespace-nowrap">ขวด</td>
                    <td className="px-3 py-2">
                      {r.skus.length === 0 ? <span className="text-muted-soft text-xs">—</span> : (
                        <div className="flex flex-wrap gap-1">
                          {r.skus.map((s, j) => {
                            const ok = s.sku && scanned.has(s.sku);
                            return <span key={j} className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-mono ${ok ? "bg-success-soft text-success" : "bg-canvas text-ink"}`}>{ok ? "✓ " : ""}{s.sku || s.barcode || "-"}</span>;
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-canvas/70 font-semibold text-ink">
                  <td className="px-3 py-2" colSpan={4}>รวมทั้งสิ้น</td>
                  <td className="px-3 py-2 text-right tabular-nums">{Math.round(totalQty)}</td>
                  <td className="px-3 py-2" colSpan={2}>{allSkus.length > 0 ? `${allSkus.length} SKU` : ""}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="px-3.5 py-3 space-y-2">
            {allSkus.length > 0 && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setScanning((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border ${scanning ? "border-brand bg-brand text-white" : "border-line text-muted hover:bg-canvas"}`}>
                  <ScanLine className="w-4 h-4" /> {scanning ? "กำลังสแกนเช็ค… (แตะเพื่อหยุด)" : "สแกนเช็ค SKU"}
                </button>
                <span className="text-xs text-muted">{scanned.size}/{allSkus.length} ชิ้น</span>
                {flash && <span className="text-xs text-brand-dark font-medium">{flash}</span>}
              </div>
            )}
            {err && <div className="text-xs text-danger">{err}</div>}
            <button onClick={receive} disabled={saving || ctwBlocks} className="btn btn-brand w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
              {ctwBlocks ? "รอคลังกลางจัดส่งก่อน" : "ยืนยันรับของเข้าสต๊อก"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
