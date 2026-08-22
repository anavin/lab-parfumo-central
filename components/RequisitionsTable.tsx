"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui";
import { fmtDate, num } from "@/lib/format";
import { branchName, normalizeBranch, BRANCHES } from "@/lib/branches";

type Row = {
  id: number; po_number: string; version: string | null; order_date: string;
  branch_label: string; store_no: string; status: string; lines: number; qty: number;
  assigned_to?: number | null;   // 0029 — receiver; null on a ready-to-receive PO = nobody sees it
};

// full lifecycle → Thai label + colour, in pipeline order
const STATUS: Record<string, { label: string; tone: "gray" | "brand" | "success" | "info" | "warn" }> = {
  draft:     { label: "ร่าง",          tone: "gray" },
  issued:    { label: "ออกใบเบิก",     tone: "brand" },
  delivered: { label: "ส่งแล้ว",       tone: "info" },
  approved:  { label: "รอสาขารับของ",  tone: "warn" },
  received:  { label: "รับของแล้ว",     tone: "success" },
  closed:    { label: "ปิดแล้ว",        tone: "gray" },
};
const statusMeta = (s: string) => STATUS[s] ?? { label: s || "-", tone: "gray" as const };

// group statuses into the buckets a user actually thinks in
type Bucket = "all" | "pending" | "toReceive" | "received";
const bucketOf = (s: string): Exclude<Bucket, "all"> | "other" =>
  s === "approved" ? "toReceive" : s === "received" ? "received"
  : ["draft", "issued", "delivered"].includes(s) ? "pending" : "other";

const BUCKETS: { key: Bucket; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "pending", label: "รอดำเนินการ" },
  { key: "toReceive", label: "รอสาขารับของ" },
  { key: "received", label: "รับของแล้ว" },
];

const columns: Column<Row & { _branch: string }>[] = [
  { key: "po_number", header: "เลขที่ใบเบิก", sortValue: (r) => r.po_number,
    render: (r) => (
      <span className="font-semibold text-ink">{r.po_number}
        {r.version && <span className="text-muted-soft font-normal ml-1 text-xs">{r.version}</span>}</span>
    ) },
  { key: "order_date", header: "วันที่", sortValue: (r) => r.order_date, render: (r) => <span className="text-muted">{fmtDate(r.order_date)}</span> },
  { key: "_branch", header: "สาขา", sortValue: (r) => r._branch,
    render: (r) => <span className="inline-flex items-center rounded-md bg-canvas px-2 py-0.5 text-xs font-medium text-ink-soft">{r._branch}</span> },
  { key: "lines", header: "รายการ", align: "right", sortValue: (r) => r.lines, render: (r) => <span className="text-muted tabular-nums">{r.lines}</span> },
  { key: "qty", header: "จำนวน", align: "right", sortValue: (r) => r.qty, render: (r) => <span className="font-medium tabular-nums">{num(r.qty)} <span className="text-muted-soft text-xs font-normal">ขวด</span></span> },
  { key: "status", header: "สถานะ", sortValue: (r) => r.status,
    render: (r) => {
      const m = statusMeta(r.status);
      // delivered/approved = ready to receive; no assignee → nobody sees it in /my → warn
      const needsAssign = (r.status === "delivered" || r.status === "approved") && !r.assigned_to;
      return (
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          <Badge tone={m.tone}>{m.label}</Badge>
          {needsAssign && <span className="chip-warn">⚠ ยังไม่มอบหมาย</span>}
        </span>
      );
    } },
  { key: "open", header: "", sortable: false, align: "right",
    render: (r) => <Link href={`/requisitions/${r.id}`} className="inline-flex items-center gap-0.5 text-brand-dark font-medium hover:underline whitespace-nowrap">เปิด <ChevronRight className="w-3.5 h-3.5" /></Link> },
];

export function RequisitionsTable({ rows }: { rows: Row[] }) {
  const [bucket, setBucket] = useState<Bucket>("all");
  const [branch, setBranch] = useState<string>("all");
  const [search, setSearch] = useState("");

  // enrich once with a resolved short branch name for display + filtering
  const enriched = useMemo(() => rows.map((r) => ({ ...r, _code: normalizeBranch(r.branch_label), _branch: branchName(r.branch_label) || r.branch_label })), [rows]);

  const counts = useMemo(() => {
    const c: Record<Bucket, number> = { all: enriched.length, pending: 0, toReceive: 0, received: 0 };
    for (const r of enriched) { const b = bucketOf(r.status); if (b !== "other") c[b]++; }
    return c;
  }, [enriched]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enriched.filter((r) =>
      (bucket === "all" || bucketOf(r.status) === bucket) &&
      (branch === "all" || r._code === branch) &&
      (!term || r.po_number.toLowerCase().includes(term) || r._branch.toLowerCase().includes(term)));
  }, [enriched, bucket, branch, search]);

  return (
    <div className="space-y-4">
      {/* status filter chips with live counts */}
      <div className="flex flex-wrap gap-2">
        {BUCKETS.map((b) => {
          const on = bucket === b.key;
          return (
            <button key={b.key} onClick={() => setBucket(b.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors border ${on ? "bg-ink text-surface border-ink" : "bg-surface text-muted border-line hover:bg-canvas"}`}>
              {b.label}
              <span className={`tabular-nums text-xs rounded-full px-1.5 ${on ? "bg-surface/25" : "bg-canvas text-muted-soft"}`}>{counts[b.key]}</span>
            </button>
          );
        })}
      </div>

      {/* search + branch filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-muted-soft absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาเลขที่ใบเบิก / สาขา…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-line bg-surface text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-brand" />
        </div>
        <div className="flex gap-1.5">
          <BranchChip label="ทุกสาขา" on={branch === "all"} onClick={() => setBranch("all")} />
          {BRANCHES.filter((b) => b.active).map((b) => (
            <BranchChip key={b.code} label={b.name} on={branch === b.code} onClick={() => setBranch(b.code)} />
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} rows={filtered} rowKey={(r) => r.id} cellPad="px-4 py-3" headPad="px-4 py-3" maxHeight="66vh"
          empty={search || bucket !== "all" || branch !== "all" ? "ไม่พบใบเบิกที่ตรงกับตัวกรอง" : "ยังไม่มีใบเบิก"} />
      </div>
    </div>
  );
}

function BranchChip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors border ${on ? "bg-brand text-white border-brand" : "bg-surface text-muted border-line hover:bg-canvas"}`}>
      {label}
    </button>
  );
}
