"use client";
import { useMemo } from "react";
import { FlaskConical } from "lucide-react";
import { num } from "@/lib/format";
import { branchName } from "@/lib/branches";
import type { TesterRow } from "@/lib/queries";

// สต๊อกเทสเตอร์ (TRY ME!) — แยกจากสต๊อกขาย เพราะเทสเตอร์ไม่มีบาร์โค้ดจึงไม่เข้าสต๊อกปกติ
// นับจากใบเบิกที่รับเข้าสาขา (received) ต่อกลิ่น · เทสเตอร์ไม่ถูกขาย จำนวน = ที่รับมาสะสม
export function TesterStock({ rows, branch }: { rows: TesterRow[]; branch: string | null }) {
  // จัดกลุ่มตามกลิ่น แล้วกางขนาดเป็นคอลัมน์ (เทสเตอร์ส่วนใหญ่ 50ml แต่กันไว้เผื่อหลายขนาด)
  const { scents, sizes, cell, total } = useMemo(() => {
    const sizeSet = new Set<string>();
    const scentMap = new Map<string, Map<string, number>>();
    let total = 0;
    for (const r of rows) {
      sizeSet.add(r.size || "-");
      let m = scentMap.get(r.scent);
      if (!m) { m = new Map(); scentMap.set(r.scent, m); }
      m.set(r.size || "-", (m.get(r.size || "-") || 0) + (r.qty || 0));
      total += r.qty || 0;
    }
    const mlOf = (z: string) => { const mm = z.match(/(\d+(?:\.\d+)?)/); return mm ? parseFloat(mm[1]) : 0; };
    const sizes = [...sizeSet].sort((a, b) => mlOf(a) - mlOf(b));
    const scents = [...scentMap.keys()].sort((a, b) => a.localeCompare(b, "th"));
    const cell = (s: string, z: string) => scentMap.get(s)?.get(z) ?? 0;
    return { scents, sizes, cell, total };
  }, [rows]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm text-muted">
        <FlaskConical className="w-4 h-4 text-brand" />
        เทสเตอร์ (TRY ME!) {branch ? `· ${branchName(branch)}` : "· ทุกสาขา"} — แยกต่างหากจากสต๊อกขาย · รวม {num(total)} ขวด
      </div>
      {scents.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-sm text-muted">
          ยังไม่มีเทสเตอร์ที่รับเข้าสาขา — เทสเตอร์จะขึ้นที่นี่เมื่อกดรับใบเบิกที่มีรายการ “TRY ME!”
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-canvas text-muted">
                <th className="text-left px-3 py-2 font-medium sticky left-0 bg-canvas">กลิ่น</th>
                {sizes.map((z) => <th key={z} className="px-3 py-2 font-medium text-center whitespace-nowrap">{z}</th>)}
                <th className="px-3 py-2 font-medium text-center">รวม</th>
              </tr>
            </thead>
            <tbody>
              {scents.map((s) => {
                const rowTotal = sizes.reduce((t, z) => t + cell(s, z), 0);
                return (
                  <tr key={s} className="border-t border-line-soft">
                    <td className="px-3 py-2 font-medium text-ink whitespace-nowrap sticky left-0 bg-surface">{s}</td>
                    {sizes.map((z) => {
                      const v = cell(s, z);
                      return <td key={z} className={"px-3 py-2 text-center tabular-nums " + (v ? "text-ink" : "text-muted-soft")}>{v ? num(v) : ""}</td>;
                    })}
                    <td className="px-3 py-2 text-center tabular-nums font-semibold text-ink">{num(rowTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
