"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Tag, Check, X } from "lucide-react";
import { savePromotion, setPromotionActive, deletePromotion, type Promotion } from "@/lib/actions/promotions";
import { baht } from "@/lib/format";

const bkkToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
const thDate = (iso: string) => { const [y, m, d] = (iso || "").split("-"); return d ? `${+d}/${+m}/${(+y + 543) % 100}` : iso; };
const inShown = (p: Promotion) => { const t = bkkToday(); return p.active && p.start_date <= t && p.end_date >= t; };
const key = (g: string, s: string) => `${g}|${s}`;

type Draft = { id?: number; name: string; start_date: string; end_date: string; active: boolean; prices: Record<string, string> };
const blank = (): Draft => ({ name: "", start_date: bkkToday(), end_date: bkkToday(), active: true, prices: {} });
const toDraft = (p: Promotion): Draft => ({ id: p.id, name: p.name, start_date: p.start_date, end_date: p.end_date, active: p.active,
  prices: Object.fromEntries(Object.entries(p.prices || {}).map(([k, v]) => [k, String(v)])) });

const inp = "border border-line rounded-lg px-2.5 py-2 text-sm bg-surface text-ink focus:outline-none focus:border-brand";

export function PromotionManager({ promotions, grades, sizes }: { promotions: Promotion[]; grades: string[]; sizes: string[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, start] = useTransition();

  const save = () => start(async () => {
    if (!draft) return;
    setErr(null);
    const prices: Record<string, number> = {};
    for (const [k, v] of Object.entries(draft.prices)) { const n = Math.round(Number(v) || 0); if (n > 0) prices[k] = n; }
    const r = await savePromotion({ id: draft.id, name: draft.name, start_date: draft.start_date, end_date: draft.end_date, active: draft.active, prices });
    if (r.ok) { setDraft(null); router.refresh(); } else setErr(r.error ?? "บันทึกไม่สำเร็จ");
  });
  const toggle = (p: Promotion) => start(async () => { await setPromotionActive(p.id, !p.active); router.refresh(); });
  const remove = (p: Promotion) => { if (confirm(`ลบโปรโมชัน "${p.name}"?`)) start(async () => { await deletePromotion(p.id); router.refresh(); }); };

  // ---- editor ----
  if (draft) {
    const setCell = (g: string, s: string, v: string) => setDraft((d) => d && ({ ...d, prices: { ...d.prices, [key(g, s)]: v.replace(/[^\d]/g, "") } }));
    return (
      <div className="card p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-brand" />
          <h3 className="text-base font-semibold text-ink">{draft.id ? "แก้ไขโปรโมชัน" : "โปรโมชันใหม่"}</h3>
          <button onClick={() => setDraft(null)} className="ml-auto text-muted hover:text-ink"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <label className="sm:col-span-2 block"><span className="text-xs text-muted mb-1 block">ชื่อโปร *</span>
            <input className={inp + " w-full"} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="เช่น Grand Opening Sale" /></label>
          <label className="block"><span className="text-xs text-muted mb-1 block">เริ่ม *</span>
            <input type="date" className={inp + " w-full"} value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} /></label>
          <label className="block"><span className="text-xs text-muted mb-1 block">สิ้นสุด *</span>
            <input type="date" className={inp + " w-full"} value={draft.end_date} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} /></label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="accent-brand w-4 h-4" />
          เปิดใช้งาน (ราคาโปรจะมีผลในช่วงวันที่ข้างบน)
        </label>

        <div>
          <div className="text-sm font-medium text-ink mb-1">ราคาพิเศษ · เกรด × ขนาด <span className="text-xs text-muted font-normal">(เว้นว่าง = ใช้ราคาปกติ)</span></div>
          {grades.length === 0 ? <div className="text-sm text-muted py-4">ไม่พบเกรด/ขนาดในระบบสินค้า</div> : (
            <div className="overflow-x-auto">
              <table className="text-sm border-collapse" style={{ minWidth: 360 }}>
                <thead><tr className="text-muted text-xs">
                  <th className="text-left px-2 pb-2 font-medium">เกรด</th>
                  {sizes.map((s) => <th key={s} className="px-2 pb-2 font-medium text-center whitespace-nowrap">{s}</th>)}
                </tr></thead>
                <tbody>
                  {grades.map((g) => (
                    <tr key={g} className="border-t border-line-soft">
                      <td className="px-2 py-1.5 font-medium text-ink whitespace-nowrap">{g}</td>
                      {sizes.map((s) => (
                        <td key={s} className="px-1 py-1 text-center">
                          <input inputMode="numeric" value={draft.prices[key(g, s)] ?? ""} onChange={(e) => setCell(g, s, e.target.value)}
                            placeholder="—" className="w-20 text-center tabular-nums border border-line rounded-lg px-2 py-1.5 text-sm bg-surface focus:outline-none focus:border-brand" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {err && <div className="text-sm text-danger">{err}</div>}
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="btn btn-brand">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} บันทึกโปร
          </button>
          <button onClick={() => setDraft(null)} className="btn btn-ghost">ยกเลิก</button>
        </div>
      </div>
    );
  }

  // ---- list ----
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setDraft(blank())} className="btn btn-brand"><Plus className="w-4 h-4" /> โปรใหม่</button>
      </div>
      {promotions.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">ยังไม่มีโปรโมชัน — กด “โปรใหม่” เพื่อตั้งราคาพิเศษตามช่วงเวลา</div>
      ) : promotions.map((p) => {
        const live = inShown(p);
        const n = Object.keys(p.prices || {}).length;
        return (
          <div key={p.id} className="card p-4 flex items-center gap-3">
            <Tag className={"w-5 h-5 shrink-0 " + (live ? "text-success" : "text-muted")} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-ink">{p.name}</span>
                {live ? <span className="chip-success text-[11px]">กำลังใช้งาน</span>
                  : p.active ? <span className="chip-muted text-[11px]">ตามช่วงวันที่</span>
                  : <span className="chip-muted text-[11px]">ปิด</span>}
              </div>
              <div className="text-xs text-muted mt-0.5">{thDate(p.start_date)} – {thDate(p.end_date)} · ตั้งราคา {n} ช่อง</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => toggle(p)} disabled={saving} title={p.active ? "ปิด" : "เปิด"}
                className={"text-xs px-2 py-1 rounded-lg border " + (p.active ? "border-line text-muted hover:bg-canvas" : "border-brand text-brand hover:bg-brand-soft")}>
                {p.active ? "ปิด" : "เปิด"}
              </button>
              <button onClick={() => setDraft(toDraft(p))} className="p-1.5 rounded-lg text-muted hover:bg-canvas" title="แก้ไข"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(p)} className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-canvas" title="ลบ"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
