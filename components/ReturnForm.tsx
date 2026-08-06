"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReturn } from "@/lib/actions/logistics";

export function ReturnForm({ pos }: { pos: { po_number: string; branch_label: string }[] }) {
  const [po, setPo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [skus, setSkus] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const parse = (s: string) => s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);

  const submit = () => {
    if (!po) return setMsg("เลือก PO ก่อน");
    const list = parse(skus);
    if (!list.length) return setMsg("ใส่รหัสหน่วยที่คืนอย่างน้อย 1");
    const branch = pos.find((p) => p.po_number === po)?.branch_label ?? "";
    start(async () => {
      const r = await createReturn({ po_number: po, return_date: date, branch_label: branch, skus: list });
      setMsg(`บันทึกคืนแล้ว ${r.inserted} หน่วย`);
      setTimeout(() => router.push("/shipments"), 700);
    });
  };

  return (
    <div className="space-y-5">
      <div className="card p-5 grid md:grid-cols-2 gap-4">
        <label className="block"><span className="text-xs text-ink/50 mb-1 block">PO / ใบเบิก *</span>
          <select className="inp" value={po} onChange={(e) => setPo(e.target.value)}>
            <option value="" disabled>— เลือก —</option>
            {pos.map((p) => <option key={p.po_number} value={p.po_number}>{p.po_number} · {p.branch_label}</option>)}
          </select></label>
        <label className="block"><span className="text-xs text-ink/50 mb-1 block">วันที่คืน</span>
          <input type="date" className="inp" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="block md:col-span-2"><span className="text-xs text-ink/50 mb-1 block">รหัสหน่วยที่คืน (SKU) — 1 รหัส/บรรทัด</span>
          <textarea rows={5} className="inp font-mono text-xs" value={skus} onChange={(e) => setSkus(e.target.value)} placeholder="Lab50 TA6688&#10;Lab50 TA6774" /></label>
      </div>
      {msg && <div className="text-sm text-gold-dark bg-gold/10 border border-gold/20 rounded-lg px-4 py-2">{msg}</div>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={pending} className="px-5 py-2.5 rounded-lg bg-ink text-surface font-medium hover:opacity-90 disabled:opacity-50">{pending ? "กำลังบันทึก…" : "บันทึกการคืน"}</button>
        <a href="/shipments" className="px-5 py-2.5 rounded-lg border border-line font-medium hover:bg-canvas">ยกเลิก</a>
      </div>
    </div>
  );
}
