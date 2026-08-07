"use client";
import Link from "next/link";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui";
import { fmtDate, num } from "@/lib/format";

type Row = {
  id: number; po_number: string; version: string | null; order_date: string;
  branch_label: string; store_no: string; status: string; lines: number; qty: number;
};

const statusTone: Record<string, "gray" | "brand" | "success" | "info"> = {
  draft: "gray", issued: "brand", delivered: "info", closed: "success",
};

const columns: Column<Row>[] = [
  { key: "po_number", header: "PO Number", sortValue: (r) => r.po_number, render: (r) => <span className="font-semibold text-ink">{r.po_number}{r.version && <span className="text-muted-soft font-normal ml-1 text-xs">{r.version}</span>}</span> },
  { key: "order_date", header: "วันที่", sortValue: (r) => r.order_date, render: (r) => <span className="text-muted">{fmtDate(r.order_date)}</span> },
  { key: "branch_label", header: "สาขา", sortValue: (r) => r.branch_label, render: (r) => <span className="text-ink-soft">{r.branch_label}</span> },
  { key: "lines", header: "รายการ", align: "right", sortValue: (r) => r.lines, render: (r) => <span className="text-muted tabular-nums">{r.lines}</span> },
  { key: "qty", header: "จำนวน", align: "right", sortValue: (r) => r.qty, render: (r) => <span className="font-medium tabular-nums">{num(r.qty)}</span> },
  { key: "status", header: "สถานะ", sortValue: (r) => r.status, render: (r) => <Badge tone={statusTone[r.status] ?? "gray"}>{r.status}</Badge> },
  { key: "open", header: "", sortable: false, align: "right", render: (r) => <Link href={`/requisitions/${r.id}`} className="text-brand-dark font-medium hover:underline whitespace-nowrap">เปิด →</Link> },
];

export function RequisitionsTable({ rows }: { rows: Row[] }) {
  return <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} cellPad="px-4 py-3" headPad="px-4 py-3" maxHeight="72vh" empty="ยังไม่มีใบเบิก" />;
}
