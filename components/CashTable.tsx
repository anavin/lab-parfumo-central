"use client";
import { useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { DataTable, type Column } from "@/components/DataTable";
import { baht, fmtDate } from "@/lib/format";

type Row = { cash_date: string; description: string; amount: number; type: string };

const columns: Column<Row>[] = [
  { key: "cash_date", header: "วันที่", sortValue: (r) => r.cash_date, render: (r) => <span className="text-muted whitespace-nowrap">{fmtDate(r.cash_date)}</span> },
  { key: "description", header: "รายละเอียด", sortValue: (r) => r.description, tdClass: "max-w-[360px]", render: (r) => <span className="block truncate" title={r.description}>{r.description}</span> },
  { key: "type", header: "ประเภท", sortValue: (r) => r.type, render: (r) => <span className="text-muted">{r.type}</span> },
  { key: "amount", header: "จำนวนเงิน", align: "right", sortValue: (r) => r.amount, render: (r) => <span className={`font-medium tabular-nums ${r.amount < 0 ? "text-danger" : ""}`}>{baht(r.amount)}</span> },
];

const inp = "px-2.5 py-1.5 rounded-lg border border-line bg-surface text-ink text-sm focus:outline-none focus:border-brand";
const ymd = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

export function CashTable({ rows }: { rows: Row[] }) {
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  // ประเภทที่มีจริง (ไว้ทำดรอปดาวน์) — ค่าว่างแสดงเป็น "ไม่ระบุ"
  const types = useMemo(() => [...new Set(rows.map((r) => r.type || "ไม่ระบุ"))].sort(), [rows]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (type && (r.type || "ไม่ระบุ") !== type) return false;
    if (from && (r.cash_date || "") < from) return false;
    if (to && (r.cash_date || "") > to) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!(`${r.description || ""} ${r.type || ""}`).toLowerCase().includes(s)) return false;
    }
    return true;
  }), [rows, type, from, to, q]);

  const total = useMemo(() => filtered.reduce((s, r) => s + (Number(r.amount) || 0), 0), [filtered]);
  const active = !!(type || from || to || q);
  const reset = () => { setType(""); setFrom(""); setTo(""); setQ(""); };

  // ปุ่มลัดช่วงเวลา (คิดเป็นเวลาไทย)
  const presets = useMemo(() => {
    const today = ymd(new Date());
    const startOfMonth = today.slice(0, 8) + "01";
    const lmEnd = new Date(today.slice(0, 8) + "01T00:00:00Z"); lmEnd.setUTCDate(0);
    const lmStart = ymd(lmEnd).slice(0, 8) + "01";
    const ago = (n: number) => { const x = new Date(today + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() - n); return ymd(x); };
    return [
      { k: "เดือนนี้", f: startOfMonth, t: today },
      { k: "เดือนก่อน", f: lmStart, t: ymd(lmEnd) },
      { k: "7 วัน", f: ago(6), t: today },
      { k: "30 วัน", f: ago(29), t: today },
      { k: "ทั้งหมด", f: "", t: "" },
    ];
  }, []);
  const activePreset = presets.find((p) => p.f === from && p.t === to)?.k;

  // ดาวน์โหลดจากเซิร์ฟเวอร์ตามตัวกรอง — ได้ครบทุกแถว (ไม่ติดลิมิต 1000 ที่โหลดมาแสดง) + เทียบวันที่ถูกต้อง
  const dlHref = useMemo(() => {
    const p = new URLSearchParams();
    if (type) p.set("type", type);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (q.trim()) p.set("q", q.trim());
    const s = p.toString();
    return `/api/export/cash${s ? `?${s}` : ""}`;
  }, [type, from, to, q]);

  return (
    <div className="space-y-3">
      {/* ── ปุ่มลัดช่วงเวลา ── */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button key={p.k} onClick={() => { setFrom(p.f); setTo(p.t); }}
            className={`px-2.5 py-1.5 rounded-lg text-[12.5px] border transition-colors ${activePreset === p.k ? "bg-brand text-white border-brand" : "bg-surface text-ink border-line hover:bg-canvas"}`}>
            {p.k}
          </button>
        ))}
      </div>

      {/* ── ตัวกรอง ── */}
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm"><span className="block text-[11px] text-muted mb-0.5">ประเภท</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inp}>
            <option value="">ทุกประเภท</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-sm"><span className="block text-[11px] text-muted mb-0.5">ตั้งแต่</span>
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={inp} />
        </label>
        <label className="text-sm"><span className="block text-[11px] text-muted mb-0.5">ถึง</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={inp} />
        </label>
        <label className="text-sm flex-1 min-w-[160px]"><span className="block text-[11px] text-muted mb-0.5">ค้นหา</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="รายละเอียด / ประเภท" className={inp + " w-full"} />
        </label>
        {active && (
          <button onClick={reset} className="inline-flex items-center gap-1 h-[34px] px-2.5 rounded-lg border border-line bg-surface text-sm text-muted hover:bg-canvas hover:text-ink">
            <X className="w-3.5 h-3.5" /> ล้าง
          </button>
        )}
        <a href={dlHref} className="ml-auto inline-flex items-center gap-1.5 h-[34px] px-3 rounded-lg border border-line bg-surface text-sm font-medium text-ink hover:bg-canvas">
          <Download className="w-4 h-4" /> Download CSV
        </a>
      </div>

      {/* ── สรุปผลลัพธ์ที่กรอง ── */}
      <div className="text-xs text-muted">
        แสดง <b className="text-ink tabular-nums">{filtered.length.toLocaleString()}</b>/{rows.length.toLocaleString()} รายการ
        {" · "}รวม <b className={`tabular-nums ${total < 0 ? "text-danger" : "text-ink"}`}>{baht(total)}</b>
        {active && " (ตามตัวกรอง)"}
        <span className="block text-[11px] text-muted/80 mt-0.5">ตารางแสดงล่าสุด 1,000 รายการ · ปุ่ม Download ดึงครบทุกแถวตามตัวกรอง</span>
      </div>

      <DataTable columns={columns} rows={filtered} rowKey={(_, i) => i} maxHeight="340px" empty={active ? "ไม่พบรายการตามเงื่อนไข" : "ยังไม่มีรายการเงินสด"} />
    </div>
  );
}
