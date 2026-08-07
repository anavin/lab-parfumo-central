"use client";
import { DataTable, type Column } from "@/components/DataTable";
import { baht, fmtDate } from "@/lib/format";

type Row = { cash_date: string; description: string; amount: number; type: string };

const columns: Column<Row>[] = [
  { key: "cash_date", header: "วันที่", sortValue: (r) => r.cash_date, render: (r) => <span className="text-muted whitespace-nowrap">{fmtDate(r.cash_date)}</span> },
  { key: "description", header: "รายละเอียด", sortValue: (r) => r.description, tdClass: "max-w-[360px]", render: (r) => <span className="block truncate" title={r.description}>{r.description}</span> },
  { key: "type", header: "ประเภท", sortValue: (r) => r.type, render: (r) => <span className="text-muted">{r.type}</span> },
  { key: "amount", header: "จำนวนเงิน", align: "right", sortValue: (r) => r.amount, render: (r) => <span className={`font-medium tabular-nums ${r.amount < 0 ? "text-danger" : ""}`}>{baht(r.amount)}</span> },
];

export function CashTable({ rows }: { rows: Row[] }) {
  return <DataTable columns={columns} rows={rows} rowKey={(_, i) => i} maxHeight="560px" empty="ยังไม่มีรายการเงินสด" />;
}
