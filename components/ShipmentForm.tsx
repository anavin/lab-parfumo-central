"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getPoItems } from "@/lib/actions/lookups";
import { createShipment } from "@/lib/actions/logistics";

type PO = { po_number: string; order_date: string; branch_label: string; lines: number; qty: number };
type Line = { barcode: string; scent: string; size: string; grade: string; qty: number; skus: string };

export function ShipmentForm({ pos }: { pos: PO[] }) {
  const [po, setPo] = useState<PO | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<Line[]>([]);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const router = useRouter();

  const onSelect = async (num: string) => {
    const p = pos.find((x) => x.po_number === num) ?? null;
    setPo(p);
    setMsg("");
    if (!p) return setLines([]);
    const items = await getPoItems(num);
    setLines(items.map((i) => ({ barcode: i.barcode, scent: i.scent, size: i.size, grade: i.grade, qty: i.qty, skus: "" })));
  };
  const setSkus = (idx: number, v: string) =>
    setLines((a) => a.map((l, i) => (i === idx ? { ...l, skus: v } : l)));

  const parse = (s: string) => s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);
  const totalUnits = lines.reduce((s, l) => s + parse(l.skus).length, 0);

  const submit = () => {
    if (!po) return setMsg("เลือก PO ก่อน");
    if (totalUnits === 0) return setMsg("ใส่รหัสหน่วย (SKU) อย่างน้อย 1");
    start(async () => {
      const r = await createShipment({
        po_number: po.po_number, ship_date: date, branch_label: po.branch_label,
        lines: lines.map((l) => ({ barcode: l.barcode, name: l.scent, grade: l.grade, size: l.size, skus: parse(l.skus) })),
      });
      setMsg(`บันทึกแล้ว ${r.inserted} หน่วย`);
      setTimeout(() => router.push("/shipments"), 700);
    });
  };

  return (
    <div className="space-y-5">
      <div className="card p-5 grid md:grid-cols-2 gap-4">
        <label className="block"><span className="text-xs text-ink/50 mb-1 block">เลือก PO / ใบเบิก *</span>
          <select className="inp" defaultValue="" onChange={(e) => onSelect(e.target.value)}>
            <option value="" disabled>— เลือก —</option>
            {pos.map((p) => <option key={p.po_number} value={p.po_number}>{p.po_number} · {p.branch_label} · {p.qty} ขวด</option>)}
          </select>
        </label>
        <label className="block"><span className="text-xs text-ink/50 mb-1 block">วันที่ส่ง</span>
          <input type="date" className="inp" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      </div>

      {lines.length > 0 && (
        <div className="card p-5">
          <div className="flex justify-between mb-3"><h3 className="text-sm font-semibold">ใส่รหัสหน่วยสินค้า (SKU) — 1 รหัส/บรรทัด หรือคั่นด้วยจุลภาค</h3>
            <span className="text-xs text-ink/40">รวม {totalUnits} หน่วย</span></div>
          <div className="space-y-3">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_2fr] gap-3 items-start border-b border-black/5 pb-3">
                <div className="text-sm pt-1">
                  <div className="font-medium">{l.scent}</div>
                  <div className="text-ink/40 text-xs">{l.size} · {l.grade} · เบิก {l.qty} ขวด</div>
                </div>
                <textarea rows={2} value={l.skus} onChange={(e) => setSkus(i, e.target.value)}
                  placeholder="เช่น Lab50 TA6688, Lab50 TA6774 …" className="inp font-mono text-xs" />
              </div>
            ))}
          </div>
        </div>
      )}

      {msg && <div className="text-sm text-gold-dark bg-gold/10 border border-gold/20 rounded-lg px-4 py-2">{msg}</div>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={pending || !po} className="px-5 py-2.5 rounded-lg bg-ink text-surface font-medium hover:opacity-90 disabled:opacity-50">
          {pending ? "กำลังบันทึก…" : "บันทึกการส่งสินค้า"}</button>
        <a href="/shipments" className="px-5 py-2.5 rounded-lg border border-line font-medium hover:bg-canvas">ยกเลิก</a>
      </div>
    </div>
  );
}
