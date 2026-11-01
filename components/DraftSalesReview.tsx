"use client";
import { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download, Trash2, RefreshCw, Loader2, Receipt } from "lucide-react";
import { num, baht } from "@/lib/format";
import { branchName } from "@/lib/branches";
import { downloadCsv } from "@/lib/csv";
import { snapshotSalesDraft, updateDraftLine, deleteDraftLine, deleteDraftBill } from "@/lib/actions/sales-draft";
import type { DraftLine } from "@/lib/queries";

const thMonth = (m: string) => {
  const [y, mm] = m.split("-").map(Number);
  const names = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${names[mm] || mm} ${y + 543}`;
};

export function DraftSalesReview({ lines, branch, month, months, real }:
  { lines: DraftLine[]; branch: string; month: string; months: string[]; real: { total: number; qty: number; bills: number } }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [busy, setBusy] = useState(false);

  const go = (params: Record<string, string>) => {
    const p = new URLSearchParams(sp.toString());
    Object.entries(params).forEach(([k, v]) => p.set(k, v));
    router.push(`${pathname}?${p.toString()}`);
  };

  const snapshot = async () => {
    if (busy) return;
    if (!confirm(`ดึงยอดขายจริงเดือน ${thMonth(month)} (${branchName(branch)}) มาเป็นฉบับร่าง?\n\nฉบับร่างเดิมของเดือนนี้จะถูกเขียนทับ · ยอดขายจริงไม่ถูกแตะ`)) return;
    setBusy(true);
    const r = await snapshotSalesDraft(month, branch);
    setBusy(false);
    if (r.ok) router.refresh(); else alert(r.error || "ไม่สำเร็จ");
  };

  const draftTotal = useMemo(() => lines.reduce((s, l) => s + Number(l.total || 0), 0), [lines]);
  const draftQty = useMemo(() => lines.reduce((s, l) => s + Number(l.qty || 0), 0), [lines]);

  // group lines into bills by receipt_no
  const bills = useMemo(() => {
    const m = new Map<string, DraftLine[]>();
    for (const l of lines) {
      const k = l.receipt_no || `line:${l.id}`;
      (m.get(k) ?? m.set(k, []).get(k)!).push(l);
    }
    return Array.from(m.entries());
  }, [lines]);

  const exportCsv = () => {
    if (!lines.length) return;
    const header = ["วันที่", "เวลา", "เลขบิล", "พนักงาน", "สินค้า", "ไซซ์", "จำนวน", "ราคา/หน่วย", "ส่วนลด", "รวม", "ช่องทาง", "สัญชาติ"];
    const body = lines.map((l) => [l.sale_date || "", l.sale_time || "", l.receipt_no || "", l.ba || "", l.item || "", l.size || "",
      l.qty, l.unit_price, l.discount, l.total, l.payment_channel || "", l.nation || ""]);
    downloadCsv(`ยอดขาย-CTW-ฉบับร่าง_${branch}_${month}.csv`, [header, ...body]);
  };

  const delBill = async (receipt: string, n: number) => {
    if (busy) return;
    if (!confirm(`ลบทั้งบิล ${receipt} (${n} รายการ) ออกจากฉบับร่าง?`)) return;
    setBusy(true);
    const r = await deleteDraftBill(month, branch, receipt);
    setBusy(false);
    if (r.ok) router.refresh(); else alert(r.error || "ไม่สำเร็จ");
  };

  return (
    <div className="space-y-4">
      {/* controls */}
      <div className="flex items-end gap-2 flex-wrap rounded-xl border border-line bg-surface p-3">
        <label className="text-sm">
          <span className="block text-[11px] text-muted mb-0.5">เดือน</span>
          <select value={month} onChange={(e) => go({ month: e.target.value })}
            className="px-2.5 py-1.5 rounded-lg border border-line bg-surface text-ink text-sm focus:outline-none focus:border-brand">
            {!months.includes(month) && <option value={month}>{thMonth(month)}</option>}
            {months.map((m) => <option key={m} value={m}>{thMonth(m)}</option>)}
          </select>
        </label>
        <button onClick={snapshot} disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand text-white text-sm font-semibold px-4 py-2 hover:bg-brand-dark disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} ดึงยอดจริงมาเป็นฉบับร่าง
        </button>
        <button onClick={exportCsv} disabled={!lines.length}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface text-ink text-sm font-medium px-3 py-2 hover:bg-canvas disabled:opacity-50">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-xl border border-brand/40 bg-brand-soft/15 p-3"><div className="text-xs text-brand-dark">ยอดรวม (ฉบับร่าง)</div><div className="text-2xl font-bold tabular-nums text-ink mt-0.5">{baht(draftTotal)}</div></div>
        <div className="rounded-xl border border-line bg-surface p-3"><div className="text-xs text-muted">จำนวน (ฉบับร่าง)</div><div className="text-2xl font-bold tabular-nums text-ink mt-0.5">{num(draftQty)} <span className="text-sm text-muted">ชิ้น</span></div></div>
        <div className="rounded-xl border border-line bg-canvas p-3"><div className="text-xs text-muted">ยอดจริง (อ้างอิง)</div><div className="text-2xl font-bold tabular-nums text-muted mt-0.5">{baht(real.total)}</div></div>
        <div className="rounded-xl border border-line bg-canvas p-3"><div className="text-xs text-muted">ต่างจากยอดจริง</div><div className="text-2xl font-bold tabular-nums text-ink mt-0.5">{baht(draftTotal - real.total)}</div></div>
      </div>

      {lines.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-sm text-muted">
          ยังไม่มีฉบับร่างของเดือน {thMonth(month)} — กด <b className="text-ink">“ดึงยอดจริงมาเป็นฉบับร่าง”</b> ด้านบนก่อน
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map(([receipt, items]) => {
            const billTotal = items.reduce((s, l) => s + Number(l.total || 0), 0);
            const head = items[0];
            const isReal = !receipt.startsWith("line:");
            return (
              <div key={receipt} className="rounded-xl border border-line bg-surface overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-canvas border-b border-line-soft">
                  <Receipt className="w-4 h-4 text-muted" />
                  <span className="font-mono text-[12px] text-ink">{isReal ? receipt : "(ไม่มีเลขบิล)"}</span>
                  <span className="text-[11px] text-muted">{head.sale_date} {head.sale_time || ""} · {head.ba || "—"} · {head.payment_channel || "—"}</span>
                  <span className="ml-auto text-sm font-semibold tabular-nums text-ink">{baht(billTotal)}</span>
                  {isReal && (
                    <button onClick={() => delBill(receipt, items.length)} disabled={busy}
                      className="inline-flex items-center gap-1 text-[12px] text-danger hover:underline disabled:opacity-50" title="ลบทั้งบิล">
                      <Trash2 className="w-3.5 h-3.5" /> ลบบิล
                    </button>
                  )}
                </div>
                <div className="divide-y divide-line-soft">
                  {items.map((l) => <DraftRow key={l.id} line={l} onChanged={() => router.refresh()} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-muted">แก้จำนวน/ราคา/ส่วนลด แล้วคลิกนอกช่องเพื่อบันทึก (รวมคำนวณใหม่อัตโนมัติ) · 🗑 ลบรายการหรือทั้งบิลได้ · ทุกการแก้เขียนที่ฉบับร่างเท่านั้น</p>
    </div>
  );
}

function DraftRow({ line, onChanged }: { line: DraftLine; onChanged: () => void }) {
  const [qty, setQty] = useState(String(line.qty ?? 0));
  const [up, setUp] = useState(String(line.unit_price ?? 0));
  const [disc, setDisc] = useState(String(line.discount ?? 0));
  const [item, setItem] = useState(line.item ?? "");
  const [saving, setSaving] = useState(false);

  const dirty = () =>
    Number(qty) !== Number(line.qty) || Number(up) !== Number(line.unit_price) ||
    Number(disc) !== Number(line.discount) || item !== (line.item ?? "");

  const save = async () => {
    if (saving || !dirty()) return;
    setSaving(true);
    const r = await updateDraftLine(line.id, { item, qty: Number(qty) || 0, unit_price: Number(up) || 0, discount: Number(disc) || 0 });
    setSaving(false);
    if (r.ok) onChanged(); else alert(r.error || "แก้ไม่สำเร็จ");
  };

  const del = async () => {
    if (saving) return;
    if (!confirm(`ลบรายการ "${line.item}" ออกจากฉบับร่าง?`)) return;
    setSaving(true);
    const r = await deleteDraftLine(line.id);
    setSaving(false);
    if (r.ok) onChanged(); else alert(r.error || "ลบไม่สำเร็จ");
  };

  const liveTotal = Math.max(0, (Number(qty) || 0) * (Number(up) || 0) - (Number(disc) || 0));
  const inp = "px-2 py-1 rounded border border-line bg-surface text-ink text-sm tabular-nums focus:outline-none focus:border-brand";

  return (
    <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
      <input value={item} onChange={(e) => setItem(e.target.value)} onBlur={save}
        className={inp + " flex-1 min-w-[140px]"} placeholder="สินค้า" />
      <input value={line.size ?? ""} readOnly className="px-2 py-1 rounded border border-transparent bg-canvas text-muted text-xs w-16" />
      <label className="text-[10px] text-muted">จำนวน<input value={qty} onChange={(e) => setQty(e.target.value)} onBlur={save} inputMode="decimal" className={inp + " w-14 ml-1"} /></label>
      <label className="text-[10px] text-muted">ราคา<input value={up} onChange={(e) => setUp(e.target.value)} onBlur={save} inputMode="decimal" className={inp + " w-20 ml-1"} /></label>
      <label className="text-[10px] text-muted">ส่วนลด<input value={disc} onChange={(e) => setDisc(e.target.value)} onBlur={save} inputMode="decimal" className={inp + " w-16 ml-1"} /></label>
      <span className="text-sm font-semibold tabular-nums text-ink w-24 text-right">{baht(liveTotal)}</span>
      <button onClick={del} disabled={saving} className="text-danger hover:text-danger/80 disabled:opacity-50 shrink-0" title="ลบรายการ">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
