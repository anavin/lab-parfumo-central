"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Check, HelpCircle, Trash2, Barcode, Loader2, Pencil, X } from "lucide-react";
import { beep } from "@/lib/feedback";
import { useBarcodeScanner } from "@/lib/useBarcodeScanner";
import { BarcodeScanner, type ScanResult } from "@/components/BarcodeScanner";
import { captureShelfUnit, deleteShelfCapture, updateShelfCapture } from "@/lib/actions/shelf-capture";
import { num } from "@/lib/format";
import type { ShelfCaptureRow } from "@/lib/queries";

type Pending = { barcode: string; scent: string; size: string };

// เก็บข้อมูลสดจากหน้าสาขา รายขวด: ยิงบาร์โค้ดสินค้า → ยิง SKU → บันทึกเป็นคู่ (barcode+sku)
// เป็นชุดข้อมูลใหม่แยกจาก sku_units ไว้เทียบกับระบบทีหลัง
export function ShelfCaptureMode({ captures, branch }: { captures: ShelfCaptureRow[]; branch: string | null }) {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const pendingRef = useRef<Pending | null>(null);
  const [msg, setMsg] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(0);
  const [bcInput, setBcInput] = useState("");
  const [skuInput, setSkuInput] = useState("");

  const setPend = (p: Pending | null) => { pendingRef.current = p; setPending(p); };

  // one pipeline: a product barcode selects the current bottle; anything else is its SKU → capture the pair
  const handle = async (raw: string, fromScan = true): Promise<ScanResult> => {
    const code = String(raw || "").trim();
    if (!code || !branch) return { ok: false, label: "", sub: "" };
    setBusy(true);
    try {
      const p = await fetch(`/api/products/barcode?code=${encodeURIComponent(code)}`, { headers: { accept: "application/json" } })
        .then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (p && p.barcode) {
        setPend({ barcode: p.barcode, scent: p.scent, size: p.size || "" });
        setBcInput(""); setSkuInput("");
        const r: ScanResult = { ok: true, title: "เลือกขวด", label: `${p.scent} ${p.size || ""}`.trim(), sub: "ยิงสติกเกอร์ SKU ของขวดนี้" };
        setMsg(r); return r;
      }
      // not a product → treat as SKU for the current bottle
      const cur = pendingRef.current;
      if (!cur) { const r: ScanResult = { ok: false, title: "ยิงบาร์โค้ดสินค้าก่อน", label: `SKU ${code}`, sub: "1 ขวด = ยิงบาร์โค้ด แล้วยิง SKU" }; setMsg(r); return r; }
      const res = await captureShelfUnit({ barcode: cur.barcode, sku: code, branch });
      if (res.ok) {
        setPend(null); setBcInput(""); setSkuInput(""); setAdded((a) => a + 1); router.refresh();
        const r: ScanResult = { ok: !res.warn, title: res.warn ? "เก็บแล้ว (มีข้อสังเกต)" : "เก็บแล้ว ✓", label: `${cur.scent} ${cur.size}`.trim(), sub: res.warn || `SKU ${code}` };
        setMsg(r); return r;
      }
      const r: ScanResult = { ok: false, title: "เก็บไม่ได้", label: `SKU ${code}`, sub: res.error }; setMsg(r); return r;
    } finally { setBusy(false); }
  };

  useBarcodeScanner(!!branch, (code) => {
    handle(code).then((r) => { beep(r.ok ? "ok" : "error"); try { navigator.vibrate?.(r.ok ? 40 : [60, 40, 60]); } catch {} });
  });

  const del = async (id: number) => { if (!confirm("ลบรายการนี้?")) return; setBusy(true); const r = await deleteShelfCapture(id); setBusy(false); if (r.ok) router.refresh(); else alert(r.error ?? "ลบไม่สำเร็จ"); };
  const [editId, setEditId] = useState<number | null>(null);

  const scents = useMemo(() => new Set(captures.map((c) => c.scent || c.barcode || "")).size, [captures]);
  const fmt = (iso: string) => { const d = new Date(iso); return isNaN(+d) ? "" : d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }); };

  if (!branch) return <div className="text-sm text-muted py-4">เลือกสาขาก่อนจึงจะเก็บข้อมูลได้</div>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">1 ขวด = <b className="text-ink">ยิงบาร์โค้ดสินค้า</b> แล้ว <b className="text-ink">ยิงสติกเกอร์ SKU</b> → บันทึกเป็นคู่ · เก็บเป็นชุดข้อมูลใหม่ไว้เทียบกับระบบ</p>

      {/* current bottle */}
      <div className={"rounded-xl border p-3 " + (pending ? "border-brand/50 bg-brand-soft/40" : "border-line bg-surface")}>
        <div className="grid grid-cols-2 gap-2">
          <div className={"rounded-lg border px-2.5 py-2 " + (pending ? "border-success/40 bg-success-soft/40" : "border-line")}>
            <div className="text-[11px] text-muted flex items-center gap-1"><Barcode className="w-3 h-3" /> 1) บาร์โค้ดสินค้า</div>
            <div className="text-sm font-medium text-ink mt-0.5 truncate">{pending ? `${pending.scent} ${pending.size}` : "— ยิงก่อน —"}</div>
          </div>
          <div className="rounded-lg border border-line px-2.5 py-2">
            <div className="text-[11px] text-muted flex items-center gap-1"><ScanLine className="w-3 h-3" /> 2) สติกเกอร์ SKU</div>
            <div className="text-sm text-muted mt-0.5">{pending ? "ยิง SKU ได้เลย" : "เลือกขวดก่อน"}</div>
          </div>
        </div>
      </div>

      <button onClick={() => setScanning(true)} className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-white text-base font-medium active:scale-95">
        <ScanLine className="w-5 h-5" /> สแกน (บาร์โค้ด → SKU)
      </button>

      {msg && (
        <div className={"text-sm rounded-lg px-3 py-2 flex items-start gap-1.5 " + (msg.ok ? "bg-success-soft text-success" : "bg-warn-soft text-warn")}>
          {msg.ok ? <Check className="w-4 h-4 mt-0.5 shrink-0" /> : <HelpCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span><b>{msg.title ?? msg.label}</b>{msg.sub ? ` · ${msg.sub}` : ""}</span>
        </div>
      )}

      {/* manual fallback */}
      <details className="rounded-lg border border-line bg-surface">
        <summary className="px-3 py-2 text-xs text-muted cursor-pointer select-none">พิมพ์เอง (ถ้าสแกนไม่ติด)</summary>
        <div className="px-3 pb-3 pt-1 space-y-2">
          <input value={bcInput} onChange={(e) => setBcInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handle(bcInput, false); } }}
            placeholder="บาร์โค้ดสินค้า แล้ว Enter" className="w-full h-[40px] border border-line rounded-lg px-2.5 text-sm font-mono bg-surface focus:outline-none focus:border-brand" />
          <div className="flex gap-1.5">
            <input value={skuInput} onChange={(e) => setSkuInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handle(skuInput, false); } }} disabled={!pending}
              placeholder={pending ? "SKU แล้ว Enter" : "เลือกขวดก่อน"} className="flex-1 min-w-0 h-[40px] border border-line rounded-lg px-2.5 text-sm font-mono bg-surface focus:outline-none focus:border-brand disabled:opacity-50" />
            <button onClick={() => handle(skuInput, false)} disabled={busy || !pending || !skuInput.trim()} className="shrink-0 h-[40px] px-3 rounded-lg bg-brand-dark text-white text-sm font-medium disabled:opacity-40">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "เก็บ"}</button>
          </div>
        </div>
      </details>

      {/* summary + captured list */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-canvas p-2.5"><div className="text-[11px] text-muted">เก็บทั้งหมด</div><div className="text-xl font-bold tabular-nums text-ink">{num(captures.length)} <span className="text-sm font-normal text-muted">ขวด</span></div></div>
        <div className="rounded-lg bg-canvas p-2.5"><div className="text-[11px] text-muted">จำนวนกลิ่น</div><div className="text-xl font-bold tabular-nums text-ink">{num(scents)} <span className="text-sm font-normal text-muted">กลิ่น</span></div></div>
      </div>

      {captures.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted">ยังไม่เก็บ — ยิงบาร์โค้ดสินค้า แล้วยิง SKU ของขวดนั้น</div>
      ) : (
        <div className="rounded-xl border border-line overflow-hidden">
          {captures.map((c) => (
            <div key={c.id} className="border-t border-line-soft first:border-t-0">
              <div className="flex items-center gap-2 px-3 py-2 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="text-ink truncate">{c.scent || <span className="text-warn">ไม่พบสินค้า</span>} <span className="text-muted">{c.size || ""}</span></div>
                  <div className="font-mono text-[11px] text-muted">{c.sku}{c.barcode ? ` · ${c.barcode}` : ""} · {fmt(c.captured_at)}</div>
                </div>
                <button onClick={() => setEditId(editId === c.id ? null : c.id)} disabled={busy} className="p-1.5 rounded-lg text-muted hover:bg-canvas shrink-0" title="แก้ไข"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => del(c.id)} disabled={busy} className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-canvas shrink-0" title="ลบ"><Trash2 className="w-4 h-4" /></button>
              </div>
              {editId === c.id && <CaptureRowEditor row={c} onDone={() => setEditId(null)} />}
            </div>
          ))}
        </div>
      )}

      {scanning && <BarcodeScanner continuous knownCodes={null} onDetected={(c) => handle(c)} onClose={() => setScanning(false)} />}
    </div>
  );
}

// แก้ไขรายการที่เก็บ: แก้รหัส SKU และ/หรือเปลี่ยนสินค้า (ค้นหา)
function CaptureRowEditor({ row, onDone }: { row: ShelfCaptureRow; onDone: () => void }) {
  const router = useRouter();
  const [sku, setSku] = useState(row.sku);
  const [query, setQuery] = useState("");
  const [res, setRes] = useState<any[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const [prod, setProd] = useState<{ barcode: string; scent: string; size: string } | null>(null);
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
        .then((r) => (r.ok ? r.json() : [])).then((r) => { setRes(Array.isArray(r) ? r : []); setAcOpen(true); }).catch(() => { setRes([]); setAcOpen(true); });
    }, 250);
  };
  const save = async () => {
    setBusy(true); setErr(null);
    const patch: { id: number; sku?: string; barcode?: string } = { id: row.id };
    if (sku.trim() && sku.trim() !== row.sku) patch.sku = sku.trim();
    if (prod && prod.barcode !== row.barcode) patch.barcode = prod.barcode;
    const r = await updateShelfCapture(patch);
    setBusy(false);
    if (r.ok) { router.refresh(); onDone(); } else setErr(r.error ?? "แก้ไขไม่สำเร็จ");
  };
  const inp = "h-[38px] border border-line rounded-lg px-2.5 text-sm bg-surface focus:outline-none focus:border-brand";

  return (
    <div className="px-3 pb-3 pt-1 bg-canvas/50 space-y-2">
      <div className="text-[11px] text-muted">ปัจจุบัน: {row.scent || "—"} {row.size || ""} · <span className="font-mono">{row.sku}</span></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block"><span className="text-[11px] text-muted">รหัส SKU</span>
          <input value={sku} onChange={(e) => { setSku(e.target.value); setErr(null); }} className={inp + " w-full font-mono"} /></label>
        <div className="relative"><span className="text-[11px] text-muted">เปลี่ยนสินค้า (เว้นว่าง = คงเดิม)</span>
          <input value={query} onChange={(e) => search(e.target.value)} placeholder="ค้นหากลิ่น/บาร์โค้ด" className={inp + " w-full"} />
          {acOpen && res.length > 0 && (
            <div className="absolute z-20 mt-1 w-full max-h-40 overflow-auto bg-surface border border-line rounded-lg shadow-lg text-sm">
              {res.map((p: any) => <button key={p.id} onMouseDown={() => { setProd({ barcode: p.barcode, scent: p.scent, size: p.size }); setQuery(`${p.scent} ${p.size}`); setAcOpen(false); }} className="block w-full text-left px-3 py-2 hover:bg-brand-soft"><b>{p.scent}</b> {p.size} <span className="text-muted">· {p.barcode}</span></button>)}
            </div>
          )}
          {prod && <div className="text-[11px] text-success mt-0.5">→ {prod.scent} {prod.size}</div>}
        </div>
      </div>
      {err && <div className="text-[12px] text-danger">{err}</div>}
      <div className="flex gap-2">
        <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 bg-brand text-white text-sm font-medium rounded-lg px-3 py-1.5 disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} บันทึก</button>
        <button onClick={onDone} className="inline-flex items-center gap-1 text-sm text-muted border border-line rounded-lg px-3 py-1.5 hover:bg-canvas"><X className="w-4 h-4" /> ยกเลิก</button>
      </div>
    </div>
  );
}
