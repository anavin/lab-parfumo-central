"use client";
import { useMemo, useState } from "react";
import { ScanLine, Check, HelpCircle, PackageSearch } from "lucide-react";
import { beep } from "@/lib/feedback";
import { useBarcodeScanner } from "@/lib/useBarcodeScanner";
import { BarcodeScanner, type ScanResult } from "@/components/BarcodeScanner";
import { num } from "@/lib/format";

type Unit = { sku: string; barcode: string | null; scent: string | null; size: string | null };
const norm = (s: string) => s.toUpperCase().replace(/\s+/g, "");

// นับสต๊อกแบบรายชิ้น: สแกน SKU ทุกขวดบนชั้น → รู้ว่าขวดไหนเจอ/ขวดไหนหาย (เทียบกับ in_stock ในระบบ)
// รายงานเฉยๆ ไม่แก้สถานะ — ของที่สแกนไม่เจอ = ของหาย/วางผิดที่ ให้คนไปตรวจเอง
export function SkuCountMode({ units }: { units: Unit[] }) {
  const [found, setFound] = useState<Set<string>>(new Set());   // normalized sku keys scanned
  const [unknown, setUnknown] = useState<string[]>([]);         // scanned but not an in-stock unit here
  const [scanning, setScanning] = useState(false);
  const [last, setLast] = useState<ScanResult | null>(null);
  const [manual, setManual] = useState("");

  // normalized key → unit; and product groups
  const { byKey, groups } = useMemo(() => {
    const byKey = new Map<string, Unit>();
    const g = new Map<string, { scent: string; size: string; units: Unit[] }>();
    for (const u of units) {
      byKey.set(norm(u.sku), u);
      const k = `${u.barcode || ""}|${u.scent || ""}|${u.size || ""}`;
      let row = g.get(k);
      if (!row) { row = { scent: u.scent || "-", size: u.size || "", units: [] }; g.set(k, row); }
      row.units.push(u);
    }
    const groups = [...g.values()].sort((a, b) => a.scent.localeCompare(b.scent, "th") || a.size.localeCompare(b.size));
    return { byKey, groups };
  }, [units]);

  const take = (raw: string): ScanResult => {
    const code = String(raw || "").trim();
    if (!code) return { ok: false, label: "", sub: "" };
    const key = norm(code);
    const u = byKey.get(key);
    if (!u) {
      setUnknown((x) => (x.includes(code) ? x : [...x, code]));
      return { ok: false, title: "นอกระบบ/คนละสาขา", label: `SKU ${code}`, sub: "ไม่ใช่ของสาขานี้ หรือขายไปแล้ว" };
    }
    if (found.has(key)) return { ok: false, title: "สแกนซ้ำแล้ว", label: u.scent || code, sub: `${u.size || ""}`.trim() };
    setFound((s) => new Set(s).add(key));
    return { ok: true, title: "เจอแล้ว", label: `${u.scent || ""} ${u.size || ""}`.trim(), sub: "" };
  };
  const onManual = () => { const r = take(manual); if (r.ok) setManual(""); setLast(r); };

  useBarcodeScanner(scanning, (code) => {
    const r = take(code);
    beep(r.ok ? "ok" : "error");
    try { navigator.vibrate?.(r.ok ? 40 : [60, 40, 60]); } catch {}
    setLast(r);
  });

  const foundN = found.size;
  const missingN = units.length - foundN;

  return (
    <div className="space-y-3">
      {/* summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-success-soft/50 p-2.5">
          <div className="text-[11px] text-success">สแกนเจอ</div>
          <div className="text-xl font-bold tabular-nums text-success">{num(foundN)}</div>
        </div>
        <div className="rounded-xl bg-danger-soft/50 p-2.5">
          <div className="text-[11px] text-danger">ยังขาด</div>
          <div className="text-xl font-bold tabular-nums text-danger">{num(missingN)}</div>
        </div>
        <div className="rounded-xl bg-warn-soft/50 p-2.5">
          <div className="text-[11px] text-warn">นอกระบบ</div>
          <div className="text-xl font-bold tabular-nums text-warn">{num(unknown.length)}</div>
        </div>
      </div>

      {/* scan controls */}
      <button onClick={() => setScanning(true)} className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-white text-base font-medium active:scale-95">
        <ScanLine className="w-5 h-5" /> สแกน SKU ทีละขวด
      </button>
      <div className="flex gap-1.5">
        <input value={manual} onChange={(e) => setManual(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onManual(); } }}
          placeholder="หรือพิมพ์รหัส SKU แล้ว Enter" className="flex-1 min-w-0 h-11 border border-line rounded-lg px-2.5 text-sm font-mono bg-surface focus:outline-none focus:border-brand" />
        <button onClick={onManual} disabled={!manual.trim()} className="shrink-0 h-11 px-4 rounded-lg bg-brand-dark text-white text-sm font-medium disabled:opacity-40">เพิ่ม</button>
      </div>
      {last && (
        <div className={"text-sm rounded-lg px-3 py-2 " + (last.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
          {last.ok ? <Check className="w-4 h-4 inline mr-1" /> : <HelpCircle className="w-4 h-4 inline mr-1" />}
          <b>{last.label}</b> · {last.sub}
        </div>
      )}

      {/* unknown scans */}
      {unknown.length > 0 && (
        <div className="rounded-xl border border-warn/40 bg-warn-soft/40 p-3">
          <div className="text-sm font-medium text-warn mb-1">สแกนนอกระบบ {unknown.length} รายการ (ไม่ใช่ของสาขานี้/ขายไปแล้ว)</div>
          <div className="flex flex-wrap gap-1">{unknown.map((u) => <span key={u} className="font-mono text-[11px] bg-surface border border-line rounded px-1.5 py-0.5">{u}</span>)}</div>
        </div>
      )}

      {/* per-product reconciliation */}
      {units.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted">
          <PackageSearch className="w-6 h-6 mx-auto mb-2 text-muted-soft" />
          สาขานี้ยังไม่มี SKU ในสต๊อก — ใช้โหมด “จำนวน” นับตามปกติ
        </div>
      ) : groups.map((g) => {
        const total = g.units.length;
        const fn = g.units.filter((u) => found.has(norm(u.sku))).length;
        const done = fn === total;
        return (
          <div key={`${g.scent}|${g.size}`} className={"rounded-xl border p-3 " + (done ? "border-success/40 bg-success-soft/20" : "border-line bg-surface")}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">{g.scent} <span className="text-muted font-normal">{g.size}</span></span>
              <span className={"text-sm font-semibold tabular-nums " + (done ? "text-success" : "text-danger")}>{done ? <><Check className="w-4 h-4 inline" /> ครบ</> : `${fn}/${total}`}</span>
            </div>
            {!done && (
              <div className="mt-2 flex flex-wrap gap-1">
                {g.units.map((u) => {
                  const ok = found.has(norm(u.sku));
                  return <span key={u.sku} className={"font-mono text-[11px] rounded px-1.5 py-0.5 " + (ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>{u.sku}</span>;
                })}
              </div>
            )}
          </div>
        );
      })}

      {scanning && <BarcodeScanner continuous knownCodes={null} onDetected={async (c) => take(c)} onClose={() => setScanning(false)} />}
    </div>
  );
}
