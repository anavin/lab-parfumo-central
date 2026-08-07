"use client";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui";
import { baht, num, fmtDate } from "@/lib/format";
import { PAYMENTS } from "@/lib/payments";

const CH_LABEL: Record<string, string> = Object.fromEntries(PAYMENTS.map((p) => [p.v, p.label.replace(/\s*\(.*\)$/, "")]));
const chLabel = (c: string) => CH_LABEL[c] ?? c;

type Monthly = { month: string; revenue: number; qty: number; receipts: number };
type Recent = { sale_date: string; ba: string; item: string; size: string; qty: number; total: number; payment_channel: string; nation: string; source: string };

const monthlyCols: Column<Monthly>[] = [
  { key: "month", header: "เดือน", sortable: false, render: (r) => <span className="font-medium">{r.month}</span> },
  { key: "receipts", header: "ใบเสร็จ", align: "right", sortValue: (r) => r.receipts, render: (r) => <span className="text-muted tabular-nums">{num(r.receipts)}</span> },
  { key: "qty", header: "ชิ้น", align: "right", sortValue: (r) => r.qty, render: (r) => <span className="text-muted tabular-nums">{num(r.qty)}</span> },
  { key: "revenue", header: "รายได้", align: "right", sortValue: (r) => r.revenue, render: (r) => <span className="font-medium tabular-nums">{baht(r.revenue)}</span> },
];

const recentCols: Column<Recent>[] = [
  { key: "sale_date", header: "วันที่", sortValue: (r) => r.sale_date, render: (r) => <span className="text-muted whitespace-nowrap">{fmtDate(r.sale_date)}</span> },
  { key: "item", header: "รายการ", sortValue: (r) => r.item, render: (r) => <span>{r.item} <span className="text-muted-soft">{r.size}</span>{r.nation && <> <Badge tone={r.nation === "Foreign" ? "info" : "gray"}>{r.nation === "Foreign" ? "ต่างชาติ" : "ไทย"}</Badge></>}</span> },
  { key: "ba", header: "BA", sortValue: (r) => r.ba, render: (r) => <span className="text-muted whitespace-nowrap">{r.ba || "-"}</span> },
  { key: "channel", header: "ช่องทาง", sortValue: (r) => r.payment_channel, render: (r) => <span className="text-muted whitespace-nowrap">{r.payment_channel ? chLabel(r.payment_channel) : "-"}</span> },
  { key: "qty", header: "จำนวน", align: "right", sortValue: (r) => r.qty, render: (r) => <span className="text-muted tabular-nums">{num(r.qty)}</span> },
  { key: "total", header: "ยอด", align: "right", sortValue: (r) => r.total, render: (r) => <span className="font-medium tabular-nums">{baht(r.total)}</span> },
];

export function MonthlyTable({ rows }: { rows: Monthly[] }) {
  return <DataTable columns={monthlyCols} rows={rows} rowKey={(r) => r.month} maxHeight="520px" />;
}
export function RecentSalesTable({ rows }: { rows: Recent[] }) {
  return <DataTable columns={recentCols} rows={rows} rowKey={(_, i) => i} maxHeight="520px" />;
}
