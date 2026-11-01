"use client";
import { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download, Search, CalendarRange } from "lucide-react";
import { num, baht } from "@/lib/format";
import { branchName } from "@/lib/branches";
import { downloadCsv } from "@/lib/csv";
import type { SoldSkuRow } from "@/lib/queries";

const thDate = (ymd: string) => { const [y, m, d] = (ymd || "").split("-"); return y ? `${d}/${m}/${+y + 543}` : ""; };

// รายการขายรายชิ้น (SKU) ย้อนหลัง — เลือกช่วงวันที่ (ผ่าน URL) + ค้นหา + Export CSV
export function SkuSalesHistory({ rows, branch, from, to }: { rows: SoldSkuRow[]; branch: string | null; from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [qText, setQText] = useState("");
  const [dFrom, setDFrom] = useState(from);
  const [dTo, setDTo] = useState(to);

  const apply = () => {
    if (!dFrom || !dTo) return;
    const p = new URLSearchParams(sp.toString());
    p.set("from", dFrom); p.set("to", dTo);
    router.push(`${pathname}?${p.toString()}`);
  };

  const shown = useMemo(() => {
    const t = qText.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) =>
      (r.scent || "").toLowerCase().includes(t) || r.sku.toLowerCase().includes(t) ||
      (r.receipt_no || "").toLowerCase().includes(t) || (r.ba || "").toLowerCase().includes(t));
  }, [rows, qText]);

  const stats = useMemo(() => {
    let real = 0, guessed = 0, total = 0;
    for (const r of shown) { if (r.guessed) guessed++; else { real++; total += Number(r.total || 0); } }
    return { n: shown.length, real, guessed, total };
  }, [shown]);

  const exportCsv = () => {
    if (!shown.length) return;
    const header = ["วันที่", "เวลา", "สาขา", "กลิ่น", "ไซซ์", "SKU", "เลขบิล", "ราคา", "พนักงาน", "ช่องทาง", "สัญชาติ", "ประเภท"];
    const body = shown.map((r) => [
      r.sold_date, r.sold_time || "", r.branch ? branchName(r.branch) : "", r.scent || "", r.size || "", r.sku,
      r.receipt_no || "", r.total ?? "", r.ba || "", r.payment_channel || "", r.nation || "",
      r.guessed ? "เดาตัด" : "ขายจริง",
    ]);
    downloadCsv(`sku-sales_${branch || "all"}_${from}_${to}.csv`, [header, ...body]);
  };

  return (
    <div className="space-y-4">
      {/* date range */}
      <div className="flex items-end gap-2 flex-wrap rounded-xl border border-line bg-surface p-3">
        <CalendarRange className="w-5 h-5 text-muted mb-2" />
        <label className="text-sm">
          <span className="block text-[11px] text-muted mb-0.5">ตั้งแต่</span>
          <input type="date" value={dFrom} onChange={(e) => setDFrom(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-line bg-surface text-ink text-sm focus:outline-none focus:border-brand" />
        </label>
        <label className="text-sm">
          <span className="block text-[11px] text-muted mb-0.5">ถึง</span>
          <input type="date" value={dTo} onChange={(e) => setDTo(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-line bg-surface text-ink text-sm focus:outline-none focus:border-brand" />
        </label>
        <button onClick={apply}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand text-white text-sm font-semibold px-4 py-2 hover:bg-brand-dark">
          ดูข้อมูล
        </button>
      </div>

      {/* summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-xl border border-line bg-surface p-3"><div className="text-xs text-muted">รายการ (ขวด)</div><div className="text-2xl font-bold tabular-nums text-ink mt-0.5">{num(stats.n)}</div></div>
        <div className="rounded-xl border border-line bg-surface p-3"><div className="text-xs text-success">ขายจริง (มีบิล)</div><div className="text-2xl font-bold tabular-nums text-success mt-0.5">{num(stats.real)}</div></div>
        <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-3"><div className="text-xs text-amber-700">เดาตัด (ไม่มีบิล)</div><div className="text-2xl font-bold tabular-nums text-amber-700 mt-0.5">{num(stats.guessed)}</div></div>
        <div className="rounded-xl border border-line bg-surface p-3"><div className="text-xs text-muted">ยอดขายจริง</div><div className="text-2xl font-bold tabular-nums text-ink mt-0.5">{baht(stats.total)}</div></div>
      </div>

      {/* search + export */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-0 sm:flex-none">
          <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="ค้นหากลิ่น / SKU / บิล / พนักงาน"
            className="w-full sm:w-80 pl-8 pr-3 py-2 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-brand" />
        </div>
        <button onClick={exportCsv} disabled={!shown.length}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface text-ink text-sm font-medium px-3 py-2 hover:bg-canvas disabled:opacity-50 shrink-0"
          title="ดาวน์โหลดเป็นไฟล์ CSV (เปิดใน Excel ได้)">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-canvas text-muted text-left">
            <th className="px-3 py-2 font-medium whitespace-nowrap">วันที่</th>
            <th className="px-3 py-2 font-medium">เวลา</th>
            <th className="px-3 py-2 font-medium">กลิ่น</th>
            <th className="px-3 py-2 font-medium">ไซซ์</th>
            <th className="px-3 py-2 font-medium">SKU</th>
            <th className="px-3 py-2 font-medium">เลขบิล</th>
            <th className="px-3 py-2 font-medium text-right">ราคา</th>
            <th className="px-3 py-2 font-medium">พนักงาน</th>
            <th className="px-3 py-2 font-medium">ประเภท</th>
          </tr></thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={r.sku + i} className={"border-t border-line-soft " + (r.guessed ? "bg-amber-50/50" : "hover:bg-canvas/40")}>
                <td className="px-3 py-2 whitespace-nowrap text-ink">{thDate(r.sold_date)}</td>
                <td className="px-3 py-2 text-muted tabular-nums">{r.sold_time || "—"}</td>
                <td className="px-3 py-2 text-ink">{r.scent || "—"}</td>
                <td className="px-3 py-2 text-muted">{r.size || "—"}</td>
                <td className="px-3 py-2 font-mono text-[12px] text-ink">{r.sku}</td>
                <td className="px-3 py-2 font-mono text-[11px] text-muted">{r.receipt_no || "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink">{r.total != null ? baht(Number(r.total)) : "—"}</td>
                <td className="px-3 py-2 text-muted">{r.ba || "—"}</td>
                <td className="px-3 py-2">
                  {r.guessed
                    ? <span className="text-[11px] rounded-full px-2 py-0.5 bg-amber-100 text-amber-700 font-medium">⚠ เดาตัด</span>
                    : <span className="text-[11px] rounded-full px-2 py-0.5 bg-success-soft text-success font-medium">ขายจริง</span>}
                </td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={9} className="px-3 py-10 text-center text-sm text-muted">ไม่มีรายการในช่วงวันที่นี้</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted">ช่วง {thDate(from)} – {thDate(to)} · <span className="text-success">ขายจริง</span> = ตัด SKU ผูกบิลแล้ว · <span className="text-amber-700">⚠ เดาตัด</span> = ระบบเดา ไม่มีบิล (ควรตรวจ)</p>
    </div>
  );
}
