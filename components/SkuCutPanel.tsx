"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Search, Check, Loader2, PackageMinus, ChevronDown } from "lucide-react";
import { num } from "@/lib/format";
import { markSkusSold } from "@/lib/actions/sku";
import { beep } from "@/lib/feedback";
import { useBarcodeScanner } from "@/lib/useBarcodeScanner";
import { BarcodeScanner } from "@/components/BarcodeScanner";

type U = { sku: string; scent: string | null; size: string | null; barcode: string | null };
const norm = (s: string) => s.toUpperCase().replace(/\s+/g, "");

// ตัด SKU ที่ขายออก — รายชิ้น (serial) เท่านั้น ไม่แตะยอดคงเหลือ (บิลขายตัดยอดไปแล้ว)
// ไว้ไล่เก็บ SKU ของบิลที่ขายโดยไม่ได้สแกน: สแกน/เลือก SKU ที่ขายไป → mark sold
export function SkuCutPanel({ skus, branch }: { skus: U[]; branch: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [qText, setQText] = useState("");
  const [manual, setManual] = useState("");
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cut, setCut] = useState<Set<string>>(new Set());   // normalized keys cut this session
  const [msg, setMsg] = useState<{ ok: boolean; warn?: boolean; text: string } | null>(null);

  const available = useMemo(() => skus.filter((u) => !cut.has(norm(u.sku))), [skus, cut]);

  const cutOne = async (raw: string): Promise<boolean> => {
    const code = String(raw || "").trim();
    if (!code || !branch) return false;
    if (cut.has(norm(code))) { setMsg({ ok: false, warn: true, text: `ตัดไปแล้ว: ${code}` }); return false; }
    setBusy(true);
    const r = await markSkusSold([code], branch); setBusy(false);
    if (r.ok && (r.sold || 0) > 0) { setCut((p) => new Set(p).add(norm(code))); setManual(""); setMsg({ ok: true, text: `ตัดออก: ${code} — ตัดผิดคืนได้ที่แท็บ SKU` }); router.refresh(); return true; }
    setMsg({ ok: false, warn: true, text: `ตัดไม่ได้: ${code} — ไม่อยู่ในสต็อก (ขายแล้ว/ไม่พบ/คนละสาขา)` }); return false;
  };

  useBarcodeScanner(open && !!branch, (code) => { cutOne(code).then((ok) => { beep(ok ? "ok" : "error"); try { navigator.vibrate?.(ok ? 40 : [60, 40, 60]); } catch {} }); });

  const shown = useMemo(() => {
    const t = qText.trim().toLowerCase();
    if (!t) return [];
    return available.filter((u) => (u.scent || "").toLowerCase().includes(t) || u.sku.toLowerCase().includes(t) || (u.barcode || "").includes(t)).slice(0, 100);
  }, [available, qText]);

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-4 py-3 text-left">
        <PackageMinus className="w-4 h-4 text-brand shrink-0" />
        <span className="font-semibold text-ink">ตัด SKU ที่ขายออก</span>
        <span className="text-sm text-muted">· รายชิ้น ไม่แตะยอดคงเหลือ · เหลือ {num(available.length)}</span>
        <ChevronDown className={"w-4 h-4 text-muted ml-auto transition-transform " + (open ? "rotate-180" : "")} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-[11px] text-muted">ไว้ตัด SKU ของบิลที่ขาย<b className="text-ink">โดยไม่ได้สแกน SKU</b> — บิลตัดยอดไปแล้ว ตรงนี้แค่ทำให้ serial ตรง (ไม่ลดยอดซ้ำ) · <b className="text-ink">ตัดผิด?</b> คืนได้ที่แท็บ SKU → ปุ่ม “คืนสต๊อก”</p>

          <div className="flex gap-1.5">
            <button onClick={() => setScanning(true)} disabled={!branch}
              className="shrink-0 h-[42px] px-3 inline-flex items-center gap-1.5 rounded-lg bg-brand text-white text-sm font-medium active:scale-95 disabled:opacity-50">
              <ScanLine className="w-4 h-4" /> สแกนตัด
            </button>
            <input value={manual} onChange={(e) => setManual(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); cutOne(manual); } }}
              placeholder="หรือพิมพ์รหัส SKU แล้ว Enter" className="flex-1 min-w-0 h-[42px] border border-line rounded-lg px-2.5 text-sm font-mono bg-surface focus:outline-none focus:border-brand" />
            <button onClick={() => cutOne(manual)} disabled={busy || !manual.trim()} className="shrink-0 h-[42px] px-3 rounded-lg bg-brand-dark text-white text-sm font-medium disabled:opacity-40">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "ตัด"}</button>
          </div>

          {msg && <div className={"text-sm rounded-lg px-3 py-2 " + (msg.ok ? "bg-success-soft text-success" : "bg-warn-soft text-warn")}>{msg.text}</div>}
          {cut.size > 0 && <div className="text-[12px] text-muted">ตัดออกรอบนี้ <b className="text-ink">{num(cut.size)}</b> ชิ้น</div>}

          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="ค้นหากลิ่น / SKU เพื่อเลือกตัด"
              className="w-full h-[40px] border border-line rounded-lg pl-8 pr-3 text-sm bg-surface focus:outline-none focus:border-brand" />
          </div>

          {qText.trim() && (
            <div className="rounded-lg border border-line divide-y divide-line-soft max-h-80 overflow-auto">
              {shown.map((u) => (
                <div key={u.sku} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="text-ink truncate">{u.scent || u.barcode} <span className="text-muted">{u.size || ""}</span></div>
                    <div className="font-mono text-[11px] text-muted">{u.sku}</div>
                  </div>
                  <button onClick={() => cutOne(u.sku)} disabled={busy} className="shrink-0 inline-flex items-center gap-1 text-[12px] font-medium text-danger border border-danger/40 rounded-lg px-2.5 py-1 hover:bg-danger-soft disabled:opacity-50">
                    <PackageMinus className="w-3.5 h-3.5" /> ตัด
                  </button>
                </div>
              ))}
              {shown.length === 0 && <div className="px-3 py-6 text-center text-sm text-muted">ไม่พบ SKU ที่ตรง (ที่ยังอยู่ในสต็อก)</div>}
            </div>
          )}

          {scanning && <BarcodeScanner continuous knownCodes={null} onDetected={(c) => { void cutOne(c); }} onClose={() => setScanning(false)} />}
        </div>
      )}
    </div>
  );
}
