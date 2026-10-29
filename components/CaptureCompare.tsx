"use client";
import { useMemo, useState } from "react";
import { GitCompare, Check, Search } from "lucide-react";
import { num } from "@/lib/format";
import { branchName } from "@/lib/branches";
import type { ShelfCaptureRow, SkuUnitRow } from "@/lib/queries";

const norm = (s: string) => s.toUpperCase().replace(/\s+/g, "");
type Kind = "match" | "wrong" | "new" | "missing";
type Row = { sku: string; scent: string; size: string; kind: Kind };
type Filter = "all" | Kind;

// เทียบ "ข้อมูลใหม่ที่เก็บจากหน้าสาขา" (shelf_capture) กับ "ระบบ" (sku_units in_stock)
// ตรง = เก็บเจอ+ระบบมี ถูกสินค้า · สติกเกอร์ผิด = ระบบผูกคนละสินค้า · ใหม่ = เก็บได้แต่ระบบไม่มี · ไม่เจอ = ระบบมีแต่ไม่ได้เก็บ
export function CaptureCompare({ captures, skus, branch }: { captures: ShelfCaptureRow[]; skus: SkuUnitRow[]; branch: string | null }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [qText, setQText] = useState("");

  const { rows, stats } = useMemo(() => {
    const sysByKey = new Map<string, string | null>();   // normalized sku → system barcode (in_stock only)
    for (const u of skus) if (u.status === "in_stock") sysByKey.set(norm(u.sku), u.barcode);
    const capByKey = new Map<string, ShelfCaptureRow>();
    for (const c of captures) capByKey.set(norm(c.sku), c);

    const rows: Row[] = [];
    for (const [key, c] of capByKey) {
      if (sysByKey.has(key)) {
        const sysBc = sysByKey.get(key);
        rows.push({ sku: c.sku, scent: c.scent || c.barcode || "-", size: c.size || "", kind: (sysBc && c.barcode && sysBc !== c.barcode) ? "wrong" : "match" });
      } else {
        rows.push({ sku: c.sku, scent: c.scent || c.barcode || "-", size: c.size || "", kind: "new" });
      }
    }
    // system in_stock SKUs that were NOT captured on the shelf
    for (const u of skus) if (u.status === "in_stock" && !capByKey.has(norm(u.sku))) {
      rows.push({ sku: u.sku, scent: u.scent || u.barcode || "-", size: u.size || "", kind: "missing" });
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

  const meta: Record<Kind, { label: string; cls: string }> = {
    match: { label: "ตรง", cls: "bg-success-soft text-success" },
    wrong: { label: "สติกเกอร์ผิดขวด", cls: "bg-danger-soft text-danger" },
    new: { label: "ใหม่ (ไม่มีในระบบ)", cls: "bg-warn-soft text-warn" },
    missing: { label: "ไม่เจอบนชั้น", cls: "bg-canvas text-muted border border-line" },
  };
  const Pill = ({ id, label, n }: { id: Filter; label: string; n: number }) => (
    <button onClick={() => setFilter(id)} className={"px-3 py-1.5 text-sm font-medium rounded-lg border transition " + (filter === id ? "bg-brand text-white border-brand" : "text-muted border-line hover:bg-canvas")}>{label} <span className="tabular-nums">{num(n)}</span></button>
  );

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
            <div className="relative ml-auto">
              <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="ค้นหา SKU / กลิ่น" className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-brand w-52" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="bg-canvas text-muted text-left"><th className="px-3 py-2 font-medium">SKU</th><th className="px-3 py-2 font-medium">กลิ่น</th><th className="px-3 py-2 font-medium">ขนาด</th><th className="px-3 py-2 font-medium text-right">สถานะ</th></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.kind + r.sku} className="border-t border-line-soft">
                    <td className="px-3 py-2 font-mono text-[13px] text-ink whitespace-nowrap">{r.sku}</td>
                    <td className="px-3 py-2 text-ink whitespace-nowrap">{r.scent}</td>
                    <td className="px-3 py-2 text-muted whitespace-nowrap">{r.size || "—"}</td>
                    <td className="px-3 py-2 text-right"><span className={"text-[11px] whitespace-nowrap rounded-full px-2 py-0.5 font-medium " + meta[r.kind].cls}>{meta[r.kind].label}</span></td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={4} className="px-3 py-8 text-center text-sm text-muted">ไม่มีรายการ</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="mt-2 text-[11px] text-muted leading-relaxed">
            <b className="text-ink">อ่านยังไง:</b> <span className="text-success">ตรง</span> = เก็บเจอ+ระบบมี ถูกสินค้า ·
            <span className="text-danger"> สติกเกอร์ผิด</span> = SKU นี้ระบบผูกกับสินค้าอื่น ·
            <span className="text-warn"> ใหม่</span> = เก็บได้แต่ระบบยังไม่มี ·
            <span className="text-ink"> ไม่เจอบนชั้น</span> = ระบบมี in_stock แต่ไม่ได้เก็บ (อาจขาย/หาย/ยังเก็บไม่ครบ)
          </div>
        </>
      )}
    </div>
  );
}
