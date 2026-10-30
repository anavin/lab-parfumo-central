"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Check, Trash2, Loader2, Pencil, X, Download, RotateCcw, Search, Minus, Plus, AlertTriangle } from "lucide-react";
import { beep } from "@/lib/feedback";
import { useBarcodeScanner } from "@/lib/useBarcodeScanner";
import { BarcodeScanner, type ScanResult } from "@/components/BarcodeScanner";
import { captureShelfUnit, deleteShelfCapture, updateShelfCapture, clearShelfCaptures } from "@/lib/actions/shelf-capture";
import { num } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { branchName } from "@/lib/branches";
import type { ShelfCaptureRow } from "@/lib/queries";

type Prod = { barcode: string; scent: string; size: string };
type SlotRes = "ok" | "warn" | "dup" | "duplocal" | "err";
type SlotStatus = { status: SlotRes; msg?: string };
const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");

// เก็บข้อมูลสดจากหน้าสาขา รายขวดแบบ "ช่อง": ยิงบาร์โค้ดสินค้า → เลือกจำนวนขวด → กรอก/สแกน SKU ลงช่อง → เก็บทีเดียว
// เช็คซ้ำ (ในรอบนี้ + ในรายการ) ไม่เก็บซ้ำ แจ้งเตือนรายช่อง · เป็นชุดข้อมูลใหม่แยกจาก sku_units ไว้เทียบทีหลัง
export function ShelfCaptureMode({ captures, branch }: { captures: ShelfCaptureRow[]; branch: string | null }) {
  const router = useRouter();
  const [prod, setProd] = useState<Prod | null>(null);
  const prodRef = useRef<Prod | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const slotsRef = useRef<string[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [slotRes, setSlotRes] = useState<(SlotStatus | null)[]>([]);
  // ยิง/กรอกเสร็จ → เด้งไปช่องว่างถัดไปให้พร้อมยิงต่อ
  const focusEmpty = (arr: string[] = slotsRef.current) => { const ne = arr.findIndex((s) => !s.trim()); if (ne >= 0) setTimeout(() => inputRefs.current[ne]?.focus(), 0); };
  const [query, setQuery] = useState("");
  const [res, setRes] = useState<any[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; warn?: boolean; text: string } | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSlotList = (next: string[]) => { slotsRef.current = next; setSlots(next); };
  const selectProduct = (p: Prod | null) => {
    prodRef.current = p; setProd(p); setQuery(p ? `${p.scent} ${p.size}` : ""); setAcOpen(false); setSummary(null); setMsg(null);
    if (p) { setSlotList([""]); setSlotRes([null]); } else { setSlotList([]); setSlotRes([]); }
  };

  // route a scan/typed code: product barcode → switch product; else fill next empty SKU slot
  const onScan = async (raw: string, fromScan = true): Promise<ScanResult> => {
    const code = String(raw || "").trim();
    if (!code || !branch) return { ok: false, label: "" };
    const show = (r: ScanResult & { text?: string }): ScanResult => { setMsg({ ok: r.ok, warn: r.warn, text: r.text ?? `${r.title ?? ""}${r.sub ? " · " + r.sub : ""}`.trim() }); return r; };
    setBusy(true);
    try {
      const p = await fetch(`/api/products/barcode?code=${encodeURIComponent(code)}`, { headers: { accept: "application/json" } })
        .then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (p && p.barcode) {
        if (prodRef.current?.barcode !== p.barcode) selectProduct({ barcode: p.barcode, scent: p.scent, size: p.size || "" });
        return show({ ok: true, title: "เลือกกลิ่นแล้ว", label: `${p.scent} ${p.size || ""}`.trim(), text: `เลือกกลิ่น ${p.scent} ${p.size || ""} — ยิง/กรอก SKU ได้เลย` });
      }
      if (!prodRef.current) return show({ ok: false, title: "ยิงบาร์โค้ดสินค้าก่อน", label: `SKU ${code}`, text: "ยิงบาร์โค้ดสินค้าก่อน 1 ครั้ง" });
      if (fromScan && /^\d{8,}$/.test(code)) return show({ ok: false, warn: true, title: "ไม่เก็บ (เหมือนบาร์โค้ดสินค้า)", label: code, text: `ไม่เก็บ "${code}" (เหมือนบาร์โค้ดสินค้า) — ถ้าเป็น SKU จริงให้พิมพ์เองในช่อง` });
      if (slotsRef.current.some((s) => s && norm(s) === norm(code))) return show({ ok: false, warn: true, title: "ซ้ำในรายการ", label: `SKU ${code}`, text: `⚠ SKU "${code}" ซ้ำในรายการแล้ว` });
      const cur = [...slotsRef.current];
      const empty = cur.findIndex((s) => !s.trim());
      if (empty >= 0) { cur[empty] = code; setSlotRes((r) => { const n = [...r]; n[empty] = null; return n; }); }
      else { cur.push(code); setSlotRes((r) => [...r, null]); }
      setSlotList(cur);
      focusEmpty(cur);   // เด้งไปช่องถัดไป
      return show({ ok: true, title: "ใส่ SKU แล้ว", label: `SKU ${code}`, text: `ใส่ SKU ${code} (${cur.filter((s) => s.trim()).length} ช่อง)` });
    } finally { setBusy(false); }
  };

  useBarcodeScanner(!!branch, (code) => { onScan(code).then((r) => { beep(r.ok ? "ok" : "error"); try { navigator.vibrate?.(r.ok ? 40 : [60, 40, 60]); } catch {} }); });

  const setSlot = (i: number, v: string) => { const n = [...slotsRef.current]; n[i] = v; setSlotList(n); setSlotRes((r) => { const x = [...r]; x[i] = null; return x; }); setSummary(null); };
  const addSlot = () => { setSlotList([...slotsRef.current, ""]); setSlotRes((r) => [...r, null]); };
  const removeSlot = (i: number) => { setSlotList(slotsRef.current.filter((_, idx) => idx !== i)); setSlotRes((r) => r.filter((_, idx) => idx !== i)); };
  const setCount = (n: number) => {
    const cur = slotsRef.current; const want = Math.max(1, Math.min(99, n));
    if (want === cur.length) return;
    const next = want > cur.length ? [...cur, ...Array(want - cur.length).fill("")] : cur.slice(0, want);
    setSlotList(next); setSlotRes(Array(next.length).fill(null));
  };
  const filled = slots.filter((s) => s.trim()).length;

  const submit = async () => {
    const cur = prodRef.current; if (!cur || !branch) return;
    setBusy(true); setSummary(null); setMsg(null);
    const seen = new Set<string>();
    const resArr: (SlotStatus | null)[] = slots.map(() => null);
    let saved = 0, warn = 0, dup = 0, err = 0;
    for (let i = 0; i < slots.length; i++) {
      const v = slots[i].trim();
      if (!v) continue;
      const key = norm(v);
      if (seen.has(key)) { resArr[i] = { status: "duplocal" }; dup++; continue; }
      seen.add(key);
      const r = await captureShelfUnit({ barcode: cur.barcode, sku: v, branch });
      if (r.ok && !r.warn) { resArr[i] = { status: "ok" }; saved++; }
      else if (r.ok && r.warn) { resArr[i] = { status: "warn", msg: r.warn }; saved++; warn++; }
      else if (!r.ok && r.dup) { resArr[i] = { status: "dup" }; dup++; }
      else { resArr[i] = { status: "err", msg: (r as any).error }; err++; }
    }
    // stored ones (ok/warn) drop out; keep the problem slots so staff can fix them
    const nextSlots: string[] = []; const nextRes: (SlotStatus | null)[] = [];
    for (let i = 0; i < slots.length; i++) {
      const st = resArr[i];
      if (st && (st.status === "ok" || st.status === "warn")) continue;
      nextSlots.push(slots[i]); nextRes.push(st);
    }
    if (nextSlots.length === 0) { nextSlots.push(""); nextRes.push(null); }
    setSlotList(nextSlots); setSlotRes(nextRes);
    setSummary(`เก็บแล้ว ${saved}${warn ? ` (ข้อสังเกต ${warn})` : ""}${dup ? ` · ซ้ำ ${dup} (ไม่เก็บ)` : ""}${err ? ` · ผิดพลาด ${err}` : ""}`);
    setBusy(false);
    if (saved > 0) router.refresh();
  };

  const search = (v: string) => {
    setQuery(v);
    if (timer.current) clearTimeout(timer.current);
    const t = v.trim();
    if (!t) { setAcOpen(false); setRes([]); return; }
    timer.current = setTimeout(() => {
      fetch(`/api/products/search?q=${encodeURIComponent(t)}`, { headers: { accept: "application/json" } })
        .then((r) => (r.ok ? r.json() : [])).then((r) => { setRes(Array.isArray(r) ? r : []); setAcOpen(true); }).catch(() => { setRes([]); setAcOpen(true); });
    }, 250);
  };

  const del = async (id: number) => { if (!confirm("ลบรายการนี้?")) return; setBusy(true); const r = await deleteShelfCapture(id); setBusy(false); if (r.ok) router.refresh(); else alert(r.error ?? "ลบไม่สำเร็จ"); };
  const [editId, setEditId] = useState<number | null>(null);
  const [armClear, setArmClear] = useState(false);   // two-step confirm for wiping the round
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exportCsv = () => {
    const rows: (string | number | null)[][] = [["กลิ่น", "ขนาด", "SKU", "บาร์โค้ด", "เวลาเก็บ"]];
    for (const c of captures) rows.push([c.scent || "", c.size || "", c.sku, c.barcode || "", new Date(c.captured_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })]);
    const tag = (branch ? branchName(branch) : "all").replace(/\s+/g, "");
    downloadCsv(`shelf-capture-${tag}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };
  const doClear = async () => {
    if (!branch) return;
    if (!armClear) { setArmClear(true); if (armTimer.current) clearTimeout(armTimer.current); armTimer.current = setTimeout(() => setArmClear(false), 4000); return; }
    setArmClear(false); setBusy(true);
    const r = await clearShelfCaptures(branch); setBusy(false);
    if (r.ok) { selectProduct(null); router.refresh(); } else alert(r.error ?? "ล้างไม่สำเร็จ");
  };

  const scents = useMemo(() => new Set(captures.map((c) => c.scent || c.barcode || "")).size, [captures]);
  const fmt = (iso: string) => { const d = new Date(iso); return isNaN(+d) ? "" : d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }); };
  const resMeta: Record<SlotRes, { cls: string; label: string }> = {
    ok: { cls: "border-success bg-success-soft/50", label: "เก็บแล้ว" },
    warn: { cls: "border-warn bg-warn-soft", label: "เก็บแล้ว (ข้อสังเกต)" },
    dup: { cls: "border-warn bg-warn-soft", label: "ซ้ำในรอบนี้ — ไม่เก็บ" },
    duplocal: { cls: "border-warn bg-warn-soft", label: "ซ้ำในรายการ — ไม่เก็บ" },
    err: { cls: "border-danger bg-danger-soft", label: "เก็บไม่ได้" },
  };

  if (!branch) return <div className="text-sm text-muted py-4">เลือกสาขาก่อนจึงจะเก็บข้อมูลได้</div>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">ยิง<b className="text-ink">บาร์โค้ดสินค้า</b>เพื่อเลือกกลิ่น → <b className="text-ink">เลือกจำนวนขวด</b> → กรอก/สแกน SKU ลงช่อง → กด<b className="text-ink">เก็บ</b> · เช็คซ้ำให้อัตโนมัติ ไม่เก็บซ้ำ</p>

      {!prod ? (
        <>
          {/* step 1: pick a product */}
          <button onClick={() => setScanning(true)} className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-white text-base font-medium active:scale-95">
            <ScanLine className="w-5 h-5" /> ยิงบาร์โค้ดสินค้า เพื่อเลือกกลิ่น
          </button>
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => search(e.target.value)} placeholder="หรือค้นหากลิ่น / บาร์โค้ด"
              className="w-full h-[40px] border border-line rounded-lg pl-8 pr-3 text-sm bg-surface focus:outline-none focus:border-brand" />
            {acOpen && res.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-44 overflow-auto bg-surface border border-line rounded-lg shadow-lg text-sm">
                {res.map((p: any) => <button key={p.id} onMouseDown={() => selectProduct({ barcode: p.barcode, scent: p.scent, size: p.size })} className="block w-full text-left px-3 py-2 hover:bg-brand-soft"><b>{p.scent}</b> {p.size} <span className="text-muted">· {p.barcode}</span></button>)}
              </div>
            )}
          </div>
          {msg && <div className={"text-sm rounded-lg px-3 py-2 " + (msg.warn ? "bg-warn-soft text-warn" : "bg-danger-soft text-danger")}>{msg.text}</div>}
        </>
      ) : (
        <>
          {/* current product */}
          <div className="rounded-xl border border-brand/40 bg-brand-soft/30 px-3 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] text-muted">กลิ่นปัจจุบัน</div>
              <div className="text-base font-semibold text-ink leading-tight truncate">{prod.scent} <span className="text-muted font-normal">{prod.size}</span></div>
            </div>
            <button onClick={() => selectProduct(null)} className="shrink-0 text-xs text-muted border border-line rounded-lg px-2 py-1 hover:bg-canvas">เปลี่ยน</button>
          </div>

          {/* qty + scan */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted">จำนวนขวด</span>
            <div className="inline-flex items-center rounded-lg border border-line bg-surface">
              <button onClick={() => setCount(slots.length - 1)} className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink disabled:opacity-40" disabled={slots.length <= 1}><Minus className="w-4 h-4" /></button>
              <span className="w-8 text-center text-sm font-bold tabular-nums text-ink">{slots.length}</span>
              <button onClick={() => setCount(slots.length + 1)} className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink"><Plus className="w-4 h-4" /></button>
            </div>
            <button onClick={() => setScanning(true)} className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand text-white text-sm font-medium active:scale-95"><ScanLine className="w-4 h-4" /> สแกน SKU</button>
          </div>

          {/* SKU slots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {slots.map((s, i) => {
              const st = slotRes[i];
              return (
                <div key={i}>
                  <div className={"flex items-center gap-2 rounded-lg border bg-surface px-2 " + (st ? resMeta[st.status].cls : "border-line")}>
                    <span className="text-[11px] text-muted w-4 text-center shrink-0">{i + 1}</span>
                    <input ref={(el) => { inputRefs.current[i] = el; }} value={s} onChange={(e) => setSlot(i, e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); focusEmpty(); } }}
                      placeholder={`SKU #${i + 1}`} className="flex-1 min-w-0 h-[40px] bg-transparent text-sm font-mono focus:outline-none" />
                    {slots.length > 1 && <button onClick={() => removeSlot(i)} className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-muted hover:text-danger" aria-label="ลบช่อง"><X className="w-3.5 h-3.5" /></button>}
                  </div>
                  {st && <div className={"text-[11px] mt-0.5 flex items-center gap-1 " + (st.status === "ok" ? "text-success" : st.status === "err" ? "text-danger" : "text-warn-dark")}>
                    {st.status === "ok" ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />} {st.msg || resMeta[st.status].label}
                  </div>}
                </div>
              );
            })}
          </div>
          <button onClick={addSlot} className="inline-flex items-center gap-1 text-[12px] text-brand-dark border border-brand/40 rounded-lg px-2.5 py-1 hover:bg-brand-soft"><Plus className="w-3.5 h-3.5" /> เพิ่มช่อง</button>

          {msg && <div className={"text-sm rounded-lg px-3 py-2 " + (msg.ok ? "bg-success-soft text-success" : msg.warn ? "bg-warn-soft text-warn" : "bg-danger-soft text-danger")}>{msg.text}</div>}
          {summary && <div className="text-sm rounded-lg px-3 py-2 bg-canvas text-ink border border-line">{summary}</div>}

          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted">กรอกแล้ว <b className="text-ink tabular-nums">{filled}</b>/{slots.length} ชิ้น</span>
            <button onClick={submit} disabled={busy || filled === 0} className="inline-flex items-center gap-1.5 rounded-lg bg-gold text-white text-sm font-semibold px-4 py-2 disabled:opacity-40 hover:bg-gold-dark">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} เก็บ ({filled})
            </button>
          </div>
        </>
      )}

      {/* round actions: export + start-new-round (clear) */}
      {captures.length > 0 && (
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 text-sm text-ink border border-line rounded-lg px-3 py-1.5 hover:bg-canvas">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={doClear} disabled={busy}
            className={"ml-auto inline-flex items-center gap-1.5 text-sm rounded-lg px-3 py-1.5 border transition " +
              (armClear ? "bg-danger text-white border-danger" : "text-danger border-danger/40 hover:bg-danger-soft")}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            {armClear ? `ยืนยันล้าง ${num(captures.length)} ขวด?` : "เริ่มรอบใหม่ (ล้างข้อมูล)"}
          </button>
        </div>
      )}

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

      {scanning && <BarcodeScanner continuous knownCodes={null} onDetected={(c) => onScan(c)} onClose={() => setScanning(false)} />}
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
