"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Plus, Minus, Loader2, ClipboardCheck, Search } from "lucide-react";
import { useBarcodeScanner } from "@/lib/useBarcodeScanner";
import { BarcodeScanner, type ScanResult } from "@/components/BarcodeScanner";
import { submitStockCount } from "@/lib/actions/stock-count";

type Item = { barcode: string; scent: string; size: string; expected: number; counted: string };
const inp = "border border-line rounded-lg px-2 py-1.5 text-sm bg-surface text-ink focus:outline-none focus:border-brand";

export function StockCountForm({ expected, branch }: { expected: { barcode: string; scent: string; size: string; remaining: number }[]; branch: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<Item[]>(() =>
    expected.map((e) => ({ barcode: e.barcode, scent: e.scent, size: e.size, expected: Math.round(e.remaining), counted: "" })));
  const [scanning, setScanning] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, start] = useTransition();

  // resolve scanned barcodes that aren't in the expected list (extra stock found)
  const [catalog, setCatalog] = useState<Map<string, any>>(new Map());
  useEffect(() => {
    fetch("/api/products/all", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : [])).then((rows: any[]) => setCatalog(new Map((rows || []).map((p) => [String(p.barcode), p])))).catch(() => {});
  }, []);

  const say = (m: string) => { setFlash(m); setTimeout(() => setFlash((f) => (f === m ? null : f)), 1500); };
  const setCount = (barcode: string, size: string, fn: (n: number) => number) =>
    setRows((rs) => rs.map((r) => (r.barcode === barcode && r.size === size ? { ...r, counted: String(Math.max(0, fn(Number(r.counted) || 0))) } : r)));

  // shared increment logic for camera + hardware/laser; returns a ScanResult for the
  // camera's on-screen confirmation. Reads current rows via a ref (state is async).
  const rowsRef = useRef(rows);
  useEffect(() => { rowsRef.current = rows; });
  const knownCodes = useMemo(() => new Set(catalog.keys()), [catalog]);

  const applyScan = (code: string): ScanResult => {
    const c = String(code || "").trim();
    if (!c) return { ok: false, label: "-" };
    try { navigator.vibrate?.(30); } catch {}
    const cur = rowsRef.current;
    const idx = cur.findIndex((r) => r.barcode === c);
    if (idx >= 0) {
      const now = (Number(cur[idx].counted) || 0) + 1;
      setCount(cur[idx].barcode, cur[idx].size, (n) => n + 1);
      say(`+1 · ${cur[idx].scent} ${cur[idx].size}`);
      return { ok: true, label: `${cur[idx].scent} ${cur[idx].size}`, sub: `นับได้ ${now}` };
    }
    const p = catalog.get(c);
    if (p) {
      setRows((rs) => [...rs, { barcode: c, scent: p.scent, size: p.size || "", expected: 0, counted: "1" }]);
      say(`+1 · ${p.scent} ${p.size} (นอกรายการ)`);
      return { ok: true, label: `${p.scent} ${p.size}`, sub: "นอกรายการ · นับได้ 1" };
    }
    say(`ไม่พบ ${c}`);
    return { ok: false, label: `ไม่พบ ${c}` };
  };

  // hardware keyboard-wedge + SUNMI laser; the phone camera is the <BarcodeScanner> below
  useBarcodeScanner(scanning, applyScan);

  // camera flow: each scan identifies the item (+1 default) then the camera closes so
  // you can edit that item's quantity on screen; tap สแกนนับ again to continue.
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const onCameraScan = (code: string) => {
    const c = String(code || "").trim();
    const inList = rowsRef.current.find((r) => r.barcode === c);
    const p = inList ? null : catalog.get(c);
    applyScan(c);   // +1 by default — you can overwrite it below
    if (inList) setActiveKey(`${inList.barcode}__${inList.size}`);
    else if (p) setActiveKey(`${c}__${p.size || ""}`);
    setScanning(false);   // close the camera so you can edit the quantity on screen
  };
  // after a scan closes the camera, scroll to + focus the scanned item's quantity box
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
  const list = useMemo(() => {
    const t = term.trim().toLowerCase();
    return rows.filter((r) => !t || r.scent?.toLowerCase().includes(t) || r.barcode?.toLowerCase().includes(t));
  }, [rows, term]);
  const doneRows = rows.filter(isCounted);   // only items the salesperson actually counted
  const doneCount = doneRows.length;
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
    <div className="space-y-3">
      {/* scan + progress */}
      <div className="rounded-xl border border-line bg-surface shadow-sm p-3">
        <div className="flex items-center gap-2 mb-2">
          <button type="button" onClick={() => (scanning ? setScanning(false) : setScanning(true))}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border ${scanning ? "border-brand bg-brand text-white" : "border-line text-muted hover:bg-canvas"}`}>
            <ScanLine className="w-4 h-4" /> {scanning ? "กำลังสแกน… (แตะเพื่อหยุด)" : "สแกนนับ"}
          </button>
          {flash && <span className="text-xs text-brand-dark font-medium">{flash}</span>}
          <span className="ml-auto text-[11px] text-muted">นับแล้ว {doneCount}/{rows.length}</span>
        </div>
        <div className="h-1.5 rounded-full bg-canvas overflow-hidden">
          <div className="h-full bg-brand transition-all" style={{ width: `${rows.length ? (doneCount / rows.length) * 100 : 0}%` }} />
        </div>
        <div className="relative mt-2">
          <Search className="w-4 h-4 text-muted-soft absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="ค้นหากลิ่น / บาร์โค้ด…" className={inp + " w-full pl-8"} />
        </div>
      </div>

      {/* count rows */}
      <div className="rounded-xl border border-line bg-surface shadow-sm divide-y divide-line-soft">
        {list.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted">{rows.length ? "ไม่พบสินค้าที่ค้นหา" : "ยังไม่มีสต๊อกให้นับ"}</div>
        ) : list.map((r) => {
          const c = counted(r), diff = c - r.expected, done = isCounted(r);
          const badge = !done ? null : diff === 0 ? <span className="text-success text-[11px] font-medium">✓ ตรง</span>
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
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />} ยืนยันผลนับ (ส่งให้แอดมิน)
        </button>
        <p className="text-[11px] text-muted-soft text-center">ระบบจะปรับสต๊อกหลังแอดมินตรวจและอนุมัติ</p>
      </div>

      {/* phone camera scanner (single scan → edit qty on screen → tap สแกนนับ to continue) */}
      {scanning && <BarcodeScanner knownCodes={knownCodes} onDetected={onCameraScan} onClose={() => setScanning(false)} />}
    </div>
  );
}
