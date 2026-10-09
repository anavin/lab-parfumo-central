"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ScanLine, Check, X, Loader2, Search, Boxes, HelpCircle } from "lucide-react";
import { branchName } from "@/lib/branches";
import { addSkuUnit } from "@/lib/actions/sku";
import { beep } from "@/lib/feedback";
import { useBarcodeScanner } from "@/lib/useBarcodeScanner";
import { BarcodeScanner, type ScanResult } from "@/components/BarcodeScanner";

type Prod = { barcode: string; scent: string; size: string };

// เก็บ SKU เข้าสต๊อกแบบ "สแกนล้วน": ยิงบาร์โค้ดสินค้า = ตั้งกลิ่นปัจจุบัน, ยิงสติกเกอร์ SKU = เก็บเข้ากลิ่นนั้น
// ไม่ต้องพิมพ์/เลือกเองก่อน (มีช่องค้นหา+พิมพ์ไว้เป็นทางสำรอง) — ใช้ทั้งหน้า /stock และหน้านับสต๊อก
export function SkuAddPanel({ branch, defaultOpen = false }: { branch: string | null; defaultOpen?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [prod, setProd] = useState<Prod | null>(null);
  const prodRef = useRef<Prod | null>(null);   // latest product for async scan handlers (rapid scans)
  const [query, setQuery] = useState("");
  const [res, setRes] = useState<any[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [total, setTotal] = useState(0);        // SKUs collected this session
  const [prodCount, setProdCount] = useState(0); // collected for the current product
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setProduct = (p: Prod | null) => { prodRef.current = p; setProd(p); setProdCount(0); setQuery(p ? `${p.scent} ${p.size}` : ""); setAcOpen(false); };

  // one pipeline for every scan/entry: a product barcode SWITCHES the current product;
  // anything else is treated as a SKU sticker and enrolled under the current product.
  const handle = async (raw: string, fromScan = true): Promise<ScanResult> => {
    const code = String(raw || "").trim();
    if (!code || !branch) return { ok: false, label: "", sub: "" };
    setBusy(true);
    try {
      const p = await fetch(`/api/products/barcode?code=${encodeURIComponent(code)}`, { headers: { accept: "application/json" } })
        .then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (p && p.barcode) {
        setProduct({ barcode: p.barcode, scent: p.scent, size: p.size || "" });
        const r: ScanResult = { ok: true, title: "เลือกกลิ่นแล้ว", label: `${p.scent} ${p.size || ""}`.trim(), sub: "ยิงสติกเกอร์ SKU ของขวดนี้ได้เลย" };
        setMsg(r); return r;
      }
      const cur = prodRef.current;
      if (!cur) { const r: ScanResult = { ok: false, title: "ยังไม่ได้เลือกกลิ่น", label: `SKU ${code}`, sub: "ยิงบาร์โค้ดสินค้าก่อน 1 ครั้ง" }; setMsg(r); return r; }
      // กันพลาด: ยิงโค้ดตัวเลขล้วนแบบบาร์โค้ด (8+ หลัก) ที่ไม่พบสินค้า → น่าจะเป็นบาร์โค้ดสินค้าที่ไม่มีในระบบ
      // ไม่ใช่ SKU รายขวด → ไม่เก็บ (กัน SKU ขยะ). ถ้าเป็น SKU ตัวเลขจริง ให้พิมพ์เองที่ช่องด้านล่าง
      if (fromScan && /^\d{8,}$/.test(code)) {
        const r: ScanResult = { ok: false, title: "ไม่เก็บ (เหมือนบาร์โค้ดสินค้า)", label: code, sub: "ตัวเลขล้วนแบบบาร์โค้ด แต่ไม่พบสินค้า — ถ้าเป็น SKU จริงให้พิมพ์เองที่ช่องด้านล่าง" };
        setMsg(r); return r;
      }
      const added = await addSkuUnit({ sku: code, barcode: cur.barcode, branch });
      if (added.ok) {
        setTotal((t) => t + 1); setProdCount((c) => c + 1); setManual(""); router.refresh();
        const r: ScanResult = { ok: true, title: "เก็บ SKU แล้ว", label: cur.scent, sub: code }; setMsg(r); return r;
      }
      const r: ScanResult = { ok: false, title: "เก็บไม่ได้", label: `SKU ${code}`, sub: added.error }; setMsg(r); return r;
    } finally { setBusy(false); }
  };

  // hardware (bluetooth/USB) scanner: live while the panel is open
  useBarcodeScanner(open && !!branch, (code) => {
    handle(code).then((r) => { beep(r.ok ? "ok" : "error"); try { navigator.vibrate?.(r.ok ? 40 : [60, 40, 60]); } catch {} });
  });

  const search = (v: string) => {
    setQuery(v);
    if (timer.current) clearTimeout(timer.current);
    const t = v.trim();
    if (!t) { setAcOpen(false); setRes([]); return; }
    timer.current = setTimeout(() => {
      fetch(`/api/products/search?q=${encodeURIComponent(t)}`, { headers: { accept: "application/json" } })
        .then((r) => (r.ok ? r.json() : [])).then((r) => { setRes(Array.isArray(r) ? r : []); setAcOpen(true); })
        .catch(() => { setRes([]); setAcOpen(true); });
    }, 250);
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
        <span className="text-sm font-semibold text-ink flex items-center gap-1.5"><Boxes className="w-4 h-4 text-brand" /> เก็บ SKU เข้าสต๊อก {branch ? `· ${branchName(branch)}` : ""}</span>
        {!defaultOpen && <button onClick={() => setOpen(false)} className="text-muted hover:text-ink"><X className="w-4 h-4" /></button>}
      </div>

      {!branch ? (
        <div className="text-sm text-muted py-2">เลือกสาขาก่อน จึงจะเก็บ SKU ได้ — กัน SKU ไปผิดสาขา</div>
      ) : (
        <>
          {/* current product banner */}
          <div className={"rounded-lg px-3 py-2.5 mb-2 border " + (prod ? "border-success/40 bg-success-soft/40" : "border-line bg-surface")}>
            {prod ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-muted">กลิ่นปัจจุบัน</div>
                  <div className="text-base font-semibold text-ink leading-tight">{prod.scent} <span className="text-muted font-normal">{prod.size}</span></div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-muted">เก็บกลิ่นนี้</div>
                  <div className="text-xl font-bold tabular-nums text-success">{prodCount}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted">ยังไม่ได้เลือกกลิ่น — <b className="text-ink">ยิงบาร์โค้ดสินค้า</b> 1 ครั้งเพื่อเลือกกลิ่น แล้วยิงสติกเกอร์ SKU ทีละขวด</div>
            )}
          </div>

          {/* big scan button */}
          <button onClick={() => setScanning(true)} className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-white text-base font-medium active:scale-95 mb-2">
            <ScanLine className="w-5 h-5" /> สแกน (บาร์โค้ดสินค้า / สติกเกอร์ SKU)
          </button>

          {/* last-scan feedback */}
          {msg && (
            <div className={"text-sm rounded-lg px-3 py-2 mb-2 flex items-start gap-1.5 " + (msg.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
              {msg.ok ? <Check className="w-4 h-4 mt-0.5 shrink-0" /> : <HelpCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              <span><b>{msg.label}</b>{msg.sub ? ` · ${msg.sub}` : ""}</span>
            </div>
          )}

          {/* fallbacks: search product by name, or type a SKU */}
          <details className="rounded-lg border border-line bg-surface">
            <summary className="px-3 py-2 text-xs text-muted cursor-pointer select-none">พิมพ์เอง (ถ้าสติกเกอร์สแกนไม่ติด)</summary>
            <div className="px-3 pb-3 pt-1 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input value={query} onChange={(e) => search(e.target.value)} placeholder="ค้นหากลิ่น / บาร์โค้ด เพื่อเลือกกลิ่น"
                  className="w-full h-[40px] border border-line rounded-lg pl-8 pr-3 text-sm bg-surface focus:outline-none focus:border-brand" />
                {acOpen && res.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full max-h-40 overflow-auto bg-surface border border-line rounded-lg shadow-lg text-sm">
                    {res.map((p: any) => <button key={p.id} onMouseDown={() => setProduct({ barcode: p.barcode, scent: p.scent, size: p.size })} className="block w-full text-left px-3 py-2 hover:bg-brand-soft"><b>{p.scent}</b> {p.size} <span className="text-muted">· {p.barcode}</span></button>)}
                  </div>
                )}
              </div>
              <div className="flex gap-1.5">
                <input value={manual} onChange={(e) => setManual(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handle(manual, false); } }} disabled={busy || !prod}
                  placeholder={prod ? "พิมพ์รหัส SKU แล้ว Enter" : "เลือกกลิ่นก่อน"} className="flex-1 min-w-0 h-[40px] border border-line rounded-lg px-2.5 text-sm font-mono bg-surface focus:outline-none focus:border-brand disabled:opacity-50" />
                <button onClick={() => handle(manual, false)} disabled={busy || !prod || !manual.trim()} className="shrink-0 h-[40px] px-3 rounded-lg bg-brand-dark text-white text-sm font-medium disabled:opacity-40">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "เก็บ"}</button>
              </div>
            </div>
          </details>

          {total > 0 && <div className="text-[11px] text-muted mt-2">เก็บทั้งหมดรอบนี้ {total} SKU</div>}

          {scanning && <BarcodeScanner continuous knownCodes={null} onDetected={(c) => handle(c)} onClose={() => setScanning(false)} />}
        </>
      )}
    </div>
  );
}
