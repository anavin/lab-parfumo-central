"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { beep } from "@/lib/feedback";
import { useRouter } from "next/navigation";
import { ScanLine, Plus, Minus, Loader2, ClipboardCheck, Search } from "lucide-react";
import { useBarcodeScanner } from "@/lib/useBarcodeScanner";
import { BarcodeScanner, type ScanResult } from "@/components/BarcodeScanner";
import { submitStockCount } from "@/lib/actions/stock-count";

type Item = { barcode: string; scent: string; size: string; expected: number; counted: string; changed: boolean };
const inp = "border border-line rounded-lg px-2 py-1.5 text-sm bg-surface text-ink focus:outline-none focus:border-brand";
const sizeNum = (s: string) => parseInt(String(s).replace(/[^\d]/g, ""), 10) || 0;
const byName = (a: Item, b: Item) => (a.scent || "").localeCompare(b.scent || "") || sizeNum(a.size) - sizeNum(b.size);

export function StockCountForm({ expected, branch }: { expected: { barcode: string; scent: string; size: string; remaining: number; sold: number }[]; branch: string }) {
  const router = useRouter();
  // counted is PRE-FILLED with the system stock quantity — the salesperson edits only
  // the items whose physical count differs. `changed` = the item has sold (stock moved).
  const [rows, setRows] = useState<Item[]>(() =>
    expected.map((e) => ({ barcode: e.barcode, scent: e.scent, size: e.size, expected: Math.round(e.remaining), counted: String(Math.round(e.remaining)), changed: (Number(e.sold) || 0) > 0 })).sort(byName));
  const [scanning, setScanning] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [onlyChanged, setOnlyChanged] = useState(false);   // show only items that have moved
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, start] = useTransition();

  // resolve scanned barcodes that aren't in the expected list (extra stock found)
  const [catalog, setCatalog] = useState<Map<string, any>>(new Map());
  useEffect(() => {
    fetch("/api/products/all", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : [])).then((rows: any[]) => setCatalog(new Map((rows || []).map((p) => [String(p.barcode), p])))).catch(() => {});
  }, []);

  // success flashes auto-clear; a "not found" warning stays until the next scan
  const say = (m: string, persist = false) => { setFlash(m); if (!persist) setTimeout(() => setFlash((f) => (f === m ? null : f)), 1500); };
  const setCount = (barcode: string, size: string, fn: (n: number) => number) =>
    setRows((rs) => rs.map((r) => (r.barcode === barcode && r.size === size ? { ...r, counted: String(Math.max(0, fn(Number(r.counted) || 0))) } : r)));

  // shared increment logic for camera + hardware/laser; returns a ScanResult for the
  // camera's on-screen confirmation. Reads current rows via a ref (state is async).
  const rowsRef = useRef(rows);
  useEffect(() => { rowsRef.current = rows; });
  const knownCodes = useMemo(() => new Set(catalog.keys()), [catalog]);

  // locate a scanned item and jump to it (highlight + focus its box below). It does NOT
  // change the count — quantities are pre-filled from the system stock; you edit only the
  // ones that differ. Off-list items found while scanning are added (start at 1).
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const locate = (code: string): ScanResult => {
    const c = String(code || "").trim();
    if (!c) return { ok: false, label: "-" };
    const ok = () => { beep("ok"); try { navigator.vibrate?.(30); } catch {} };
    const it = rowsRef.current.find((r) => r.barcode === c);
    if (it) { ok(); setActiveKey(`${it.barcode}__${it.size}`); say(`${it.scent} ${it.size}`); return { ok: true, label: `${it.scent} ${it.size}`, sub: `ในระบบ ${it.expected}` }; }
    const p = catalog.get(c);
    if (p) { ok(); setRows((rs) => [...rs, { barcode: c, scent: p.scent, size: p.size || "", expected: 0, counted: "1", changed: true }]); setActiveKey(`${c}__${p.size || ""}`); say(`${p.scent} ${p.size} (นอกรายการ)`); return { ok: true, label: `${p.scent} ${p.size}`, sub: "นอกรายการ" }; }
    beep("error"); try { navigator.vibrate?.([60, 40, 60]); } catch {}
    say(`⚠ ไม่พบ ${c}`, true); return { ok: false, label: `ไม่พบ ${c}` };
  };
  // hardware keyboard-wedge + SUNMI laser jump to the item; the phone camera is below
  useBarcodeScanner(scanning, locate);
  const onCameraScan = (code: string) => { locate(code); setScanning(false); };

  // after the camera closes, scroll to + focus (select) the scanned item's quantity box
  useEffect(() => {
    if (!activeKey || scanning) return;
    const el = document.getElementById(`cnt-${activeKey}`) as HTMLInputElement | null;
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = setTimeout(() => { el.focus(); el.select(); }, 220);
    return () => clearTimeout(t);
  }, [activeKey, scanning]);

  const counted = (r: Item) => Number(r.counted) || 0;
  const isCounted = (r: Item) => r.counted !== "";
  const movedCount = useMemo(() => rows.filter((r) => r.changed).length, [rows]);
  const list = useMemo(() => {
    const t = term.trim().toLowerCase();
    return rows
      .filter((r) => (!onlyChanged || r.changed) && (!t || r.scent?.toLowerCase().includes(t) || r.barcode?.toLowerCase().includes(t)))
      .sort(byName);
  }, [rows, term, onlyChanged]);
  const doneRows = rows.filter(isCounted);   // pre-filled → every row counts
  const doneCount = doneRows.length;
  const edited = rows.filter((r) => counted(r) !== r.expected).length;   // differs from system
  const short = doneRows.reduce((s, r) => s + Math.max(0, r.expected - counted(r)), 0);
  const over = doneRows.reduce((s, r) => s + Math.max(0, counted(r) - r.expected), 0);

  const submit = () => start(async () => {
    setErr(null);
    // submit only counted rows — uncounted items are left untouched (not zeroed)
    const lines = doneRows.map((r) => ({ barcode: r.barcode, scent: r.scent, size: r.size, expected: r.expected, counted: counted(r) }));
    const res = await submitStockCount(branch, lines, note);
    if (res.ok) router.push("/my"); else setErr(res.error ?? "ส่งไม่สำเร็จ");
  });

  return (
    <div className="space-y-3 pb-24">
      {/* progress + search (scan is the floating button, bottom-right) */}
      <div className="rounded-xl border border-line bg-surface shadow-sm p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-ink shrink-0">รายการ {rows.length}</span>
          {edited > 0 && <span className="inline-flex items-center rounded bg-warn-soft px-1.5 py-0.5 text-[11px] font-medium text-warn-dark shrink-0">แก้ไข {edited}</span>}
          {flash && <span className="text-xs text-brand-dark font-medium truncate">{flash}</span>}
        </div>
        <p className="text-[11px] text-muted-soft mb-2">ช่องจำนวนดึงจากสต๊อกในระบบให้แล้ว — แก้เฉพาะตัวที่นับได้ไม่ตรง</p>
        <div className="relative">
          <Search className="w-4 h-4 text-muted-soft absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="ค้นหากลิ่น / บาร์โค้ด…" className={inp + " w-full pl-8"} />
        </div>
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={() => setOnlyChanged(false)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${!onlyChanged ? "bg-ink text-surface border-ink" : "bg-surface text-muted border-line hover:bg-canvas"}`}>ทั้งหมด ({rows.length})</button>
          <button type="button" onClick={() => setOnlyChanged(true)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${onlyChanged ? "bg-ink text-surface border-ink" : "bg-surface text-muted border-line hover:bg-canvas"}`}>มีความเคลื่อนไหว ({movedCount})</button>
        </div>
      </div>

      {/* count rows */}
      <div className="rounded-xl border border-line bg-surface shadow-sm divide-y divide-line-soft">
        {list.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted">{!rows.length ? "ยังไม่มีสต๊อกให้นับ" : onlyChanged ? "ยังไม่มีสินค้าที่มีความเคลื่อนไหว" : "ไม่พบสินค้าที่ค้นหา"}</div>
        ) : list.map((r) => {
          const c = counted(r), diff = c - r.expected, done = isCounted(r);
          // only flag variances (pre-filled rows match by default → no ✓ noise)
          const badge = !done || diff === 0 ? null
            : diff < 0 ? <span className="text-danger text-[11px] font-medium">ขาด {Math.abs(diff)}</span>
            : <span className="text-warn-dark text-[11px] font-medium">เกิน {diff}</span>;
          return (
            <div key={r.barcode + r.size} className={`flex items-center gap-2 px-3 py-2 transition-colors ${activeKey === `${r.barcode}__${r.size}` ? "bg-brand-soft/50" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink truncate">{r.scent} <span className="text-muted text-xs">{r.size}</span></div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center rounded bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-muted tabular-nums">ในระบบ {r.expected}</span>
                  {badge}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => setCount(r.barcode, r.size, (n) => n - 1)} className="p-1.5 rounded-lg border border-line text-muted hover:bg-canvas"><Minus className="w-4 h-4" /></button>
                <input id={`cnt-${r.barcode}__${r.size}`} value={r.counted} inputMode="numeric" placeholder="—" onFocus={(e) => e.target.select()}
                  onChange={(e) => setRows((rs) => rs.map((x) => (x.barcode === r.barcode && x.size === r.size ? { ...x, counted: e.target.value.replace(/[^\d]/g, "") } : x)))}
                  className={inp + ` w-12 text-center tabular-nums ${done && diff !== 0 ? (diff < 0 ? "border-danger text-danger" : "border-warn text-warn-dark") : ""}`} />
                <button type="button" onClick={() => setCount(r.barcode, r.size, (n) => n + 1)} className="p-1.5 rounded-lg border border-line text-muted hover:bg-canvas"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* summary + submit */}
      <div className="rounded-xl border border-line bg-surface shadow-sm p-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">ส่วนต่างรวม</span>
          <span className="font-medium">{short === 0 && over === 0 ? <span className="text-success">ตรงทั้งหมด</span> : <>{short > 0 && <span className="text-danger">ขาด {short}</span>}{short > 0 && over > 0 && " · "}{over > 0 && <span className="text-warn-dark">เกิน {over}</span>}</>}</span>
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุ (ถ้ามี)" className={inp + " w-full"} />
        {err && <div className="text-xs text-danger">{err}</div>}
        <button onClick={submit} disabled={saving || doneCount === 0}
          className="btn btn-brand w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />} ยืนยันผลนับ (ส่งให้แอดมิน)
        </button>
        <p className="text-[11px] text-muted-soft text-center">ระบบจะปรับสต๊อกหลังแอดมินตรวจและอนุมัติ</p>
      </div>

      {/* floating scan button — always reachable, so you scan the next item without scrolling up */}
      {!scanning && (
        <button type="button" onClick={() => setScanning(true)}
          className="no-print fixed bottom-6 right-5 z-40 inline-flex items-center gap-2 pl-4 pr-5 py-3.5 rounded-full bg-brand text-white shadow-lg font-semibold hover:bg-brand-dark active:scale-95 transition">
          <ScanLine className="w-5 h-5" /> สแกน
        </button>
      )}

      {/* phone camera scanner (single scan → edit qty on screen → tap the floating button to continue) */}
      {scanning && <BarcodeScanner knownCodes={knownCodes} onDetected={onCameraScan} onClose={() => setScanning(false)} />}
    </div>
  );
}
