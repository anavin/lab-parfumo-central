"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ScanLine, Check, X, Loader2 } from "lucide-react";
import { branchName } from "@/lib/branches";
import { addSkuUnit } from "@/lib/actions/sku";
import { BarcodeScanner } from "@/components/BarcodeScanner";

// เลือกสินค้า แล้วสแกน/พิมพ์ SKU ทีละขวด → ลงทะเบียนเข้าสต๊อก (in_stock)
// ใช้ได้ทั้งหน้า /stock (แอดมิน) และหน้านับสต๊อก (เก็บ SKU ระหว่างนับ)
export function SkuAddPanel({ branch, defaultOpen = false }: { branch: string | null; defaultOpen?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
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
    if (r.ok) { setMsg({ ok: true, text: `เก็บ ${code} → ${prod.scent} ${prod.size}` }); setSku(""); setAdded((a) => a + 1); router.refresh(); setTimeout(() => skuRef.current?.focus(), 50); return { ok: true, label: prod.scent, sub: code }; }
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
        <span className="text-sm font-semibold text-ink flex items-center gap-1.5"><Plus className="w-4 h-4 text-brand" /> เก็บ SKU เข้าสต๊อก {branch ? `· ${branchName(branch)}` : ""}</span>
        {!defaultOpen && <button onClick={() => setOpen(false)} className="text-muted hover:text-ink"><X className="w-4 h-4" /></button>}
      </div>
      {!branch ? (
        <div className="text-sm text-muted py-2">เลือกสาขาก่อน จึงจะเก็บ SKU ได้ — กัน SKU ไปผิดสาขา</div>
      ) : (
        <>
          <div className="relative mb-2">
            <input value={query} onChange={(e) => search(e.target.value)} placeholder="1) ค้นหาสินค้า (กลิ่น / บาร์โค้ด)"
              className="w-full h-[42px] border border-line rounded-lg px-3 text-sm bg-surface focus:outline-none focus:border-brand" />
            {acOpen && res.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-44 overflow-auto bg-surface border border-line rounded-lg shadow-lg text-sm">
                {res.map((p: any) => <button key={p.id} onMouseDown={() => pick(p)} className="block w-full text-left px-3 py-2 hover:bg-brand-soft"><b>{p.scent}</b> {p.size} <span className="text-muted">· {p.barcode}</span></button>)}
              </div>
            )}
          </div>
          {prod && (
            <>
              <div className="text-xs text-muted mb-1">สินค้า: <b className="text-ink">{prod.scent}</b> {prod.size} — 2) ยิงสติกเกอร์ SKU ทีละขวด</div>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setScanning(true)} className="shrink-0 h-[42px] px-3 inline-flex items-center gap-1.5 rounded-lg bg-brand text-white text-sm font-medium"><ScanLine className="w-4 h-4" /> สแกน</button>
                <input ref={skuRef} value={sku} onChange={(e) => { setSku(e.target.value); setMsg(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(sku); } }} disabled={busy}
                  placeholder="สแกน/พิมพ์รหัส SKU แล้ว Enter" className="flex-1 min-w-0 h-[42px] border border-line rounded-lg px-2.5 text-sm font-mono bg-surface focus:outline-none focus:border-brand" />
                <button onClick={() => add(sku)} disabled={busy || !sku.trim()} className="shrink-0 h-[42px] px-3 rounded-lg bg-brand-dark text-white text-sm font-medium disabled:opacity-40">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "เก็บ"}</button>
              </div>
            </>
          )}
          {msg && <div className={"text-[12px] mt-1.5 flex items-center gap-1 " + (msg.ok ? "text-success" : "text-danger")}>{msg.ok ? <Check className="w-3.5 h-3.5" /> : null}{msg.text}</div>}
          {added > 0 && <div className="text-[11px] text-muted mt-1">เก็บแล้ว {added} SKU ในรอบนี้</div>}
          {scanning && <BarcodeScanner continuous knownCodes={null} onDetected={(c) => add(c)} onClose={() => setScanning(false)} />}
        </>
      )}
    </div>
  );
}
