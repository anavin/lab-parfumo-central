"use client";
import { Fragment, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Barcode, Search, PackageCheck, ShoppingCart, Plus, ScanLine, Check, X, Loader2, Pencil, Trash2 } from "lucide-react";
import { num } from "@/lib/format";
import { branchName, branchOptions } from "@/lib/branches";
import { addSkuUnit, updateSkuUnit, deleteSkuUnit } from "@/lib/actions/sku";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import type { SkuUnitRow } from "@/lib/queries";

type Filter = "in_stock" | "sold" | "all";

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

  const counts = useMemo(() => {
    let inStock = 0, sold = 0, other = 0;
    for (const r of rows) r.status === "in_stock" ? inStock++ : r.status === "sold" ? sold++ : other++;
    return { inStock, sold, other, total: rows.length };
  }, [rows]);

  const shown = useMemo(() => {
    const t = qText.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "in_stock" && r.status !== "in_stock") return false;
      if (filter === "sold" && r.status !== "sold") return false;
      if (!t) return true;
      return [r.sku, r.scent, r.size, r.sold_receipt_no].some((v) => String(v || "").toLowerCase().includes(t));
    });
  }, [rows, filter, qText]);

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

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Pill id="in_stock" label="คงเหลือ" n={counts.inStock} />
        <Pill id="sold" label="ขายแล้ว" n={counts.sold} />
        <Pill id="all" label="ทั้งหมด" n={counts.total} />
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
                  <tr className="border-t border-line-soft">
                    <td className="px-3 py-2 font-mono text-[13px] text-ink whitespace-nowrap">{r.sku}</td>
                    <td className="px-3 py-2 text-ink whitespace-nowrap">{r.scent || "—"}</td>
                    <td className="px-3 py-2 text-muted whitespace-nowrap">{r.size || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.status === "in_stock"
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
                      <div className="inline-flex gap-1">
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

// เพิ่ม SKU เข้าสต๊อกเองใน central (สำหรับของที่ไม่ได้มี SKU มาจากคลัง) — เลือกสินค้า แล้วสแกน/พิมพ์รหัส
function SkuAddPanel({ branch }: { branch: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prod, setProd] = useState<{ barcode: string; scent: string; size: string } | null>(null);
  const [query, setQuery] = useState("");
  const [res, setRes] = useState<any[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const [sku, setSku] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [added, setAdded] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skuRef = useRef<HTMLInputElement>(null);

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
  const pick = (p: any) => { setProd({ barcode: p.barcode, scent: p.scent, size: p.size }); setQuery(`${p.scent} ${p.size}`); setAcOpen(false); setTimeout(() => skuRef.current?.focus(), 50); };
  const add = async (raw: string): Promise<{ ok: boolean; label: string; sub?: string }> => {
    const code = String(raw || "").trim();
    if (!code || !prod || !branch) return { ok: false, label: code, sub: "" };
    setBusy(true); setMsg(null);
    const r = await addSkuUnit({ sku: code, barcode: prod.barcode, branch });
    setBusy(false);
    if (r.ok) { setMsg({ ok: true, text: `เพิ่ม ${code} → ${prod.scent} ${prod.size}` }); setSku(""); setAdded((a) => a + 1); router.refresh(); setTimeout(() => skuRef.current?.focus(), 50); return { ok: true, label: prod.scent, sub: code }; }
    setMsg({ ok: false, text: r.error }); return { ok: false, label: code, sub: r.error };
  };

  if (!open) return (
    <div className="mb-3">
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-dark border border-brand/40 rounded-lg px-3 py-1.5 hover:bg-brand-soft">
        <Plus className="w-4 h-4" /> เพิ่ม SKU เอง
      </button>
    </div>
  );
  return (
    <div className="mb-3 rounded-xl border border-brand/40 bg-brand-soft/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-ink flex items-center gap-1.5"><Plus className="w-4 h-4 text-brand" /> เพิ่ม SKU เข้าสต๊อก {branch ? `· ${branchName(branch)}` : ""}</span>
        <button onClick={() => setOpen(false)} className="text-muted hover:text-ink"><X className="w-4 h-4" /></button>
      </div>
      {!branch ? (
        <div className="text-sm text-muted py-2">เลือกสาขาก่อน (แท็บสาขาด้านบน) จึงจะเพิ่ม SKU ได้ — กัน SKU ไปผิดสาขา</div>
      ) : (
        <>
          <div className="relative mb-2">
            <input value={query} onChange={(e) => search(e.target.value)} placeholder="ค้นหาสินค้า (กลิ่น / บาร์โค้ด)"
              className="w-full h-[42px] border border-line rounded-lg px-3 text-sm bg-surface focus:outline-none focus:border-brand" />
            {acOpen && res.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-44 overflow-auto bg-surface border border-line rounded-lg shadow-lg text-sm">
                {res.map((p: any) => <button key={p.id} onMouseDown={() => pick(p)} className="block w-full text-left px-3 py-2 hover:bg-brand-soft"><b>{p.scent}</b> {p.size} <span className="text-muted">· {p.barcode}</span></button>)}
              </div>
            )}
          </div>
          {prod && (
            <>
              <div className="text-xs text-muted mb-1">สินค้า: <b className="text-ink">{prod.scent}</b> {prod.size}</div>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setScanning(true)} className="shrink-0 h-[42px] px-3 inline-flex items-center gap-1.5 rounded-lg bg-brand text-white text-sm font-medium"><ScanLine className="w-4 h-4" /> สแกน</button>
                <input ref={skuRef} value={sku} onChange={(e) => { setSku(e.target.value); setMsg(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(sku); } }} disabled={busy}
                  placeholder="สแกน/พิมพ์รหัส SKU แล้ว Enter" className="flex-1 min-w-0 h-[42px] border border-line rounded-lg px-2.5 text-sm font-mono bg-surface focus:outline-none focus:border-brand" />
                <button onClick={() => add(sku)} disabled={busy || !sku.trim()} className="shrink-0 h-[42px] px-3 rounded-lg bg-brand-dark text-white text-sm font-medium disabled:opacity-40">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "เพิ่ม"}</button>
              </div>
            </>
          )}
          {msg && <div className={"text-[12px] mt-1.5 flex items-center gap-1 " + (msg.ok ? "text-success" : "text-danger")}>{msg.ok ? <Check className="w-3.5 h-3.5" /> : null}{msg.text}</div>}
          {added > 0 && <div className="text-[11px] text-muted mt-1">เพิ่มแล้ว {added} SKU ในรอบนี้</div>}
          {scanning && <BarcodeScanner continuous knownCodes={null} onDetected={(c) => add(c)} onClose={() => setScanning(false)} />}
        </>
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
