"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ScanLine, Check, X, Loader2, Search, Boxes, Minus, AlertTriangle } from "lucide-react";
import { branchName } from "@/lib/branches";
import { addSkuUnit, getSkuBindInfo } from "@/lib/actions/sku";
import { beep } from "@/lib/feedback";
import { useBarcodeScanner } from "@/lib/useBarcodeScanner";
import { BarcodeScanner, type ScanResult } from "@/components/BarcodeScanner";

type Prod = { barcode: string; scent: string; size: string };
type Info = { stock: number; skuCount: number };
type SlotRes = "ok" | "dup" | "sold" | "err" | "duplocal";
const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");

// เก็บ/ผูก SKU ให้ตรงยอด: ยิงบาร์โค้ดสินค้า → เลือกจำนวนขวด → กรอก/สแกน SKU ลงช่อง → ผูกทีเดียว
// เช็คซ้ำทั้งในรายการ (ซ้ำกันเอง) และในระบบ (addSkuUnit คืน already) → ไม่เก็บซ้ำ แจ้งเตือนรายช่อง
export function SkuAddPanel({ branch, defaultOpen = false }: { branch: string | null; defaultOpen?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [prod, setProd] = useState<Prod | null>(null);
  const prodRef = useRef<Prod | null>(null);
  const [info, setInfo] = useState<Info | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const slotsRef = useRef<string[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [slotRes, setSlotRes] = useState<(SlotRes | null)[]>([]);
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

  const selectProduct = async (p: Prod) => {
    prodRef.current = p; setProd(p); setQuery(`${p.scent} ${p.size}`); setAcOpen(false); setSummary(null); setMsg(null);
    setInfo(null);
    const i = await getSkuBindInfo(p.barcode, branch || "").catch(() => ({ stock: 0, skuCount: 0 }));
    setInfo(i);
    const gap = Math.max(0, (i.stock || 0) - (i.skuCount || 0));
    const n = gap > 0 ? gap : 1;
    setSlotList(Array(n).fill(""));
    setSlotRes(Array(n).fill(null));
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
        if (prodRef.current?.barcode !== p.barcode) await selectProduct({ barcode: p.barcode, scent: p.scent, size: p.size || "" });
        return show({ ok: true, title: "เลือกกลิ่นแล้ว", label: `${p.scent} ${p.size || ""}`.trim(), sub: "ยิง/กรอก SKU ได้เลย", text: `เลือกกลิ่น ${p.scent} ${p.size || ""} — ยิง/กรอก SKU ได้เลย` });
      }
      if (!prodRef.current) return show({ ok: false, title: "ยิงบาร์โค้ดสินค้าก่อน", label: `SKU ${code}`, sub: "ยิงบาร์โค้ดสินค้า 1 ครั้งก่อน", text: "ยิงบาร์โค้ดสินค้าก่อน 1 ครั้ง" });
      // guard: plain 8+ digit code that isn't a product = likely an unknown product barcode, not a per-bottle SKU
      if (fromScan && /^\d{8,}$/.test(code)) return show({ ok: false, warn: true, title: "ไม่เก็บ (เหมือนบาร์โค้ดสินค้า)", label: code, sub: "ถ้าเป็น SKU จริงให้พิมพ์เองในช่อง", text: `ไม่เก็บ "${code}" (เหมือนบาร์โค้ดสินค้า) — ถ้าเป็น SKU จริงให้พิมพ์เองในช่อง` });
      // dedup within the list
      if (slotsRef.current.some((s) => s && norm(s) === norm(code))) return show({ ok: false, warn: true, title: "ซ้ำในรายการ", label: `SKU ${code}`, sub: "อยู่ในช่องแล้ว", text: `⚠ SKU "${code}" ซ้ำในรายการแล้ว` });
      // fill the first empty slot, else append a new one
      const cur = [...slotsRef.current];
      const empty = cur.findIndex((s) => !s.trim());
      if (empty >= 0) { cur[empty] = code; setSlotRes((r) => { const n = [...r]; n[empty] = null; return n; }); }
      else { cur.push(code); setSlotRes((r) => [...r, null]); }
      setSlotList(cur);
      focusEmpty(cur);   // เด้งไปช่องถัดไป
      return show({ ok: true, title: "ใส่ SKU แล้ว", label: `SKU ${code}`, sub: `${cur.filter((s) => s.trim()).length} ช่อง`, text: `ใส่ SKU ${code} (${cur.filter((s) => s.trim()).length} ช่อง)` });
    } finally { setBusy(false); }
  };

  useBarcodeScanner(open && !!branch, (code) => { onScan(code).then((r) => { beep(r.ok ? "ok" : "error"); try { navigator.vibrate?.(r.ok ? 40 : [60, 40, 60]); } catch {} }); });

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
    const resArr: (SlotRes | null)[] = slots.map(() => null);
    let added = 0, dup = 0, err = 0;
    for (let i = 0; i < slots.length; i++) {
      const v = slots[i].trim();
      if (!v) continue;
      const key = norm(v);
      if (seen.has(key)) { resArr[i] = "duplocal"; dup++; continue; }   // ซ้ำกันเองในรายการ
      seen.add(key);
      const r = await addSkuUnit({ sku: v, barcode: cur.barcode, branch });
      if (r.ok && !r.already) { resArr[i] = "ok"; added++; }
      else if (r.ok && r.already) { resArr[i] = "dup"; dup++; }          // ซ้ำในระบบ → ไม่เก็บ
      else if ((r as any).soldOnShelf) { resArr[i] = "sold"; err++; }
      else { resArr[i] = "err"; err++; }
    }
    // clear the ones that were stored OK; keep problem slots so staff can fix them
    const nextSlots: string[] = []; const nextRes: (SlotRes | null)[] = [];
    for (let i = 0; i < slots.length; i++) {
      if (resArr[i] === "ok") continue;              // stored → drop
      nextSlots.push(slots[i]); nextRes.push(resArr[i]);
    }
    if (nextSlots.length === 0) { nextSlots.push(""); nextRes.push(null); }
    setSlotList(nextSlots); setSlotRes(nextRes);
    setSummary(`เก็บแล้ว ${added}${dup ? ` · ซ้ำ ${dup} (ไม่เก็บ)` : ""}${err ? ` · มีปัญหา ${err}` : ""}`);
    setBusy(false);
    if (added > 0) { const i = await getSkuBindInfo(cur.barcode, branch).catch(() => null); if (i) setInfo(i); router.refresh(); }
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

  if (!open) return (
    <div className="mb-3">
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-dark border border-brand/40 rounded-lg px-3 py-1.5 hover:bg-brand-soft">
        <Plus className="w-4 h-4" /> เพิ่ม SKU เอง
      </button>
    </div>
  );

  const gap = info ? Math.max(0, info.stock - info.skuCount) : null;
  const resMeta: Record<SlotRes, { cls: string; label: string }> = {
    ok: { cls: "border-success bg-success-soft/50", label: "เก็บแล้ว" },
    dup: { cls: "border-warn bg-warn-soft", label: "ซ้ำในระบบ — ไม่เก็บ" },
    duplocal: { cls: "border-warn bg-warn-soft", label: "ซ้ำในรายการ — ไม่เก็บ" },
    sold: { cls: "border-danger bg-danger-soft", label: "ขายแล้วเจอบนชั้น" },
    err: { cls: "border-danger bg-danger-soft", label: "เก็บไม่ได้" },
  };

  return (
    <div className="mb-3 rounded-xl border border-brand/40 bg-brand-soft/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-ink flex items-center gap-1.5"><Boxes className="w-4 h-4 text-brand" /> ผูก SKU ให้ตรงยอด {branch ? `· ${branchName(branch)}` : ""}</span>
        {!defaultOpen && <button onClick={() => setOpen(false)} className="text-muted hover:text-ink"><X className="w-4 h-4" /></button>}
      </div>

      {!branch ? (
        <div className="text-sm text-muted py-2">เลือกสาขาก่อน จึงจะเก็บ SKU ได้ — กัน SKU ไปผิดสาขา</div>
      ) : !prod ? (
        <>
          {/* step 1: pick a product (scan or search) */}
          <button onClick={() => setScanning(true)} className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-white text-base font-medium active:scale-95 mb-2">
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
          {msg && <div className={"mt-2 text-sm rounded-lg px-3 py-2 " + (msg.warn ? "bg-warn-soft text-warn" : "bg-danger-soft text-danger")}>{msg.text}</div>}
        </>
      ) : (
        <>
          {/* header: product + stock vs enrolled */}
          <div className="rounded-lg border border-brand/30 bg-surface px-3 py-2.5 mb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-base font-semibold text-ink leading-tight truncate">{prod.scent} <span className="text-muted font-normal">{prod.size}</span></div>
                <div className="text-[12px] text-muted mt-0.5">
                  {info ? <>สต๊อก <b className="text-ink">{info.stock}</b> · มี SKU แล้ว <b className="text-ink">{info.skuCount}</b>{gap != null && <> · <span className={gap > 0 ? "text-warn-dark font-semibold" : "text-success"}>ยังไม่ผูก {gap} ชิ้น</span></>}</> : "กำลังโหลดยอด…"}
                  <span className="text-muted"> — กรอก/สแกน SKU ลงช่อง (ไม่เพิ่มยอด)</span>
                </div>
              </div>
              <button onClick={() => { prodRef.current = null; setProd(null); setInfo(null); setSlotList([]); setSlotRes([]); setQuery(""); setMsg(null); setSummary(null); }}
                className="shrink-0 text-xs text-muted border border-line rounded-lg px-2 py-1 hover:bg-canvas">เปลี่ยน</button>
            </div>
          </div>

          {/* qty + scan controls */}
          <div className="flex items-center gap-2 mb-2">
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
                  <div className={"flex items-center gap-2 rounded-lg border bg-surface px-2 " + (st ? resMeta[st].cls : "border-line")}>
                    <span className="text-[11px] text-muted w-4 text-center shrink-0">{i + 1}</span>
                    <input ref={(el) => { inputRefs.current[i] = el; }} value={s} onChange={(e) => setSlot(i, e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); focusEmpty(); } }}
                      placeholder={`SKU #${i + 1}`} className="flex-1 min-w-0 h-[40px] bg-transparent text-sm font-mono focus:outline-none" />
                    {slots.length > 1 && <button onClick={() => removeSlot(i)} className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-muted hover:text-danger" aria-label="ลบช่อง"><X className="w-3.5 h-3.5" /></button>}
                  </div>
                  {st && <div className={"text-[11px] mt-0.5 flex items-center gap-1 " + (st === "ok" ? "text-success" : st === "sold" || st === "err" ? "text-danger" : "text-warn-dark")}>
                    {st === "ok" ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />} {resMeta[st].label}
                  </div>}
                </div>
              );
            })}
          </div>

          <button onClick={addSlot} className="mt-2 inline-flex items-center gap-1 text-[12px] text-brand-dark border border-brand/40 rounded-lg px-2.5 py-1 hover:bg-brand-soft"><Plus className="w-3.5 h-3.5" /> เพิ่มช่อง</button>

          {msg && <div className={"mt-2 text-sm rounded-lg px-3 py-2 " + (msg.ok ? "bg-success-soft text-success" : msg.warn ? "bg-warn-soft text-warn" : "bg-danger-soft text-danger")}>{msg.text}</div>}
          {summary && <div className="mt-2 text-sm rounded-lg px-3 py-2 bg-canvas text-ink border border-line">{summary}</div>}

          <div className="flex items-center justify-between mt-3">
            <span className="text-[12px] text-muted">กรอกแล้ว <b className="text-ink tabular-nums">{filled}</b>/{slots.length} ชิ้น</span>
            <button onClick={submit} disabled={busy || filled === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gold text-white text-sm font-semibold px-4 py-2 disabled:opacity-40 hover:bg-gold-dark">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} ผูก SKU ({filled})
            </button>
          </div>
        </>
      )}

      {scanning && <BarcodeScanner continuous knownCodes={null} onDetected={(c) => onScan(c)} onClose={() => setScanning(false)} />}
    </div>
  );
}
