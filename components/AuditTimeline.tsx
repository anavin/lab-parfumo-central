"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Download, Plus, Pencil, Trash2, RotateCcw, Flame, LogIn, LogOut,
  ShieldAlert, KeyRound, Check, Send, X, Activity, Users2, CalendarClock, Dot,
} from "lucide-react";
import { Select } from "@/components/ui/Select";
import { fmtDateTH, fmtTimeTH } from "@/lib/format";

type Tone = "success" | "info" | "danger" | "warn" | "brand" | "gray";
const ACTION: Record<string, { label: string; tone: Tone; icon: any }> = {
  create: { label: "สร้าง", tone: "success", icon: Plus },
  update: { label: "แก้ไข", tone: "info", icon: Pencil },
  delete: { label: "ลบ", tone: "warn", icon: Trash2 },
  restore: { label: "กู้คืน", tone: "brand", icon: RotateCcw },
  purge: { label: "ลบถาวร", tone: "danger", icon: Flame },
  login: { label: "เข้าสู่ระบบ", tone: "success", icon: LogIn },
  logout: { label: "ออกจากระบบ", tone: "gray", icon: LogOut },
  login_failed: { label: "เข้าไม่สำเร็จ", tone: "danger", icon: ShieldAlert },
  password: { label: "รหัสผ่าน", tone: "warn", icon: KeyRound },
  approve: { label: "อนุมัติ", tone: "success", icon: Check },
  submit: { label: "ส่งข้อมูล", tone: "info", icon: Send },
  reject: { label: "ตีกลับ", tone: "danger", icon: X },
};
const ENTITY: Record<string, string> = {
  requisition: "ใบเบิก", sale: "การขาย", cash: "เงินสด", customer: "ลูกค้า",
  submission: "รายการกรอก", shipment: "ส่งสินค้า", return: "คืนสินค้า",
  user: "ผู้ใช้", auth: "ระบบ", stock: "สต๊อก",
};
// same palette as <Badge> so the timeline reads as one system
const TONE_SOFT: Record<Tone, string> = {
  gray: "bg-line text-muted", brand: "bg-brand-soft text-brand-dark",
  success: "bg-success-soft text-success", danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info", warn: "bg-warn-soft text-warn",
};

type Row = { id: number; created_at: string; user_name: string; user_role: string; action: string; entity: string; detail: string };
const ALL = "__all";
const meta = (a: string) => ACTION[a] ?? { label: a, tone: "gray" as Tone, icon: Dot };

const bkkDay = (d: string | Date) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
function dayLabel(key: string): string {
  const today = bkkDay(new Date());
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (key === today) return "วันนี้";
  if (key === bkkDay(y)) return "เมื่อวาน";
  return fmtDateTH(key + "T00:00:00");
}

export function AuditTimeline({ rows, from = "", to = "" }: { rows: Row[]; from?: string; to?: string }) {
  const router = useRouter();
  const [action, setAction] = useState(ALL);
  const [entity, setEntity] = useState(ALL);
  const [user, setUser] = useState(ALL);
  const [text, setText] = useState("");
  // date range is server-side (it can reach past the default window) — changing it navigates
  const applyRange = (nf: string, nt: string) => {
    const p = new URLSearchParams();
    if (nf) p.set("from", nf);
    if (nt) p.set("to", nt);
    router.push(p.toString() ? `/audit?${p}` : "/audit");
  };

  const users = useMemo(() => [...new Set(rows.map((r) => r.user_name).filter(Boolean))].sort(), [rows]);
  const actions = useMemo(() => [...new Set(rows.map((r) => r.action))], [rows]);
  const entities = useMemo(() => [...new Set(rows.map((r) => r.entity))], [rows]);

  // headline stats (from the full set, so they don't jump around while filtering)
  const stats = useMemo(() => {
    const today = bkkDay(new Date());
    const todayN = rows.filter((r) => bkkDay(r.created_at) === today).length;
    const byAction = new Map<string, number>();
    for (const r of rows) byAction.set(r.action, (byAction.get(r.action) ?? 0) + 1);
    const top = [...byAction.entries()].sort((a, b) => b[1] - a[1])[0];
    return { total: rows.length, today: todayN, users: users.length, top: top ? meta(top[0]).label : "—", topN: top?.[1] ?? 0 };
  }, [rows, users.length]);

  const filtered = useMemo(() => {
    const q = text.trim().toLowerCase();
    return rows
      .filter((r) =>
        (action === ALL || r.action === action) &&
        (entity === ALL || r.entity === entity) &&
        (user === ALL || r.user_name === user) &&
        (!q || (r.detail ?? "").toLowerCase().includes(q) || (r.user_name ?? "").toLowerCase().includes(q)))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [rows, action, entity, user, text]);

  // group the filtered feed by day (newest first)
  const groups = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of filtered) {
      const k = bkkDay(r.created_at);
      (m.get(k) ?? m.set(k, []).get(k)!).push(r);
    }
    return [...m.entries()];   // filtered is already sorted desc → keys arrive newest-first
  }, [filtered]);

  const opt = (all: string, items: { value: string; label: string }[]) => [{ value: ALL, label: all }, ...items];

  const exportCSV = () => {
    if (!filtered.length) return;
    const esc = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const header = ["วันที่", "เวลา", "ผู้ใช้", "บทบาท", "การกระทำ", "ประเภท", "รายละเอียด"];
    const body = filtered.map((r) => [
      fmtDateTH(r.created_at), fmtTimeTH(r.created_at), r.user_name, r.user_role,
      meta(r.action).label, ENTITY[r.entity] ?? r.entity, r.detail,
    ].map(esc).join(","));
    const csv = "﻿" + [header.join(","), ...body].join("\r\n");
    const stamp = new Date().toLocaleDateString("en-CA");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url; a.download = `ประวัติการใช้งาน-${stamp}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const activeFilter = action !== ALL || entity !== ALL || user !== ALL || text.trim() !== "";
  const clearAll = () => { setAction(ALL); setEntity(ALL); setUser(ALL); setText(""); };

  return (
    <div className="space-y-5">
      {/* headline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatMini icon={Activity} tone="brand" label="กิจกรรมล่าสุด" value={stats.total.toLocaleString()} sub="รายการที่เก็บไว้" />
        <StatMini icon={CalendarClock} tone="success" label="วันนี้" value={stats.today.toLocaleString()} sub="เหตุการณ์วันนี้" />
        <StatMini icon={Users2} tone="info" label="ผู้ใช้ที่เคลื่อนไหว" value={stats.users.toLocaleString()} sub="คนที่มีบันทึก" />
        <StatMini icon={Dot} tone="warn" label="การกระทำที่พบบ่อย" value={stats.top} sub={`${stats.topN.toLocaleString()} ครั้ง`} />
      </div>

      {/* filter toolbar */}
      <div className="rounded-xl border border-line bg-surface p-2.5 sm:p-3">
        <div className="flex flex-col md:flex-row md:items-center gap-2.5">
          {/* search */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="ค้นหารายละเอียด หรือชื่อผู้ใช้"
              className="w-full border border-line rounded-lg pl-9 pr-9 h-10 text-sm bg-canvas/40 text-ink placeholder:text-muted-soft focus:outline-none focus:border-brand focus:bg-surface transition-colors" />
            {text && (
              <button onClick={() => setText("")} aria-label="ล้างคำค้นหา"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 grid place-items-center w-5 h-5 rounded-full text-muted hover:text-ink hover:bg-line">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* filters — fixed-width wrappers so the w-full Select doesn't stretch/stack */}
          <div className="flex items-center gap-2 [&>div]:h-10 [&_button]:h-10 [&_button]:rounded-lg">
            <div className="w-[132px] shrink-0"><Select value={user} onValueChange={setUser}
              options={opt("ผู้ใช้ทั้งหมด", users.map((u) => ({ value: u, label: u })))} /></div>
            <div className="w-[146px] shrink-0"><Select value={action} onValueChange={setAction}
              options={opt("การกระทำทั้งหมด", actions.map((a) => ({ value: a, label: meta(a).label })))} /></div>
            <div className="w-[128px] shrink-0"><Select value={entity} onValueChange={setEntity}
              options={opt("ประเภททั้งหมด", entities.map((e) => ({ value: e, label: ENTITY[e] ?? e })))} /></div>
          </div>
        </div>

        {/* date range (server-side) */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm">
          <CalendarClock className="w-4 h-4 text-muted" />
          <span className="text-xs text-muted">ช่วงวันที่:</span>
          <input type="date" value={from} max={to || undefined} onChange={(e) => applyRange(e.target.value, to)}
            className="border border-line rounded-lg px-2.5 h-9 text-sm bg-canvas/40 text-ink focus:outline-none focus:border-brand" />
          <span className="text-muted">–</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => applyRange(from, e.target.value)}
            className="border border-line rounded-lg px-2.5 h-9 text-sm bg-canvas/40 text-ink focus:outline-none focus:border-brand" />
          {(from || to) && (
            <button onClick={() => applyRange("", "")}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink px-2 py-1 rounded-md hover:bg-canvas">
              <X className="w-3.5 h-3.5" /> ล้างช่วงวันที่
            </button>
          )}
        </div>

        {/* result count + clear + export */}
        <div className="mt-2.5 pt-2.5 border-t border-line-soft flex items-center gap-2">
          <span className="text-xs text-muted">
            แสดง <b className="text-ink tabular-nums font-semibold">{filtered.length.toLocaleString()}</b>
            {filtered.length !== rows.length && <span className="tabular-nums"> จาก {rows.length.toLocaleString()}</span>} รายการ
          </span>
          {activeFilter && (
            <button onClick={clearAll}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink px-2 py-1 rounded-md hover:bg-canvas">
              <X className="w-3.5 h-3.5" /> ล้างตัวกรอง
            </button>
          )}
          <button onClick={exportCSV} disabled={!filtered.length}
            className="ml-auto inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-line text-sm font-medium text-ink bg-surface hover:bg-canvas disabled:opacity-50 whitespace-nowrap"
            title="ส่งออกรายการที่กรองไว้เป็นไฟล์ CSV (เปิดใน Excel ได้)">
            <Download className="w-4 h-4" /> ส่งออก CSV
          </button>
        </div>
      </div>

      {/* timeline feed */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface py-16 text-center text-sm text-muted">
          {activeFilter ? "ไม่พบรายการตามเงื่อนไข" : "ยังไม่มีบันทึกกิจกรรม"}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([day, items]) => (
            <section key={day}>
              <div className="sticky top-0 z-10 -mx-1 mb-2 flex items-center gap-2 bg-canvas/85 backdrop-blur px-1 py-1.5">
                <h3 className="text-sm font-semibold text-ink">{dayLabel(day)}</h3>
                <span className="text-[11px] text-muted tabular-nums">· {items.length} รายการ</span>
                <div className="flex-1 h-px bg-line-soft" />
              </div>
              <ol className="relative ml-3 border-l border-line-soft">
                {items.map((r) => {
                  const m = meta(r.action);
                  const Icon = m.icon;
                  return (
                    <li key={r.id} className="relative pl-6 pb-3 last:pb-0">
                      <span className={`absolute -left-[13px] top-0.5 grid place-items-center w-[26px] h-[26px] rounded-full ring-4 ring-canvas ${TONE_SOFT[m.tone]}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div className="rounded-lg border border-line bg-surface px-3 py-2 hover:border-brand/30 transition-colors">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${TONE_SOFT[m.tone]}`}>{m.label}</span>
                          <span className="text-[12px] text-muted">{ENTITY[r.entity] ?? r.entity}</span>
                          <span className="text-[13px] font-medium text-ink">{r.user_name || "—"}</span>
                          {r.user_role === "admin" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-soft text-brand-dark font-medium">admin</span>}
                          <span className="ml-auto text-[11px] text-muted tabular-nums whitespace-nowrap">{fmtTimeTH(r.created_at)} น.</span>
                        </div>
                        {r.detail && <p className="mt-1 text-[13px] text-ink-soft leading-snug break-words">{r.detail}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function StatMini({ icon: Icon, tone, label, value, sub }:
  { icon: any; tone: Tone; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3.5 flex items-start gap-3">
      <span className={`grid place-items-center w-9 h-9 rounded-lg shrink-0 ${TONE_SOFT[tone]}`}><Icon className="w-4 h-4" /></span>
      <div className="min-w-0">
        <div className="text-[11px] text-muted font-medium">{label}</div>
        <div className="text-lg font-bold text-ink leading-tight truncate">{value}</div>
        <div className="text-[10px] text-muted-soft truncate">{sub}</div>
      </div>
    </div>
  );
}
