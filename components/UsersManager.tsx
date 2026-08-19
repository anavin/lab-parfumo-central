"use client";
import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, KeyRound, Power, ShieldCheck, Check, ChevronDown, RotateCcw, Pencil, Trash2 } from "lucide-react";
import { createUser, setUserActive, resetPassword, updateUserAccess, updateUserProfile, deleteUser, setUserBranch } from "@/lib/actions/auth";
import { branchOptions } from "@/lib/branches";
import { Badge } from "@/components/ui";
import { Select } from "@/components/ui/Select";
import {
  ROLES, ROLE_LABEL, ROLE_PRESETS, PERMISSIONS, ALL_PERM_KEYS,
  effectivePermissions, type PermKey, type RoleKey,
} from "@/lib/auth/permissions";

type U = { id: number; username: string; full_name: string; role: string; permissions: string[] | null; is_active: boolean; last_login_at: string | null; branch?: string | null };
const inp = "w-full border border-line rounded-lg px-2.5 py-2 text-sm bg-surface focus:outline-none focus:border-brand";

function presetSet(role: string): Set<PermKey> {
  const p = ROLE_PRESETS[role as RoleKey];
  if (!p) return new Set();
  return new Set(p[0] === "*" ? ALL_PERM_KEYS : (p as PermKey[]));
}
const eq = (a: Set<PermKey>, b: Set<PermKey>) => a.size === b.size && [...a].every((k) => b.has(k));

// group PERMISSIONS by their .group for the checkbox matrix
const PERM_GROUPS = PERMISSIONS.reduce<Record<string, typeof PERMISSIONS>>((m, p) => {
  (m[p.group] ??= []).push(p); return m;
}, {});

export function UsersManager({ users, meId }: { users: U[]; meId: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ username: "", full_name: "", role: "staff", password: "" });
  const [msg, setMsg] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const s = (k: string, v: string) => setF((o) => ({ ...o, [k]: v }));

  const add = () => start(async () => {
    setMsg("");
    try {
      const r = await createUser(f);
      if (r?.ok) { setF({ username: "", full_name: "", role: "staff", password: "" }); setOpen(false); router.refresh(); }
      else setMsg(r?.error ?? "เพิ่มไม่สำเร็จ");
    } catch { setMsg("เพิ่มไม่สำเร็จ ลองใหม่อีกครั้ง"); }
  });
  const toggle = (u: U) => start(async () => {
    try { const r = await setUserActive(u.id, !u.is_active); if (r?.ok) router.refresh(); else alert(r?.error ?? "ทำไม่สำเร็จ"); }
    catch { alert("ทำไม่สำเร็จ ลองใหม่อีกครั้ง"); }
  });
  const del = (u: U) => {
    if (!confirm(`ลบผู้ใช้ @${u.username} ถาวร?\nผู้ใช้ที่มีประวัติการขายจะลบไม่ได้ — ให้ใช้ “ปิดบัญชี” แทน`)) return;
    start(async () => {
      try { const r = await deleteUser(u.id); if (r?.ok) router.refresh(); else alert(r?.error ?? "ลบไม่สำเร็จ"); }
      catch { alert("ลบไม่สำเร็จ ลองใหม่อีกครั้ง"); }
    });
  };
  const reset = (u: U) => {
    const pw = prompt(`ตั้งรหัสผ่านใหม่ให้ @${u.username} (อย่างน้อย 8 ตัว มีตัวอักษร+ตัวเลข)`);
    if (!pw) return;
    start(async () => {
      try {
        const r = await resetPassword(u.id, pw);
        alert(r?.ok ? "รีเซ็ตรหัสผ่านแล้ว · ผู้ใช้ต้องล็อกอินใหม่" : (r?.error ?? "รีเซ็ตไม่สำเร็จ"));
      } catch { alert("รีเซ็ตไม่สำเร็จ ลองใหม่อีกครั้ง"); }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between px-5 py-3 border-b border-line-soft">
        <span className="text-[13px] text-muted">ผู้ใช้ทั้งหมด</span>
        <button onClick={() => setOpen((o) => !o)} className="btn btn-brand text-[13px] !py-1.5">
          <UserPlus className="w-4 h-4" /> {open ? "ปิด" : "เพิ่มผู้ใช้"}
        </button>
      </div>

      {open && (
        <div className="px-5 py-4 bg-canvas border-b border-line-soft grid md:grid-cols-4 gap-3 items-end">
          <label className="block"><span className="text-xs text-muted mb-1 block">ชื่อผู้ใช้ (username)</span>
            <input className={inp} value={f.username} onChange={(e) => s("username", e.target.value)} placeholder="เช่น somchai" /></label>
          <label className="block"><span className="text-xs text-muted mb-1 block">ชื่อ-นามสกุล</span>
            <input className={inp} value={f.full_name} onChange={(e) => s("full_name", e.target.value)} /></label>
          <label className="block"><span className="text-xs text-muted mb-1 block">บทบาท</span>
            <Select value={f.role} onValueChange={(v) => s("role", v)}
              options={ROLES.map((r) => ({ value: r.key, label: r.label }))} className="py-2.5" /></label>
          <label className="block"><span className="text-xs text-muted mb-1 block">รหัสผ่าน</span>
            <input className={inp} type="text" value={f.password} onChange={(e) => s("password", e.target.value)} placeholder="8+ ตัว อักษร+เลข" /></label>
          <p className="md:col-span-4 text-[11px] text-muted-soft -mt-1">{ROLES.find((r) => r.key === f.role)?.desc}</p>
          {msg && <div className="md:col-span-4 text-xs text-danger">{msg}</div>}
          <div className="md:col-span-4 text-right">
            <button onClick={add} disabled={pending} className="btn btn-primary text-sm">เพิ่มผู้ใช้</button>
          </div>
        </div>
      )}

      <table className="w-full text-sm">
        <thead className="bg-canvas"><tr className="th border-b border-line-soft">
          <th className="px-5 py-2.5">ผู้ใช้</th><th className="px-3 py-2.5">บทบาท / สิทธิ์</th>
          <th className="px-3 py-2.5">สถานะ</th><th className="px-3 py-2.5 hidden sm:table-cell">เข้าล่าสุด</th><th className="px-5 py-2.5 text-right">จัดการ</th>
        </tr></thead>
        <tbody>
          {users.map((u) => {
            const custom = !!(u.permissions && u.permissions.length);
            const count = effectivePermissions(u).length;
            return (
              <Fragment key={u.id}>
                <tr className="border-b border-line-soft last:border-0 align-top">
                  <td className="px-5 py-3">
                    <div className="font-medium text-ink">{u.full_name}{u.id === meId && <span className="text-[11px] text-brand-dark ml-1">(คุณ)</span>}</div>
                    <div className="text-[11px] text-muted-soft">@{u.username}</div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={u.role === "admin" ? "brand" : "gray"}>{ROLE_LABEL[u.role] ?? u.role}</Badge>
                    <div className="text-[11px] text-muted-soft mt-1">
                      {u.role === "admin" ? "ทุกเมนู" : custom ? `กำหนดเอง · ${count} เมนู` : `ค่าเริ่มต้น · ${count} เมนู`}
                    </div>
                    <div className="mt-1.5"><BranchAssign u={u} /></div>
                  </td>
                  <td className="px-3 py-3">{u.is_active ? <Badge tone="success">ใช้งาน</Badge> : <Badge tone="danger">ปิด</Badge>}</td>
                  <td className="px-3 py-3 text-muted text-xs hidden sm:table-cell">{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit", timeZone: "Asia/Bangkok" }) : "-"}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button onClick={() => { setProfileId((v) => (v === u.id ? null : u.id)); setEditId(null); }} disabled={pending} title="แก้ไขชื่อ / username"
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-line-soft ${profileId === u.id ? "text-brand-dark bg-brand/10" : "text-muted hover:text-ink"}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { setEditId((v) => (v === u.id ? null : u.id)); setProfileId(null); }} disabled={pending} title="จัดการสิทธิ์"
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-line-soft ${editId === u.id ? "text-brand-dark bg-brand/10" : "text-muted hover:text-ink"}`}>
                      <ShieldCheck className="w-3.5 h-3.5" /><ChevronDown className={`w-3 h-3 transition-transform ${editId === u.id ? "rotate-180" : ""}`} />
                    </button>
                    <button onClick={() => reset(u)} disabled={pending} title="รีเซ็ตรหัสผ่าน" className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink px-2 py-1 rounded hover:bg-line-soft"><KeyRound className="w-3.5 h-3.5" /></button>
                    {u.id !== meId && (
                      <button onClick={() => toggle(u)} disabled={pending} title={u.is_active ? "ปิดบัญชี" : "เปิดบัญชี"} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-line-soft ${u.is_active ? "text-danger" : "text-success"}`}><Power className="w-3.5 h-3.5" /></button>
                    )}
                    {u.id !== meId && (
                      <button onClick={() => del(u)} disabled={pending} title="ลบผู้ใช้ถาวร" className="inline-flex items-center gap-1 text-xs text-danger px-2 py-1 rounded hover:bg-danger-soft"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </td>
                </tr>
                {profileId === u.id && (
                  <tr className="border-b border-line-soft bg-canvas">
                    <td colSpan={5} className="px-5 py-4">
                      <ProfileEditor u={u} onClose={() => setProfileId(null)} onSaved={() => { setProfileId(null); router.refresh(); }} />
                    </td>
                  </tr>
                )}
                {editId === u.id && (
                  <tr className="border-b border-line-soft bg-canvas">
                    <td colSpan={5} className="px-5 py-4">
                      <AccessEditor u={u} onClose={() => setEditId(null)} onSaved={() => { setEditId(null); router.refresh(); }} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// edit a user's display name + login username
function ProfileEditor({ u, onClose, onSaved }: { u: U; onClose: () => void; onSaved: () => void }) {
  const [pending, start] = useTransition();
  const [fullName, setFullName] = useState(u.full_name);
  const [username, setUsername] = useState(u.username);
  const [err, setErr] = useState("");
  const save = () => start(async () => {
    setErr("");
    try {
      const r = await updateUserProfile(u.id, { full_name: fullName, username });
      if (r?.ok) onSaved(); else setErr(r?.error ?? "บันทึกไม่สำเร็จ");
    } catch { setErr("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง"); }
  });
  return (
    <div className="max-w-lg">
      <div className="text-[13px] font-medium text-ink mb-2">แก้ไขข้อมูลผู้ใช้</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block"><span className="text-xs text-muted mb-1 block">ชื่อ-นามสกุล</span>
          <input className={inp} value={fullName} onChange={(e) => setFullName(e.target.value)} /></label>
        <label className="block"><span className="text-xs text-muted mb-1 block">Username (ใช้ล็อกอิน)</span>
          <input className={inp} value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="a-z 0-9 . _ -" /></label>
      </div>
      <div className="text-[11px] text-muted-soft mt-1.5">เปลี่ยน username แล้ว ผู้ใช้ต้องล็อกอินด้วยชื่อใหม่ในครั้งถัดไป</div>
      {err && <div className="text-xs text-danger mt-2">{err}</div>}
      <div className="flex gap-2 justify-end mt-3">
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-line text-sm hover:bg-canvas">ยกเลิก</button>
        <button onClick={save} disabled={pending} className="px-4 py-1.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">บันทึก</button>
      </div>
    </div>
  );
}

function AccessEditor({ u, onClose, onSaved }: { u: U; onClose: () => void; onSaved: () => void }) {
  const [pending, start] = useTransition();
  const [role, setRole] = useState<string>(u.role);
  const [perms, setPerms] = useState<Set<PermKey>>(
    () => (u.permissions && u.permissions.length)
      ? new Set(u.permissions.filter((k): k is PermKey => (ALL_PERM_KEYS as string[]).includes(k)))
      : presetSet(u.role),
  );
  const isAdmin = role === "admin";
  const shown: Set<PermKey> = isAdmin ? new Set(ALL_PERM_KEYS) : perms;
  const inherits = isAdmin || eq(shown, presetSet(role));

  const pickRole = (r: RoleKey) => { setRole(r); setPerms(presetSet(r)); };
  const togglePerm = (k: PermKey) => { if (isAdmin) return; setPerms((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; }); };
  const resetToPreset = () => setPerms(presetSet(role));

  const save = () => start(async () => {
    try {
      const custom = !isAdmin && !eq(perms, presetSet(role));
      const r = await updateUserAccess(u.id, role, custom ? [...perms] : null);
      if (r?.ok) onSaved(); else alert(r?.error ?? "บันทึกไม่สำเร็จ");
    } catch { alert("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง"); }
  });

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-[13px] font-medium text-ink mb-2">บทบาท</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {ROLES.map((r) => (
          <button key={r.key} onClick={() => pickRole(r.key)}
            className={`px-3 py-1.5 rounded-lg text-[13px] border transition-colors ${role === r.key ? "border-brand bg-brand/10 text-brand-dark font-medium" : "border-line text-muted hover:bg-line-soft"}`}>
            {r.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted-soft -mt-2 mb-4">{ROLES.find((r) => r.key === role)?.desc}</p>

      <div className="flex items-center justify-between mb-2">
        <div className="text-[13px] font-medium text-ink">สิทธิ์การเข้าถึงเมนู
          <span className={`ml-2 text-[11px] font-normal ${inherits ? "text-muted-soft" : "text-brand-dark"}`}>
            {isAdmin ? "· ทุกเมนู (แก้ไม่ได้)" : inherits ? "· ใช้ค่าเริ่มต้นของบทบาท" : "· กำหนดเอง"}
          </span>
        </div>
        {!isAdmin && !inherits && (
          <button onClick={resetToPreset} className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink"><RotateCcw className="w-3 h-3" /> คืนค่าเริ่มต้น</button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-3">
        {Object.entries(PERM_GROUPS).map(([g, items]) => (
          <div key={g}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-soft mb-1.5">{g}</div>
            <div className="space-y-1">
              {items.map((p) => {
                const on = shown.has(p.key);
                return (
                  <button key={p.key} onClick={() => togglePerm(p.key)} disabled={isAdmin}
                    className={`flex w-full items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] text-left transition-colors ${isAdmin ? "opacity-60 cursor-not-allowed" : "hover:bg-line-soft"}`}>
                    <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${on ? "bg-brand border-brand text-white" : "border-line bg-surface"}`}>
                      {on && <Check className="w-3 h-3" strokeWidth={3} />}
                    </span>
                    <span className={on ? "text-ink" : "text-muted"}>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-line-soft">
        <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-lg text-muted hover:bg-line-soft">ยกเลิก</button>
        <button onClick={save} disabled={pending} className="btn btn-primary text-sm">{pending ? "กำลังบันทึก…" : "บันทึกสิทธิ์"}</button>
      </div>
    </div>
  );
}

// Admin assigns a user's home branch; /my defaults to it (the salesperson can still switch).
function BranchAssign({ u }: { u: U }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const change = (v: string) => start(async () => {
    const r = await setUserBranch(u.id, v || null);
    if (r?.ok) router.refresh(); else alert(r?.error ?? "บันทึกสาขาไม่สำเร็จ");
  });
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-soft shrink-0">สาขา</span>
      <Select value={u.branch ?? ""} onValueChange={change}
        options={[{ value: "", label: "ค่าเริ่มต้น" }, ...branchOptions()]}
        className={"py-1 text-[11px] min-w-[130px]" + (pending ? " opacity-50 pointer-events-none" : "")} />
    </div>
  );
}
