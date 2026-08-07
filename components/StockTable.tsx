"use client";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui";
import { num } from "@/lib/format";

type Row = { scent: string; size: string; shipped: number; sold: number; returned: number; remaining: number };

const tone = (r: number): "danger" | "warn" | "success" => (r <= 0 ? "danger" : r <= 3 ? "warn" : "success");

const columns: Column<Row>[] = [
  { key: "scent", header: "กลิ่น", sortValue: (r) => r.scent, render: (r) => <span className="font-medium">{r.scent}</span> },
  { key: "size", header: "ขนาด", sortValue: (r) => r.size, render: (r) => <span className="text-muted">{r.size}</span> },
  { key: "shipped", header: "ส่งไป", align: "right", sortValue: (r) => r.shipped, render: (r) => <span className="text-muted tabular-nums">{num(r.shipped)}</span> },
  { key: "sold", header: "ขาย", align: "right", sortValue: (r) => r.sold, render: (r) => <span className="text-muted tabular-nums">{num(r.sold)}</span> },
  { key: "returned", header: "คืน", align: "right", sortValue: (r) => r.returned, render: (r) => <span className="text-muted-soft tabular-nums">{r.returned ? num(r.returned) : "-"}</span> },
  { key: "remaining", header: "คงเหลือ", align: "right", sortValue: (r) => r.remaining, render: (r) => <span className="font-semibold tabular-nums">{num(r.remaining)}</span> },
  { key: "status", header: "สถานะ", sortValue: (r) => r.remaining, render: (r) => <Badge tone={tone(r.remaining)}>{r.remaining <= 0 ? "หมด" : r.remaining <= 3 ? "ใกล้หมด" : "ปกติ"}</Badge> },
];

export function StockTable({ rows }: { rows: Row[] }) {
  return <DataTable columns={columns} rows={rows} rowKey={(_, i) => i} initialSort={{ key: "remaining", dir: "asc" }} />;
}
