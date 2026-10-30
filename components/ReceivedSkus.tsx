"use client";
import { useEffect, useMemo, useState } from "react";
import { Barcode, Check, Search, Download, ChevronDown, AlertTriangle } from "lucide-react";
import { num } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import type { ReceivedSkuRow } from "@/lib/queries";

const norm = (s: string | null) => String(s || "").toLowerCase().replace(/[^a-z0-9ก-๙]/g, "");
type Group = { key: string; scent: string; size: string; ordered: number | null; rows: ReceivedSkuRow[] };

const ST: Record<string, { label: string; cls: string }> = {
  in_stock: { label: "เข้าสต๊อก", cls: "bg-success-soft text-success" },
  sold: { label: "ขายแล้ว", cls: "bg-canvas text-muted border border-line" },
  returned: { label: "คืน", cls: "bg-warn-soft text-warn" },
  lost: { label: "ของหาย", cls: "bg-danger-soft text-danger" },
};

// แผง "SKU ที่รับเข้าสต๊อกจากใบเบิกนี้" — ไว้ตรวจของจริงทีละชิ้นหลังรับของ
// จับคู่จำนวนที่สั่ง (ordered) ต่อกลิ่น/ขนาด เพื่อให้เห็นส่วนต่าง + ติ๊กว่าตรวจแล้ว (จำไว้ใน localStorage)
export function ReceivedSkus({ skus, ordered, poId }: { skus: ReceivedSkuRow[]; ordered: Record<string, number>; poId: number }) {
  const [open, setOpen] = useState(true);
  const [qText, setQText] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const storeKey = `recvchk:${poId}`;

  // remember which SKUs were ticked while verifying (per requisition, per device)
  useEffect(() => { try { const raw = localStorage.getItem(storeKey); if (raw) setChecked(new Set(JSON.parse(raw))); } catch {} }, [storeKey]);
  const toggle = (sku: string) => setChecked((prev) => {
    const next = new Set(prev); next.has(sku) ? next.delete(sku) : next.add(sku);
    try { localStorage.setItem(storeKey, JSON.stringify([...next])); } catch {}
    return next;
  });

  const { groups, mismatches } = useMemo(() => {
    const m = new Map<string, Group>();
    for (const r of skus) {
      const key = `${norm(r.scent)}|${norm(r.size)}`;
      let g = m.get(key);
      if (!g) { g = { key, scent: r.scent || r.barcode || "-", size: r.size || "", ordered: ordered[key] ?? null, rows: [] }; m.set(key, g); }
      g.rows.push(r);
    }
    const groups = [...m.values()].sort((a, b) => a.scent.localeCompare(b.scent, "th") || a.size.localeCompare(b.size));
    const mismatches = groups.filter((g) => g.ordered != null && g.ordered !== g.rows.length).length;
    return { groups, mismatches };
  }, [skus, ordered]);

  const shown = useMemo(() => {
    const t = qText.trim().toLowerCase();
    if (!t) return groups;
    return groups.map((g) => ({ ...g, rows: g.rows.filter((r) => r.sku.toLowerCase().includes(t)) })).filter((g) => g.rows.length || g.scent.toLowerCase().includes(t));
  }, [groups, qText]);

  const inStock = skus.filter((s) => s.status === "in_stock").length;
  const checkedCount = skus.filter((s) => checked.has(s.sku)).length;

  const exportCsv = () => {
    const rows: (string | number | null)[][] = [["กลิ่น", "ขนาด", "SKU", "บาร์โค้ด", "สถานะ", "ตรวจแล้ว"]];
    for (const g of groups) for (const r of g.rows) rows.push([g.scent, g.size, r.sku, r.barcode || "", ST[r.status]?.label || r.status, checked.has(r.sku) ? "✓" : ""]);
    downloadCsv(`received-skus-po${poId}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  if (!skus.length) return null;

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden text-black">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-4 py-3 text-left">
        <Barcode className="w-4 h-4 text-brand shrink-0" />
        <span className="font-semibold text-ink">SKU ที่รับเข้าสต๊อก</span>
        <span className="text-sm text-muted">· {num(skus.length)} ชิ้น ({num(groups.length)} กลิ่น)</span>
        {mismatches > 0 && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warn bg-warn-soft rounded-full px-2 py-0.5"><AlertTriangle className="w-3 h-3" /> ส่วนต่าง {num(mismatches)}</span>}
        <ChevronDown className={"w-4 h-4 text-muted ml-auto transition-transform " + (open ? "rotate-180" : "")} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-canvas p-2.5"><div className="text-[11px] text-muted">เข้าสต๊อก</div><div className="text-lg font-bold tabular-nums text-success">{num(inStock)}<span className="text-xs font-normal text-muted">/{num(skus.length)}</span></div></div>
            <div className="rounded-lg bg-canvas p-2.5"><div className="text-[11px] text-muted">จำนวนกลิ่น</div><div className="text-lg font-bold tabular-nums text-ink">{num(groups.length)}</div></div>
            <div className="rounded-lg bg-canvas p-2.5"><div className="text-[11px] text-muted">ตรวจแล้ว</div><div className={"text-lg font-bold tabular-nums " + (checkedCount === skus.length ? "text-success" : "text-ink")}>{num(checkedCount)}<span className="text-xs font-normal text-muted">/{num(skus.length)}</span></div></div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="ค้นหา SKU / กลิ่น" className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-brand" />
            </div>
            <button onClick={exportCsv} className="shrink-0 inline-flex items-center gap-1.5 text-sm text-ink border border-line rounded-lg px-3 py-1.5 hover:bg-canvas"><Download className="w-4 h-4" /> CSV</button>
          </div>

          <div className="space-y-2">
            {shown.map((g) => {
              const recv = g.rows.length;
              const diff = g.ordered != null && g.ordered !== recv;
              return (
                <div key={g.key} className="rounded-lg border border-line-soft overflow-hidden">
                  <div className={"flex items-center gap-2 px-3 py-2 text-sm " + (diff ? "bg-warn-soft" : "bg-canvas/60")}>
                    <span className="font-medium text-ink truncate">{g.scent} <span className="text-muted font-normal">{g.size}</span></span>
                    <span className={"ml-auto text-xs tabular-nums " + (diff ? "text-warn-dark font-semibold" : "text-muted")}>
                      รับ {num(recv)}{g.ordered != null ? ` / สั่ง ${num(g.ordered)}` : ""}{diff ? ` (ต่าง ${recv - g.ordered! > 0 ? "+" : ""}${num(recv - g.ordered!)})` : ""}
                    </span>
                  </div>
                  <div className="divide-y divide-line-soft">
                    {g.rows.map((r) => {
                      const on = checked.has(r.sku);
                      return (
                        <button key={r.sku} onClick={() => toggle(r.sku)} className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-canvas/50">
                          <span className={"w-5 h-5 rounded border flex items-center justify-center shrink-0 " + (on ? "bg-success border-success text-white" : "border-line")}>{on && <Check className="w-3.5 h-3.5" />}</span>
                          <span className={"font-mono text-[13px] " + (on ? "text-muted line-through" : "text-ink")}>{r.sku}</span>
                          <span className={"ml-auto text-[11px] rounded-full px-2 py-0.5 font-medium shrink-0 " + (ST[r.status]?.cls || "bg-canvas text-muted")}>{ST[r.status]?.label || r.status}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {shown.length === 0 && <div className="text-center text-sm text-muted py-6">ไม่พบ</div>}
          </div>

          <p className="text-[11px] text-muted leading-relaxed">
            แตะที่ SKU เพื่อติ๊กว่า<b className="text-ink">ตรวจแล้ว</b> (จำไว้ในเครื่องนี้) · <span className="text-warn-dark">แถบเหลือง</span> = จำนวนที่รับ SKU ไม่ตรงกับที่สั่ง · <span className="text-muted">ขายแล้ว</span> = ขวดนี้ถูกขายไปหลังรับเข้า
          </p>
        </div>
      )}
    </div>
  );
}
