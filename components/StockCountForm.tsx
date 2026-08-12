"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Plus, Minus, Loader2, ClipboardCheck, Search, Check } from "lucide-react";
import { useBarcodeScanner } from "@/lib/useBarcodeScanner";
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

  useBarcodeScanner(scanning, (code) => {
    const c = String(code || "").trim();
    setRows((rs) => {
      const idx = rs.findIndex((r) => r.barcode === c);
      if (idx >= 0) { say(`+1 · ${rs[idx].scent} ${rs[idx].size}`); try { navigator.vibrate?.(30); } catch {}
        return rs.map((r, j) => (j === idx ? { ...r, counted: String((Number(r.counted) || 0) + 1) } : r)); }
      const p = catalog.get(c);
      if (p) { say(`+1 · ${p.scent} ${p.size} (นอกรายการ)`); try { navigator.vibrate?.(30); } catch {}
        return [...rs, { barcode: c, scent: p.scent, size: p.size || "", expected: 0, counted: "1" }]; }
      say(`ไม่พบ ${c}`); return rs;
    });
  });

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
            <div key={r.barcode + r.size} className="flex items-center gap-2 px-3 py-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink truncate">{r.scent} <span className="text-muted text-xs">{r.size}</span></div>
                <div className="text-[11px] text-muted-soft">ระบบ {r.expected} {badge && <span className="ml-1">· {badge}</span>}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => setCount(r.barcode, r.size, (n) => n - 1)} className="p-1.5 rounded-lg border border-line text-muted hover:bg-canvas"><Minus className="w-4 h-4" /></button>
                <input value={r.counted} inputMode="numeric" placeholder="—" onFocus={(e) => e.target.select()}
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
    </div>
  );
}
