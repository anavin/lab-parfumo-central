"use client";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui";
import { fmtDate, num } from "@/lib/format";

type Row = { po_number: string; ship_date: string; branch_label: string; units: number; received: number; returned: number };

const columns: Column<Row>[] = [
  { key: "po_number", header: "PO Number", sortValue: (r) => r.po_number, render: (r) => <span className="font-semibold">{r.po_number}</span> },
  { key: "ship_date", header: "วันที่", sortValue: (r) => r.ship_date, render: (r) => <span className="text-muted">{fmtDate(r.ship_date)}</span> },
  { key: "branch_label", header: "สาขา", sortValue: (r) => r.branch_label, render: (r) => <span className="text-muted">{r.branch_label}</span> },
  { key: "units", header: "หน่วย", align: "right", sortValue: (r) => r.units, render: (r) => <span className="font-medium tabular-nums">{num(r.units)}</span> },
  { key: "received", header: "รับแล้ว", align: "right", sortValue: (r) => r.received, render: (r) => r.received ? <Badge tone="success">{r.received}</Badge> : <span className="text-muted-soft">-</span> },
  { key: "returned", header: "คืน", align: "right", sortValue: (r) => r.returned, render: (r) => r.returned ? <Badge tone="danger">{r.returned}</Badge> : <span className="text-muted-soft">-</span> },
];

export function ShipmentsTable({ rows }: { rows: Row[] }) {
  return <DataTable columns={columns} rows={rows} rowKey={(r) => r.po_number} maxHeight="600px" empty="ยังไม่มีการส่งสินค้า" />;
}
