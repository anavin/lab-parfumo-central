"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GitCompare, Check, Search, Download, Plus, Wrench, PackageX, Loader2 } from "lucide-react";
import { num } from "@/lib/format";
import { branchName } from "@/lib/branches";
import { downloadCsv } from "@/lib/csv";
import { addSkuUnit, updateSkuUnit } from "@/lib/actions/sku";
import type { ShelfCaptureRow, SkuUnitRow } from "@/lib/queries";

const norm = (s: string) => s.toUpperCase().replace(/\s+/g, "");
type Kind = "match" | "wrong" | "new" | "missing";
type Row = { sku: string; scent: string; size: string; kind: Kind; barcode: string | null; sysBarcode: string | null };
type Filter = "all" | Kind;

// เทียบ "ข้อมูลใหม่ที่เก็บจากหน้าสาขา" (shelf_capture) กับ "ระบบ" (sku_units in_stock)
// ตรง = เก็บเจอ+ระบบมี ถูกสินค้า · สติกเกอร์ผิด = ระบบผูกคนละสินค้า · ใหม่ = เก็บได้แต่ระบบไม่มี · ไม่เจอ = ระบบมีแต่ไม่ได้เก็บ
// จัดการได้ในที่เดียว: ใหม่ → เพิ่มเข้าระบบ · สติกเกอร์ผิด → แก้ให้ตรง · ไม่เจอ → ทำเครื่องหมายของหาย
export function CaptureCompare({ captures, skus, branch }: { captures: ShelfCaptureRow[]; skus: SkuUnitRow[]; branch: string | null }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [qText, setQText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);   // sku currently being acted on
  const [err, setErr] = useState<string | null>(null);

  const { rows, stats } = useMemo(() => {
    const sysByKey = new Map<string, string | null>();   // normalized sku → system barcode (in_stock only)
    for (const u of skus) if (u.status === "in_stock") sysByKey.set(norm(u.sku), u.barcode);
    const capByKey = new Map<string, ShelfCaptureRow>();
    for (const c of captures) capByKey.set(norm(c.sku), c);

    const rows: Row[] = [];
    for (const [key, c] of capByKey) {
      if (sysByKey.has(key)) {
        const sysBc = sysByKey.get(key) ?? null;
        rows.push({ sku: c.sku, scent: c.scent || c.barcode || "-", size: c.size || "", barcode: c.barcode, sysBarcode: sysBc, kind: (sysBc && c.barcode && sysBc !== c.barcode) ? "wrong" : "match" });
      } else {
        rows.push({ sku: c.sku, scent: c.scent || c.barcode || "-", size: c.size || "", barcode: c.barcode, sysBarcode: null, kind: "new" });
      }
    }
    // system in_stock SKUs that were NOT captured on the shelf
    for (const u of skus) if (u.status === "in_stock" && !capByKey.has(norm(u.sku))) {
      rows.push({ sku: u.sku, scent: u.scent || u.barcode || "-", size: u.size || "", barcode: null, sysBarcode: u.barcode, kind: "missing" });
    }
    rows.sort((a, b) => a.scent.localeCompare(b.scent, "th") || a.sku.localeCompare(b.sku));
    const stats = { match: 0, wrong: 0, new: 0, missing: 0, captured: captures.length };
    for (const r of rows) stats[r.kind]++;
    return { rows, stats };
  }, [captures, skus]);

  const shown = useMemo(() => {
    const t = qText.trim().toLowerCase();
    return rows.filter((r) => (filter === "all" || r.kind === filter) && (!t || r.scent.toLowerCase().includes(t) || r.sku.toLowerCase().includes(t)));
  }, [rows, filter, qText]);

  const run = async (sku: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(sku); setErr(null);
    const r = await fn(); setBusy(null);
    if (r.ok) router.refresh(); else setErr(r.error ?? "ทำรายการไม่สำเร็จ");
  };
  // ใหม่ → ลงทะเบียน SKU เข้าระบบ (in_stock) ที่สาขานี้
  const enroll = (r: Row) => { if (!branch) { setErr("เลือกสาขาก่อน (บนสุดของหน้า) จึงจะเพิ่มเข้าระบบได้"); return; } if (!r.barcode) { setErr("รายการนี้ไม่มีบาร์โค้ด เพิ่มเข้าระบบไม่ได้"); return; } run(r.sku, () => addSkuUnit({ sku: r.sku, barcode: r.barcode!, branch })); };
  // สติกเกอร์ผิด → ชี้ SKU ในระบบไปที่สินค้าที่เก็บจริง (อัปเดตบาร์โค้ด + เคลียร์ธง)
  const fix = (r: Row) => { if (!r.barcode) return; if (!confirm(`แก้ SKU ${r.sku} ให้ชี้ไปสินค้าตามที่เก็บจริง?`)) return; run(r.sku, () => updateSkuUnit({ sku: r.sku, barcode: r.barcode! })); };
  // ไม่เจอบนชั้น → ทำเครื่องหมายของหาย (status=lost) — เป็นการติดตามเท่านั้น ไม่กระทบสต๊อกขาย
  const lost = (r: Row) => { if (!confirm(`ทำเครื่องหมาย "ของหาย" ให้ ${r.sku}?\n(เป็นการติดตามเท่านั้น ไม่ตัดสต๊อกขายอัตโนมัติ)`)) return; run(r.sku, () => updateSkuUnit({ sku: r.sku, status: "lost" })); };

  const exportCsv = () => {
    const out: (string | number | null)[][] = [["SKU", "กลิ่น", "ขนาด", "สถานะเทียบ", "บาร์โค้ดที่เก็บ", "บาร์โค้ดในระบบ"]];
    for (const r of rows) out.push([r.sku, r.scent, r.size, meta[r.kind].label, r.barcode || "", r.sysBarcode || ""]);
    const tag = (branch ? branchName(branch) : "all").replace(/\s+/g, "");
    downloadCsv(`capture-compare-${tag}-${new Date().toISOString().slice(0, 10)}.csv`, out);
  };

  const meta: Record<Kind, { label: string; cls: string }> = {
    match: { label: "ตรง", cls: "bg-success-soft text-success" },
    wrong: { label: "สติกเกอร์ผิดขวด", cls: "bg-danger-soft text-danger" },
    new: { label: "ใหม่ (ไม่มีในระบบ)", cls: "bg-warn-soft text-warn" },
    missing: { label: "ไม่เจอบนชั้น", cls: "bg-canvas text-muted border border-line" },
  };
  const Pill = ({ id, label, n }: { id: Filter; label: string; n: number }) => (
    <button onClick={() => setFilter(id)} className={"px-3 py-1.5 text-sm font-medium rounded-lg border transition " + (filter === id ? "bg-brand text-white border-brand" : "text-muted border-line hover:bg-canvas")}>{label} <span className="tabular-nums">{num(n)}</span></button>
  );

  const Action = ({ r }: { r: Row }) => {
    if (busy === r.sku) return <Loader2 className="w-4 h-4 animate-spin text-muted inline" />;
    if (r.kind === "new") return <button onClick={() => enroll(r)} className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-dark border border-brand/40 rounded-lg px-2 py-1 hover:bg-brand-soft"><Plus className="w-3.5 h-3.5" /> เพิ่มเข้าระบบ</button>;
    if (r.kind === "wrong") return <button onClick={() => fix(r)} className="inline-flex items-center gap-1 text-[12px] font-medium text-danger border border-danger/40 rounded-lg px-2 py-1 hover:bg-danger-soft"><Wrench className="w-3.5 h-3.5" /> แก้ให้ตรง</button>;
    if (r.kind === "missing") return <button onClick={() => lost(r)} className="inline-flex items-center gap-1 text-[12px] font-medium text-muted border border-line rounded-lg px-2 py-1 hover:bg-canvas"><PackageX className="w-3.5 h-3.5" /> ของหาย</button>;
    return <span className="text-[11px] text-success inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> ตรง</span>;
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm text-muted">
        <GitCompare className="w-4 h-4 text-brand" />
        เทียบข้อมูลใหม่ ↔ ระบบ {branch ? `· ${branchName(branch)}` : "· ทุกสาขา"} — ข้อมูลที่พนักงานเก็บหน้าสาขา เทียบกับ SKU ในระบบ
      </div>

      {captures.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-sm text-muted">
          ยังไม่มีข้อมูลที่เก็บใหม่ — ให้พนักงานเก็บที่หน้า /my/count แท็บ “เก็บข้อมูลใหม่” ก่อน
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <div className="rounded-xl border border-line bg-surface p-3"><div className="text-xs text-success flex items-center gap-1"><Check className="w-3.5 h-3.5" /> ตรง</div><div className="text-2xl font-bold tabular-nums text-success mt-0.5">{num(stats.match)}</div></div>
            <div className="rounded-xl border border-line bg-surface p-3"><div className="text-xs text-danger">สติกเกอร์ผิด</div><div className="text-2xl font-bold tabular-nums text-danger mt-0.5">{num(stats.wrong)}</div></div>
            <div className="rounded-xl border border-line bg-surface p-3"><div className="text-xs text-warn">ใหม่</div><div className="text-2xl font-bold tabular-nums text-warn mt-0.5">{num(stats.new)}</div></div>
            <div className="rounded-xl border border-line bg-surface p-3"><div className="text-xs text-muted">ไม่เจอบนชั้น</div><div className="text-2xl font-bold tabular-nums text-ink mt-0.5">{num(stats.missing)}</div></div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Pill id="all" label="ทั้งหมด" n={rows.length} />
            <Pill id="wrong" label="สติกเกอร์ผิด" n={stats.wrong} />
            <Pill id="new" label="ใหม่" n={stats.new} />
            <Pill id="missing" label="ไม่เจอ" n={stats.missing} />
            <Pill id="match" label="ตรง" n={stats.match} />
            <button onClick={exportCsv} className="inline-flex items-center gap-1.5 text-sm text-ink border border-line rounded-lg px-3 py-1.5 hover:bg-canvas"><Download className="w-4 h-4" /> CSV</button>
            <div className="relative ml-auto">
              <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="ค้นหา SKU / กลิ่น" className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-brand w-52" />
            </div>
          </div>

          {err && <div className="mb-2 text-[13px] text-danger bg-danger-soft rounded-lg px-3 py-2">{err}</div>}

          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="bg-canvas text-muted text-left"><th className="px-3 py-2 font-medium">SKU</th><th className="px-3 py-2 font-medium">กลิ่น</th><th className="px-3 py-2 font-medium">ขนาด</th><th className="px-3 py-2 font-medium">สถานะ</th><th className="px-3 py-2 font-medium text-right">จัดการ</th></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.kind + r.sku} className="border-t border-line-soft">
                    <td className="px-3 py-2 font-mono text-[13px] text-ink whitespace-nowrap">{r.sku}</td>
                    <td className="px-3 py-2 text-ink whitespace-nowrap">{r.scent}</td>
                    <td className="px-3 py-2 text-muted whitespace-nowrap">{r.size || "—"}</td>
                    <td className="px-3 py-2"><span className={"text-[11px] whitespace-nowrap rounded-full px-2 py-0.5 font-medium " + meta[r.kind].cls}>{meta[r.kind].label}</span></td>
                    <td className="px-3 py-2 text-right whitespace-nowrap"><Action r={r} /></td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-muted">ไม่มีรายการ</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="mt-2 text-[11px] text-muted leading-relaxed">
            <b className="text-ink">อ่านยังไง:</b> <span className="text-success">ตรง</span> = เก็บเจอ+ระบบมี ถูกสินค้า ·
            <span className="text-danger"> สติกเกอร์ผิด</span> = SKU นี้ระบบผูกกับสินค้าอื่น → <b>แก้ให้ตรง</b> ·
            <span className="text-warn"> ใหม่</span> = เก็บได้แต่ระบบยังไม่มี → <b>เพิ่มเข้าระบบ</b> ·
            <span className="text-ink"> ไม่เจอบนชั้น</span> = ระบบมี in_stock แต่ไม่ได้เก็บ → <b>ของหาย</b> (ติดตามเท่านั้น ไม่ตัดสต๊อกขายอัตโนมัติ)
          </div>
        </>
      )}
    </div>
  );
}
