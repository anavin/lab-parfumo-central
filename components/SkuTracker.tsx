"use client";
import { useMemo, useState } from "react";
import { Barcode, Search, PackageCheck, ShoppingCart } from "lucide-react";
import { num } from "@/lib/format";
import { branchName } from "@/lib/branches";
import type { SkuUnitRow } from "@/lib/queries";

type Filter = "in_stock" | "sold" | "all";

// ติดตาม SKU รายชิ้น — รับเข้ามาเป็น in_stock, ขายแล้วผูกกับบิล (เฟส 3)
// ใช้เช็คว่าแต่ละ SKU อยู่ไหน / ขายไปบิลใด / เหลือกี่ชิ้น เพื่อตามของขาด-หาย
export function SkuTracker({ rows, branch }: { rows: SkuUnitRow[]; branch: string | null }) {
  const [filter, setFilter] = useState<Filter>("in_stock");
  const [qText, setQText] = useState("");

  const counts = useMemo(() => {
    let inStock = 0, sold = 0, other = 0;
    for (const r of rows) r.status === "in_stock" ? inStock++ : r.status === "sold" ? sold++ : other++;
    return { inStock, sold, other, total: rows.length };
  }, [rows]);

  const shown = useMemo(() => {
    const t = qText.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "in_stock" && r.status !== "in_stock") return false;
      if (filter === "sold" && r.status !== "sold") return false;
      if (!t) return true;
      return [r.sku, r.scent, r.size, r.sold_receipt_no].some((v) => String(v || "").toLowerCase().includes(t));
    });
  }, [rows, filter, qText]);

  const Pill = ({ id, label, n }: { id: Filter; label: string; n: number }) => (
    <button onClick={() => setFilter(id)}
      className={"px-3 py-1.5 text-sm font-medium rounded-lg border transition " +
        (filter === id ? "bg-brand text-white border-brand" : "text-muted border-line hover:bg-canvas")}>
      {label} <span className="tabular-nums">{num(n)}</span>
    </button>
  );
  const fmt = (iso: string | null) => { if (!iso) return "—"; const d = new Date(iso); return isNaN(+d) ? "—" : d.toLocaleDateString("th-TH", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" }); };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm text-muted">
        <Barcode className="w-4 h-4 text-brand" />
        ติดตาม SKU รายชิ้น {branch ? `· ${branchName(branch)}` : "· ทุกสาขา"} — แต่ละขวดมีรหัสไม่ซ้ำ ใช้ตามว่าขายไปที่ไหน/เหลือกี่ชิ้น
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted"><PackageCheck className="w-3.5 h-3.5 text-success" /> คงเหลือ (in stock)</div>
          <div className="text-2xl font-bold tabular-nums text-ink mt-0.5">{num(counts.inStock)}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted"><ShoppingCart className="w-3.5 h-3.5 text-brand" /> ขายไปแล้ว</div>
          <div className="text-2xl font-bold tabular-nums text-ink mt-0.5">{num(counts.sold)}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="text-xs text-muted">รวมทั้งหมดที่รับเข้า</div>
          <div className="text-2xl font-bold tabular-nums text-ink mt-0.5">{num(counts.total)}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Pill id="in_stock" label="คงเหลือ" n={counts.inStock} />
        <Pill id="sold" label="ขายแล้ว" n={counts.sold} />
        <Pill id="all" label="ทั้งหมด" n={counts.total} />
        <div className="relative ml-auto">
          <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="ค้นหา SKU / กลิ่น / เลขบิล"
            className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-brand w-56" />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-sm text-muted">
          ยังไม่มีข้อมูล SKU — SKU จะถูกบันทึกอัตโนมัติเมื่อกดรับใบเบิกที่คลังส่งมาพร้อมรหัส SKU
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-canvas text-muted text-left">
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">กลิ่น</th>
                <th className="px-3 py-2 font-medium">ขนาด</th>
                <th className="px-3 py-2 font-medium">สถานะ</th>
                <th className="px-3 py-2 font-medium">รับเข้า</th>
                <th className="px-3 py-2 font-medium">บิลที่ขาย</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.sku} className="border-t border-line-soft">
                  <td className="px-3 py-2 font-mono text-[13px] text-ink whitespace-nowrap">{r.sku}</td>
                  <td className="px-3 py-2 text-ink whitespace-nowrap">{r.scent || "—"}</td>
                  <td className="px-3 py-2 text-muted whitespace-nowrap">{r.size || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.status === "in_stock"
                      ? <span className="chip-success text-[11px]">คงเหลือ</span>
                      : r.status === "sold"
                      ? <span className="chip-muted text-[11px]">ขายแล้ว</span>
                      : <span className="chip-muted text-[11px]">{r.status}</span>}
                  </td>
                  <td className="px-3 py-2 text-muted whitespace-nowrap">{fmt(r.received_at)}{r.po_number ? ` · ${r.po_number}` : ""}</td>
                  <td className="px-3 py-2 text-muted whitespace-nowrap">
                    {r.sold_receipt_no ? <>{r.sold_receipt_no}{r.sold_branch ? ` · ${branchName(r.sold_branch)}` : ""}</> : "—"}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-muted">ไม่พบ SKU ตามเงื่อนไข</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
