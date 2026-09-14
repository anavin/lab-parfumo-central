"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { beep } from "@/lib/feedback";
import { useRouter } from "next/navigation";
import { ScanLine, Plus, Minus, Loader2, ClipboardCheck, Search, EyeOff, Eye } from "lucide-react";
import { useBarcodeScanner } from "@/lib/useBarcodeScanner";
import { BarcodeScanner, type ScanResult } from "@/components/BarcodeScanner";
import { submitStockCount } from "@/lib/actions/stock-count";

// verified = พนักงานลงมือกับแถวนี้จริง (พิมพ์/กด +−/สแกน) — ไม่ใช่ปล่อยค่าที่ระบบเติมให้
type Item = { barcode: string; scent: string; size: string; expected: number; counted: string; changed: boolean; verified: boolean };
const inp = "border border-line rounded-lg px-2 py-2 min-h-[40px] text-sm bg-surface text-ink focus:outline-none focus:border-brand";
const sizeNum = (s: string) => parseInt(String(s).replace(/[^\d]/g, ""), 10) || 0;
const byName = (a: Item, b: Item) => (a.scent || "").localeCompare(b.scent || "") || sizeNum(a.size) - sizeNum(b.size);
const keyOf = (r: { barcode: string; size: string }) => `${r.barcode}__${r.size}`;

export function StockCountForm({ expected, branch, staleKeys = [] }:
  { expected: { barcode: string; scent: string; size: string; remaining: number; sold: number }[]; branch: string; staleKeys?: string[] }) {
  const router = useRouter();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const draftKey = `lp_count_${branch}_${today}`;
  const staleSet = useMemo(() => new Set(staleKeys), [staleKeys]);

  const base = useMemo<Item[]>(() =>
    expected.map((e) => ({ barcode: e.barcode, scent: e.scent, size: e.size, expected: Math.round(e.remaining), counted: String(Math.round(e.remaining)), changed: (Number(e.sold) || 0) > 0, verified: false })).sort(byName), [expected]);

  const [rows, setRows] = useState<Item[]>(base);
  const [blind, setBlind] = useState(false);            // นับแบบปิดตา: ซ่อนค่าระบบ ต้องกรอกเอง
  const [restored, setRestored] = useState(false);      // กู้ร่างมาแล้ว
  const [scanning, setScanning] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "moved" | "should">("all");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, start] = useTransition();

  // ── restore in-progress draft (per branch/day) ──────────────────────────────
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return; loaded.current = true;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (Array.isArray(d?.rows) && d.rows.length) { setRows(d.rows); setNote(d.note || ""); setBlind(!!d.blind); setRestored(true); }
    } catch {}
  }, [draftKey]);
  // persist draft on every change (cheap)
  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(draftKey, JSON.stringify({ v: 1, blind, note, rows })); } catch {}
  }, [rows, note, blind, draftKey]);
  const clearDraft = () => { try { localStorage.removeItem(draftKey); } catch {} };
  const startOver = () => { setRows(base); setNote(""); setRestored(false); clearDraft(); };

  // toggle blind mode — resets counts (blind → empty; normal → pre-filled) for untouched work
  const toggleBlind = (b: boolean) => {
    setBlind(b);
    setRows((rs) => rs.map((r) => ({ ...r, counted: b ? "" : String(r.expected), verified: false })));
  };

  // resolve scanned barcodes that aren't in the expected list (extra stock found)
  const [catalog, setCatalog] = useState<Map<string, any>>(new Map());
  useEffect(() => {
    fetch("/api/products/all", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : [])).then((rows: any[]) => setCatalog(new Map((rows || []).map((p) => [String(p.barcode), p])))).catch(() => {});
  }, []);

  const say = (m: string, persist = false) => { setFlash(m); if (!persist) setTimeout(() => setFlash((f) => (f === m ? null : f)), 1500); };
  // editing a row (type / +− / scan-confirm) marks it VERIFIED
  const editCount = (barcode: string, size: string, next: (n: number) => number) =>
    setRows((rs) => rs.map((r) => (r.barcode === barcode && r.size === size ? { ...r, counted: String(Math.max(0, next(Number(r.counted) || 0))), verified: true } : r)));

  const rowsRef = useRef(rows);
  useEffect(() => { rowsRef.current = rows; });
  const knownCodes = useMemo(() => new Set(catalog.keys()), [catalog]);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const locate = (code: string): ScanResult => {
    const c = String(code || "").trim();
    if (!c) return { ok: false, label: "-" };
    const ok = () => { beep("ok"); try { navigator.vibrate?.(30); } catch {} };
    const it = rowsRef.current.find((r) => r.barcode === c);
    if (it) {
      ok(); setActiveKey(keyOf(it));
      // normal mode: scanning confirms the pre-filled qty (mark verified). blind: just jump; they type.
      if (!blind) setRows((rs) => rs.map((r) => (keyOf(r) === keyOf(it) ? { ...r, verified: true } : r)));
      say(`${it.scent} ${it.size}`);
      return { ok: true, label: `${it.scent} ${it.size}`, sub: blind ? "กรอกจำนวน" : `ในระบบ ${it.expected}` };
    }
    const p = catalog.get(c);
    if (p) { ok(); setRows((rs) => [...rs, { barcode: c, scent: p.scent, size: p.size || "", expected: 0, counted: "1", changed: true, verified: true }]); setActiveKey(`${c}__${p.size || ""}`); say(`${p.scent} ${p.size} (นอกรายการ)`); return { ok: true, label: `${p.scent} ${p.size}`, sub: "นอกรายการ" }; }
    beep("error"); try { navigator.vibrate?.([60, 40, 60]); } catch {}
    say(`⚠ ไม่พบ ${c}`, true); return { ok: false, label: `ไม่พบ ${c}` };
  };
  useBarcodeScanner(scanning, locate);
  const onCameraScan = (code: string) => { locate(code); setScanning(false); };

  useEffect(() => {
    if (!activeKey || scanning) return;
    const el = document.getElementById(`cnt-${activeKey}`) as HTMLInputElement | null;
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = setTimeout(() => { el.focus(); el.select(); }, 220);
    return () => clearTimeout(t);
  }, [activeKey, scanning]);

  const counted = (r: Item) => Number(r.counted) || 0;
  const isDone = (r: Item) => r.verified && r.counted !== "";   // ยืนยันจริง = ลงมือ + มีตัวเลข
  const movedCount = useMemo(() => rows.filter((r) => r.changed).length, [rows]);
  const shouldCount = useMemo(() => rows.filter((r) => staleSet.has(`${r.scent}|${r.size}`)).length, [rows, staleSet]);
  const doneRows = useMemo(() => rows.filter(isDone), [rows]);
  const doneCount = doneRows.length;

  const list = useMemo(() => {
    const t = term.trim().toLowerCase();
    return rows
      .filter((r) => (filter === "all" || (filter === "moved" && r.changed) || (filter === "should" && staleSet.has(`${r.scent}|${r.size}`)))
        && (!t || r.scent?.toLowerCase().includes(t) || r.barcode?.toLowerCase().includes(t)))
      .sort(byName);
  }, [rows, term, filter, staleSet]);

  const short = doneRows.reduce((s, r) => s + Math.max(0, r.expected - counted(r)), 0);
  const over = doneRows.reduce((s, r) => s + Math.max(0, counted(r) - r.expected), 0);

  const submit = () => start(async () => {
    setErr(null);
    // submit ONLY physically-verified rows → the count reflects what was actually checked
    const lines = doneRows.map((r) => ({ barcode: r.barcode, scent: r.scent, size: r.size, expected: r.expected, counted: counted(r), verified: true }));
    const res = await submitStockCount(branch, lines, note);
    if (res.ok) { clearDraft(); router.push("/my"); } else setErr(res.error ?? "ส่งไม่สำเร็จ");
  });

  return (
    <div className="space-y-3 pb-24">
      {restored && (
        <div className="rounded-lg bg-brand-soft/60 border border-brand/30 px-3 py-2 text-xs text-brand-dark flex items-center gap-2">
          กู้ร่างที่นับค้างไว้แล้ว
          <button onClick={startOver} className="ml-auto underline font-medium">เริ่มนับใหม่</button>
        </div>
      )}

      {/* progress + controls */}
      <div className="rounded-xl border border-line bg-surface shadow-sm p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-ink shrink-0">ยืนยันแล้ว {doneCount}/{rows.length}</span>
          {(short > 0 || over > 0) && <span className="inline-flex items-center rounded bg-warn-soft px-1.5 py-0.5 text-[11px] font-medium text-warn-dark shrink-0">{short > 0 && `ขาด ${short}`}{short > 0 && over > 0 && " · "}{over > 0 && `เกิน ${over}`}</span>}
          {flash && <span className="text-xs text-brand-dark font-medium truncate">{flash}</span>}
          <button type="button" onClick={() => toggleBlind(!blind)} title="นับแบบปิดตา — ซ่อนจำนวนในระบบ ต้องกรอกเอง (แม่นกว่า)"
            className={`ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium border shrink-0 ${blind ? "bg-ink text-surface border-ink" : "bg-surface text-muted border-line"}`}>
            {blind ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} ปิดตา
          </button>
        </div>
        <div className="h-1.5 w-full rounded-full bg-line-soft overflow-hidden mb-2">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${rows.length ? Math.round((doneCount / rows.length) * 100) : 0}%` }} />
        </div>
        <p className="text-[11px] text-muted-soft mb-2">{blind ? "โหมดปิดตา: กรอกจำนวนที่นับได้จริง (ไม่เห็นเลขในระบบจนกรอกเสร็จ)" : "ช่องจำนวนดึงจากระบบให้แล้ว — สแกน/แก้เฉพาะที่นับได้ไม่ตรง (แตะแล้วนับเป็น “ยืนยัน”)"}</p>
        <div className="relative">
          <Search className="w-4 h-4 text-muted-soft absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="ค้นหากลิ่น / บาร์โค้ด…" className={inp + " w-full pl-8"} />
        </div>
        <div className="flex gap-2 mt-2">
          {([["all", `ทั้งหมด (${rows.length})`], ["moved", `เคลื่อนไหว (${movedCount})`], ["should", `ควรนับ (${shouldCount})`]] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setFilter(k)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium border transition-colors ${filter === k ? "bg-ink text-surface border-ink" : "bg-surface text-muted border-line hover:bg-canvas"}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* count rows */}
      <div className="rounded-xl border border-line bg-surface shadow-sm divide-y divide-line-soft">
        {list.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted">{!rows.length ? "ยังไม่มีสต๊อกให้นับ" : filter === "moved" ? "ไม่มีสินค้าที่มีความเคลื่อนไหว" : filter === "should" ? "ไม่มีรายการที่ควรนับ" : "ไม่พบสินค้าที่ค้นหา"}</div>
        ) : list.map((r) => {
          const done = isDone(r), c = counted(r), diff = c - r.expected;
          const badge = blind && !done ? null   // ซ่อนส่วนต่างในโหมดปิดตาจนกว่าจะกรอก
            : !done || diff === 0 ? null
            : diff < 0 ? <span className="text-danger text-[11px] font-medium">ขาด {Math.abs(diff)}</span>
            : <span className="text-warn-dark text-[11px] font-medium">เกิน {diff}</span>;
          return (
            <div key={keyOf(r)} className={`flex items-center gap-2 px-3 py-2 transition-colors ${activeKey === keyOf(r) ? "bg-brand-soft/50" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink truncate">
                  {done && <span className="text-success mr-1">✓</span>}{r.scent} <span className="text-muted text-xs">{r.size}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {!blind && <span className="inline-flex items-center rounded bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-muted tabular-nums">ในระบบ {r.expected}</span>}
                  {staleSet.has(`${r.scent}|${r.size}`) && <span className="text-[10px] text-warn">ควรนับ</span>}
                  {badge}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => editCount(r.barcode, r.size, (n) => n - 1)} className="p-1.5 rounded-lg border border-line text-muted hover:bg-canvas"><Minus className="w-4 h-4" /></button>
                <input id={`cnt-${keyOf(r)}`} value={r.counted} inputMode="numeric" placeholder={blind ? "?" : "—"} onFocus={(e) => e.target.select()}
                  onChange={(e) => setRows((rs) => rs.map((x) => (x.barcode === r.barcode && x.size === r.size ? { ...x, counted: e.target.value.replace(/[^\d]/g, ""), verified: true } : x)))}
                  className={inp + ` w-14 text-center tabular-nums ${done && diff !== 0 ? (diff < 0 ? "border-danger text-danger" : "border-warn text-warn-dark") : ""} ${!done && blind ? "border-warn/50" : ""}`} />
                <button type="button" onClick={() => editCount(r.barcode, r.size, (n) => n + 1)} className="p-1.5 rounded-lg border border-line text-muted hover:bg-canvas"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* summary + submit */}
      <div className="rounded-xl border border-line bg-surface shadow-sm p-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">ส่วนต่างรวม (เฉพาะที่ยืนยัน)</span>
          <span className="font-medium">{doneCount === 0 ? <span className="text-muted-soft">—</span> : short === 0 && over === 0 ? <span className="text-success">ตรงทั้งหมด</span> : <>{short > 0 && <span className="text-danger">ขาด {short}</span>}{short > 0 && over > 0 && " · "}{over > 0 && <span className="text-warn-dark">เกิน {over}</span>}</>}</span>
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุ (ถ้ามี)" className={inp + " w-full"} />
        {err && <div className="text-xs text-danger">{err}</div>}
        <button onClick={submit} disabled={saving || doneCount === 0} className="btn btn-brand w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />} ยืนยันผลนับ {doneCount > 0 ? `(${doneCount} รายการ)` : ""}
        </button>
        <p className="text-[11px] text-muted-soft text-center">ส่งเฉพาะรายการที่นับจริง · ระบบปรับสต๊อกหลังแอดมินอนุมัติ</p>
      </div>

      {!scanning && (
        <button type="button" onClick={() => setScanning(true)}
          className="no-print fixed bottom-6 right-5 z-40 inline-flex items-center gap-2 pl-4 pr-5 py-3.5 rounded-full bg-brand text-white shadow-lg font-semibold hover:bg-brand-dark active:scale-95 transition">
          <ScanLine className="w-5 h-5" /> สแกน
        </button>
      )}
      {scanning && <BarcodeScanner knownCodes={knownCodes} onDetected={onCameraScan} onClose={() => setScanning(false)} />}
    </div>
  );
}
