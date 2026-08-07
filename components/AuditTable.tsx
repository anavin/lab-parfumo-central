"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui";
import { Select } from "@/components/ui/Select";
import { fmtDateTH, fmtTimeTH } from "@/lib/format";

type Tone = "success" | "info" | "danger" | "warn" | "brand" | "gray";
const ACTION: Record<string, { label: string; tone: Tone }> = {
  create: { label: "สร้าง", tone: "success" }, update: { label: "แก้ไข", tone: "info" },
  delete: { label: "ลบ", tone: "warn" }, restore: { label: "กู้คืน", tone: "brand" },
  purge: { label: "ลบถาวร", tone: "danger" }, login: { label: "เข้าระบบ", tone: "success" },
  logout: { label: "ออกระบบ", tone: "gray" }, login_failed: { label: "เข้าไม่สำเร็จ", tone: "danger" },
  password: { label: "รหัสผ่าน", tone: "warn" },
};
const ENTITY: Record<string, string> = {
  requisition: "ใบเบิก", sale: "การขาย", cash: "เงินสด", customer: "ลูกค้า",
  shipment: "ส่งสินค้า", return: "คืนสินค้า", user: "ผู้ใช้", auth: "ระบบ",
};

type Row = { id: number; created_at: string; user_name: string; user_role: string; action: string; entity: string; detail: string };
const ALL = "__all";

const columns: Column<Row>[] = [
  { key: "created_at", header: "วันที่ · เวลา", sortValue: (r) => r.created_at, tdClass: "whitespace-nowrap",
    render: (r) => (<><div className="text-ink text-xs font-medium">{fmtDateTH(r.created_at)}</div><div className="text-muted text-[11px] tabular-nums">{fmtTimeTH(r.created_at)} น.</div></>) },
  { key: "user", header: "ผู้ใช้", sortValue: (r) => r.user_name,
    render: (r) => (<span><span className="font-medium text-ink">{r.user_name}</span>{r.user_role === "admin" && <span className="text-[10px] text-brand-dark ml-1">admin</span>}</span>) },
  { key: "action", header: "การกระทำ", sortValue: (r) => r.action,
    render: (r) => { const a = ACTION[r.action] ?? { label: r.action, tone: "gray" as const }; return <Badge tone={a.tone}>{a.label}</Badge>; } },
  { key: "entity", header: "ประเภท", sortValue: (r) => r.entity, render: (r) => <span className="text-muted">{ENTITY[r.entity] ?? r.entity}</span> },
  { key: "detail", header: "รายละเอียด", sortable: false, tdClass: "max-w-[420px]",
    render: (r) => <span className="text-ink-soft block truncate" title={r.detail}>{r.detail}</span> },
];

export function AuditTable({ rows }: { rows: Row[] }) {
  const [action, setAction] = useState(ALL);
  const [entity, setEntity] = useState(ALL);
  const [user, setUser] = useState(ALL);
  const [text, setText] = useState("");

  const users = useMemo(() => [...new Set(rows.map((r) => r.user_name).filter(Boolean))].sort(), [rows]);
  const actions = useMemo(() => [...new Set(rows.map((r) => r.action))], [rows]);
  const entities = useMemo(() => [...new Set(rows.map((r) => r.entity))], [rows]);

  const filtered = useMemo(() => {
    const q = text.trim().toLowerCase();
    return rows.filter((r) =>
      (action === ALL || r.action === action) &&
      (entity === ALL || r.entity === entity) &&
      (user === ALL || r.user_name === user) &&
      (!q || (r.detail ?? "").toLowerCase().includes(q) || (r.user_name ?? "").toLowerCase().includes(q)));
  }, [rows, action, entity, user, text]);

  const opt = (all: string, items: { value: string; label: string }[]) => [{ value: ALL, label: all }, ...items];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-line-soft bg-canvas/50">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="ค้นหารายละเอียด / ผู้ใช้"
            className="w-full border border-line rounded-lg pl-8 pr-2.5 py-2 text-sm bg-surface text-ink focus:outline-none focus:border-brand" />
        </div>
        <Select value={user} onValueChange={setUser} className="min-w-[150px]"
          options={opt("ผู้ใช้ทั้งหมด", users.map((u) => ({ value: u, label: u })))} />
        <Select value={action} onValueChange={setAction} className="min-w-[140px]"
          options={opt("การกระทำทั้งหมด", actions.map((a) => ({ value: a, label: ACTION[a]?.label ?? a })))} />
        <Select value={entity} onValueChange={setEntity} className="min-w-[130px]"
          options={opt("ประเภททั้งหมด", entities.map((e) => ({ value: e, label: ENTITY[e] ?? e })))} />
        <span className="text-xs text-muted whitespace-nowrap ml-auto">{filtered.length} / {rows.length} รายการ</span>
      </div>
      <DataTable columns={columns} rows={filtered} rowKey={(r) => r.id} initialSort={{ key: "created_at", dir: "desc" }}
        cellPad="px-3 py-2.5" headPad="px-3 py-2.5" maxHeight="66vh" empty="ไม่พบรายการตามเงื่อนไข" />
    </div>
  );
}
