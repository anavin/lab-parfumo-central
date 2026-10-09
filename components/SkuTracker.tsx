"use client";
import { Fragment, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Barcode, Search, PackageCheck, ShoppingCart, Plus, ScanLine, Check, X, Loader2, Pencil, Trash2, AlertTriangle, Undo2 } from "lucide-react";
import { num } from "@/lib/format";
import { branchName, branchOptions } from "@/lib/branches";
import { updateSkuUnit, deleteSkuUnit, clearSkuFlag } from "@/lib/actions/sku";
import { SkuAddPanel } from "@/components/SkuAddPanel";
import type { SkuUnitRow } from "@/lib/queries";

type Filter = "in_stock" | "sold" | "all" | "today" | "flagged";
const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const bkkDate = (iso: string | null) => { if (!iso) return ""; const d = new Date(iso); return isNaN(+d) ? "" : d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }); };

// ติดตาม SKU รายชิ้น — รับเข้ามาเป็น in_stock, ขายแล้วผูกกับบิล (เฟส 3)
// ใช้เช็คว่าแต่ละ SKU อยู่ไหน / ขายไปบิลใด / เหลือกี่ชิ้น เพื่อตามของขาด-หาย
export function SkuTracker({ rows, branch }: { rows: SkuUnitRow[]; branch: string | null }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("in_stock");
  const [qText, setQText] = useState("");
  const [editSku, setEditSku] = useState<string | null>(null);   // which row's editor is open
  const [busySku, setBusySku] = useState<string | null>(null);   // row mid-delete
  const del = async (sku: string) => {
    if (!confirm(`ลบ SKU "${sku}" ออกจากระบบ?`)) return;
    setBusySku(sku);
    const r = await deleteSkuUnit(sku);
    setBusySku(null);
    if (r.ok) router.refresh(); else alert(r.error ?? "ลบไม่สำเร็จ");
  };
  const unflag = async (sku: string) => {
    setBusySku(sku);
    const r = await clearSkuFlag(sku);
    setBusySku(null);
    if (r.ok) router.refresh(); else alert(r.error ?? "ล้างธงไม่สำเร็จ");
  };
  const returnToStock = async (sku: string) => {
    if (!confirm(`คืน SKU "${sku}" กลับเข้าสต๊อก (เปลี่ยนจากขายแล้ว → คงเหลือ)?`)) return;
    setBusySku(sku);
    const r = await updateSkuUnit({ sku, status: "in_stock" });
    setBusySku(null);
    if (r.ok) router.refresh(); else alert(r.error ?? "คืนสต๊อกไม่สำเร็จ");
  };

  const today = bkkToday();
  const counts = useMemo(() => {
    let inStock = 0, sold = 0, other = 0, todayN = 0, flagged = 0;
    for (const r of rows) {
      r.status === "in_stock" ? inStock++ : r.status === "sold" ? sold++ : other++;
      if (bkkDate(r.received_at) === today) todayN++;
      if (r.shelf_flag_at) flagged++;
    }
    return { inStock, sold, other, total: rows.length, today: todayN, flagged };
  }, [rows, today]);

  const shown = useMemo(() => {
    const t = qText.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "in_stock" && r.status !== "in_stock") return false;
      if (filter === "sold" && r.status !== "sold") return false;
      if (filter === "today" && bkkDate(r.received_at) !== today) return false;
      if (filter === "flagged" && !r.shelf_flag_at) return false;
      if (!t) return true;
      return [r.sku, r.scent, r.size, r.sold_receipt_no].some((v) => String(v || "").toLowerCase().includes(t));
    }).sort((a, b) => String(b.received_at || "").localeCompare(String(a.received_at || "")));   // newest-collected first
  }, [rows, filter, qText, today]);

  const Pill = ({ id, label, n }: { id: Filter; label: string; n: number }) => (
    <button onClick={() => setFilter(id)}
      className={"px-3 py-1.5 text-sm font-medium rounded-lg border transition " +
        (filter === id ? "bg-brand text-white border-brand" : "text-muted border-line hover:bg-canvas")}>
      {label} <span className="tabular-nums">{num(n)}</span>
    </button>
  );
  const fmt = (iso: string | null) => { if (!iso) return "—"; const d = new Date(iso); return isNaN(+d) ? "—" : d.toLocaleDateString("th-TH", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" }); };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm text-muted">
        <Barcode className="w-4 h-4 text-brand" />
        ติดตาม SKU รายชิ้น {branch ? `· ${branchName(branch)}` : "· ทุกสาขา"} — แต่ละขวดมีรหัสไม่ซ้ำ ใช้ตามว่าขายไปที่ไหน/เหลือกี่ชิ้น
      </div>

      <SkuAddPanel branch={branch} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted"><PackageCheck className="w-3.5 h-3.5 text-success" /> คงเหลือ (in stock)</div>
          <div className="text-2xl font-bold tabular-nums text-ink mt-0.5">{num(counts.inStock)}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted"><ShoppingCart className="w-3.5 h-3.5 text-brand" /> ขายไปแล้ว</div>
          <div className="text-2xl font-bold tabular-nums text-ink mt-0.5">{num(counts.sold)}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="text-xs text-muted">รวมทั้งหมดที่รับเข้า</div>
          <div className="text-2xl font-bold tabular-nums text-ink mt-0.5">{num(counts.total)}</div>
        </div>
      </div>

      {counts.flagged > 0 && (
        <button onClick={() => setFilter("flagged")} className="w-full text-left flex items-center gap-2 mb-3 rounded-xl border border-warn/40 bg-warn-soft/50 px-3 py-2.5 hover:bg-warn-soft">
          <AlertTriangle className="w-5 h-5 text-warn shrink-0" />
          <span className="text-sm text-warn"><b>พบ {num(counts.flagged)} รายการ: ขายแล้วแต่เจอบนชั้น</b> — พนักงานสแกนตอนเก็บ SKU · แตะเพื่อดู แล้วเลือกคืนสต๊อก/ล้างธง</span>
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Pill id="in_stock" label="คงเหลือ" n={counts.inStock} />
        <Pill id="sold" label="ขายแล้ว" n={counts.sold} />
        <Pill id="all" label="ทั้งหมด" n={counts.total} />
        <Pill id="today" label="เก็บวันนี้" n={counts.today} />
        {counts.flagged > 0 && <Pill id="flagged" label="⚠ เจอบนชั้น" n={counts.flagged} />}
        <div className="relative ml-auto">
          <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="ค้นหา SKU / กลิ่น / เลขบิล"
            className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-brand w-56" />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-sm text-muted">
          ยังไม่มีข้อมูล SKU — SKU จะถูกบันทึกอัตโนมัติเมื่อกดรับใบเบิกที่คลังส่งมาพร้อมรหัส SKU
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-canvas text-muted text-left">
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">กลิ่น</th>
                <th className="px-3 py-2 font-medium">ขนาด</th>
                <th className="px-3 py-2 font-medium">สถานะ</th>
                <th className="px-3 py-2 font-medium">รับเข้า</th>
                <th className="px-3 py-2 font-medium">บิลที่ขาย</th>
                <th className="px-3 py-2 font-medium text-right">แก้ไข</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <Fragment key={r.sku}>
                  <tr className={"border-t border-line-soft " + (r.shelf_flag_at ? "bg-warn-soft/40" : "")}>
                    <td className="px-3 py-2 font-mono text-[13px] text-ink whitespace-nowrap">{r.sku}</td>
                    <td className="px-3 py-2 text-ink whitespace-nowrap">{r.scent || "—"}</td>
                    <td className="px-3 py-2 text-muted whitespace-nowrap">{r.size || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.shelf_flag_at
                        ? <span className="text-[11px] whitespace-nowrap rounded-full px-2 py-0.5 bg-warn-soft text-warn font-medium" title="ขายแล้วแต่สแกนเจอบนชั้น"><AlertTriangle className="w-3 h-3 inline -mt-0.5" /> ขายแล้ว·เจอบนชั้น</span>
                        : r.status === "in_stock"
                        ? <span className="chip-success text-[11px]">คงเหลือ</span>
                        : r.status === "sold"
                        ? <span className="chip-muted text-[11px]">ขายแล้ว</span>
                        : <span className="chip-muted text-[11px]">{r.status === "returned" ? "คืน" : r.status === "lost" ? "ของหาย" : r.status}</span>}
                    </td>
                    <td className="px-3 py-2 text-muted whitespace-nowrap">{fmt(r.received_at)}{r.po_number ? ` · ${r.po_number}` : ""}</td>
                    <td className="px-3 py-2 text-muted whitespace-nowrap">
                      {r.sold_receipt_no ? <>{r.sold_receipt_no}{r.sold_branch ? ` · ${branchName(r.sold_branch)}` : ""}</> : "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <div className="inline-flex gap-1 items-center">
                        {r.shelf_flag_at && (
                          <>
                            <button onClick={() => returnToStock(r.sku)} disabled={busySku === r.sku} className="inline-flex items-center gap-1 text-[11px] text-success border border-success/40 rounded-lg px-2 py-1 hover:bg-success-soft" title="คืนเข้าสต๊อก (ของกลับมา)"><Undo2 className="w-3.5 h-3.5" /> คืนสต๊อก</button>
                            <button onClick={() => unflag(r.sku)} disabled={busySku === r.sku} className="text-[11px] text-muted border border-line rounded-lg px-2 py-1 hover:bg-canvas" title="ล้างธง (ตรวจแล้วปกติ)">ล้างธง</button>
                          </>
                        )}
                        <button onClick={() => setEditSku(editSku === r.sku ? null : r.sku)} className="p-1.5 rounded-lg text-muted hover:bg-canvas" title="แก้ไข"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => del(r.sku)} disabled={busySku === r.sku} className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-canvas" title="ลบ">
                          {busySku === r.sku ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editSku === r.sku && (
                    <tr className="border-t border-line-soft bg-canvas/50">
                      <td colSpan={7} className="px-3 py-3"><SkuRowEditor row={r} onDone={() => setEditSku(null)} /></td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-muted">ไม่พบ SKU ตามเงื่อนไข</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ตัวแก้ไข SKU รายตัว (กางใต้แถว): เปลี่ยนสินค้า / สาขา / สถานะ
function SkuRowEditor({ row, onDone }: { row: SkuUnitRow; onDone: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [res, setRes] = useState<any[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const [prod, setProd] = useState<{ barcode: string; scent: string; size: string } | null>(null);
  const [branch, setBranch] = useState(row.branch);
  const [status, setStatus] = useState(row.status);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = (v: string) => {
    setQuery(v); setProd(null);
    if (timer.current) clearTimeout(timer.current);
    const t = v.trim();
    if (!t) { setAcOpen(false); setRes([]); return; }
    timer.current = setTimeout(() => {
      fetch(`/api/products/search?q=${encodeURIComponent(t)}`, { headers: { accept: "application/json" } })
        .then((r) => (r.ok ? r.json() : [])).then((r) => { setRes(Array.isArray(r) ? r : []); setAcOpen(true); })
        .catch(() => { setRes([]); setAcOpen(true); });
    }, 250);
  };
  const pick = (p: any) => { setProd({ barcode: p.barcode, scent: p.scent, size: p.size }); setQuery(`${p.scent} ${p.size}`); setAcOpen(false); };
  const save = async () => {
    setBusy(true); setErr(null);
    const patch: { sku: string; barcode?: string; branch?: string; status?: string } = { sku: row.sku };
    if (prod) patch.barcode = prod.barcode;
    if (branch !== row.branch) patch.branch = branch;
    if (status !== row.status) patch.status = status;
    const r = await updateSkuUnit(patch);
    setBusy(false);
    if (r.ok) { router.refresh(); onDone(); } else setErr(r.error ?? "แก้ไขไม่สำเร็จ");
  };

  const sel = "h-[40px] border border-line rounded-lg px-2.5 text-sm bg-surface text-ink focus:outline-none focus:border-brand";
  return (
    <div className="space-y-2.5">
      <div className="text-[12px] text-muted">แก้ไข <span className="font-mono text-ink">{row.sku}</span> — ปัจจุบัน: {row.scent || "—"} {row.size || ""} · {branchName(row.branch)}</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* reassign product */}
        <div className="relative sm:col-span-1">
          <span className="block text-[11px] text-muted mb-0.5">เปลี่ยนสินค้า (เว้นว่าง = คงเดิม)</span>
          <input value={query} onChange={(e) => search(e.target.value)} placeholder="ค้นหากลิ่น/บาร์โค้ด" className={sel + " w-full"} />
          {acOpen && res.length > 0 && (
            <div className="absolute z-20 mt-1 w-full max-h-40 overflow-auto bg-surface border border-line rounded-lg shadow-lg text-sm">
              {res.map((p: any) => <button key={p.id} onMouseDown={() => pick(p)} className="block w-full text-left px-3 py-2 hover:bg-brand-soft"><b>{p.scent}</b> {p.size} <span className="text-muted">· {p.barcode}</span></button>)}
            </div>
          )}
          {prod && <div className="text-[11px] text-success mt-0.5">→ {prod.scent} {prod.size}</div>}
        </div>
        {/* branch */}
        <div>
          <span className="block text-[11px] text-muted mb-0.5">สาขา</span>
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className={sel + " w-full"}>
            {branchOptions().map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {/* status */}
        <div>
          <span className="block text-[11px] text-muted mb-0.5">สถานะ</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={sel + " w-full"}>
            <option value="in_stock">คงเหลือ (in stock)</option>
            <option value="sold">ขายแล้ว</option>
            <option value="returned">คืน</option>
            <option value="lost">ของหาย</option>
          </select>
          {row.status === "sold" && status !== "sold" && <div className="text-[11px] text-warn mt-0.5">จะยกเลิกการผูกบิล ({row.sold_receipt_no || "-"})</div>}
        </div>
      </div>
      {err && <div className="text-[12px] text-danger">{err}</div>}
      <div className="flex gap-2">
        <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 bg-brand text-white text-sm font-medium rounded-lg px-3 py-1.5 disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} บันทึก
        </button>
        <button onClick={onDone} className="text-sm text-muted border border-line rounded-lg px-3 py-1.5 hover:bg-canvas">ยกเลิก</button>
      </div>
    </div>
  );
}
