"use client";
import { useMemo, useState } from "react";
import { Scale, Check, Search } from "lucide-react";
import { num } from "@/lib/format";
import { branchName } from "@/lib/branches";
import type { SkuUnitRow } from "@/lib/queries";

type StockRow = { barcode: string; scent: string; size: string; remaining: number };
type Filter = "diff" | "all" | "match" | "uncollected";
type Row = { barcode: string; scent: string; size: string; system: number; collected: number; diff: number };

// เทียบ "สต๊อกที่ระบบคิดว่ามี" กับ "SKU ที่เก็บ/นับจริง" ต่อสินค้า → เห็นว่าตรง/ขาด/เกิน
// ระบบ = คงเหลือจากใบเบิก−ขาย · เก็บ SKU = จำนวน in_stock ที่สแกนเก็บไว้
export function SkuReconcile({ stock, skus, branch }: { stock: StockRow[]; skus: SkuUnitRow[]; branch: string | null }) {
  const [filter, setFilter] = useState<Filter>("diff");
  const [qText, setQText] = useState("");

  const rows = useMemo<Row[]>(() => {
    const coll = new Map<string, number>();
    for (const u of skus) if (u.status === "in_stock" && u.barcode) coll.set(u.barcode, (coll.get(u.barcode) || 0) + 1);
    const sys = new Map<string, { scent: string; size: string; remaining: number }>();
    for (const r of stock) {
      const prev = sys.get(r.barcode);
      sys.set(r.barcode, { scent: r.scent, size: r.size, remaining: (prev?.remaining || 0) + (Number(r.remaining) || 0) });
    }
    const keys = new Set<string>([...sys.keys(), ...coll.keys()].filter(Boolean));
    const mlOf = (z: string) => { const m = z.match(/(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : 0; };
    return [...keys].map((bc) => {
      const s = sys.get(bc);
      const system = Math.round(s?.remaining ?? 0);
      const collected = coll.get(bc) ?? 0;
      let scent = s?.scent, size = s?.size;
      if (!scent) { const u = skus.find((x) => x.barcode === bc); scent = u?.scent || bc; size = u?.size || ""; }
      return { barcode: bc, scent: scent || bc, size: size || "", system, collected, diff: collected - system };
    }).sort((a, b) => a.scent.localeCompare(b.scent, "th") || mlOf(a.size) - mlOf(b.size));
  }, [stock, skus]);

  const stats = useMemo(() => {
    let match = 0, diff = 0, uncollected = 0, net = 0;
    for (const r of rows) { net += r.diff; r.diff === 0 ? match++ : diff++; if (r.collected === 0 && r.system > 0) uncollected++; }
    return { match, diff, uncollected, net, total: rows.length };
  }, [rows]);

  const shown = useMemo(() => {
    const t = qText.trim().toLowerCase();
    return rows.filter((r) => {
      const passFilter = filter === "all" ? true
        : filter === "match" ? r.diff === 0
        : filter === "uncollected" ? (r.collected === 0 && r.system > 0)
        : r.diff !== 0;
      if (!passFilter) return false;
      return !t || r.scent.toLowerCase().includes(t) || r.size.toLowerCase().includes(t) || r.barcode.toLowerCase().includes(t);
    });
  }, [rows, filter, qText]);

  const Pill = ({ id, label, n, tone }: { id: Filter; label: string; n: number; tone?: string }) => (
    <button onClick={() => setFilter(id)}
      className={"px-3 py-1.5 text-sm font-medium rounded-lg border transition " +
        (filter === id ? "bg-brand text-white border-brand" : (tone || "text-muted") + " border-line hover:bg-canvas")}>
      {label} <span className="tabular-nums">{num(n)}</span>
    </button>
  );

  const Status = ({ r }: { r: Row }) => {
    if (r.diff === 0) return <span className="chip-success text-[11px] whitespace-nowrap"><Check className="w-3 h-3 inline -mt-0.5" /> ตรง</span>;
    if (r.collected === 0 && r.system > 0) return <span className="text-[11px] whitespace-nowrap rounded-full px-2 py-0.5 bg-canvas border border-line text-muted">ยังไม่เก็บ</span>;
    if (r.diff < 0) return <span className="text-[11px] whitespace-nowrap rounded-full px-2 py-0.5 bg-danger-soft text-danger font-medium">ขาด {num(-r.diff)}</span>;
    return <span className="text-[11px] whitespace-nowrap rounded-full px-2 py-0.5 bg-warn-soft text-warn font-medium">เกิน {num(r.diff)}</span>;
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm text-muted">
        <Scale className="w-4 h-4 text-brand" />
        เทียบสต๊อกระบบ ↔ SKU ที่เก็บ {branch ? `· ${branchName(branch)}` : "· ทุกสาขา"} — หาของที่ขาด/เกินจากที่นับจริง
      </div>

      {/* ยอดรวม */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted"><Check className="w-3.5 h-3.5 text-success" /> ตรงกัน</div>
          <div className="text-2xl font-bold tabular-nums text-success mt-0.5">{num(stats.match)}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="text-xs text-muted">ต่างกัน</div>
          <div className="text-2xl font-bold tabular-nums text-danger mt-0.5">{num(stats.diff)}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="text-xs text-muted">ส่วนต่างรวม</div>
          <div className={"text-2xl font-bold tabular-nums mt-0.5 " + (stats.net < 0 ? "text-danger" : stats.net > 0 ? "text-warn" : "text-ink")}>
            {stats.net > 0 ? "+" : ""}{num(stats.net)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Pill id="diff" label="ต่างกัน" n={stats.diff} tone="text-danger" />
        <Pill id="uncollected" label="ยังไม่เก็บ" n={stats.uncollected} />
        <Pill id="match" label="ตรงกัน" n={stats.match} tone="text-success" />
        <Pill id="all" label="ทั้งหมด" n={stats.total} />
        <div className="relative ml-auto">
          <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="ค้นหากลิ่น / บาร์โค้ด"
            className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-brand w-52" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-canvas text-muted">
              <th className="text-left px-3 py-2 font-medium">สินค้า</th>
              <th className="text-center px-3 py-2 font-medium">ระบบ</th>
              <th className="text-center px-3 py-2 font-medium">เก็บ SKU</th>
              <th className="text-center px-3 py-2 font-medium">ต่าง</th>
              <th className="text-right px-3 py-2 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.barcode} className="border-t border-line-soft">
                <td className="px-3 py-2 text-ink whitespace-nowrap">{r.scent} <span className="text-muted">{r.size}</span></td>
                <td className="px-3 py-2 text-center tabular-nums text-ink">{num(r.system)}</td>
                <td className="px-3 py-2 text-center tabular-nums text-ink">{num(r.collected)}</td>
                <td className={"px-3 py-2 text-center tabular-nums font-semibold " + (r.diff < 0 ? "text-danger" : r.diff > 0 ? "text-warn" : "text-muted-soft")}>
                  {r.diff > 0 ? "+" : ""}{r.diff !== 0 ? num(r.diff) : "0"}
                </td>
                <td className="px-3 py-2 text-right"><Status r={r} /></td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-muted">ไม่มีรายการตามเงื่อนไข</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-[11px] text-muted leading-relaxed">
        <b className="text-ink">อ่านยังไง:</b> ระบบ = สต๊อกที่ควรมี (ใบเบิก−ขาย) · เก็บ SKU = ที่สแกนนับจริง ·
        <span className="text-danger"> ขาด</span> = หาย/ยังเก็บ SKU ไม่ครบ ·
        <span className="text-warn"> เกิน</span> = SKU มากกว่าสต๊อกระบบ (สต๊อกระบบน้อยไป/นับเกิน)
      </div>
    </div>
  );
}
