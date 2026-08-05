"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, KeyRound, Power } from "lucide-react";
import { createUser, setUserActive, resetPassword } from "@/lib/actions/auth";
import { Badge } from "@/components/ui";

type U = { id: number; username: string; full_name: string; role: string; is_active: boolean; last_login_at: string | null };
const inp = "w-full border border-line rounded-lg px-2.5 py-2 text-sm bg-surface focus:outline-none focus:border-brand";

export function UsersManager({ users, meId }: { users: U[]; meId: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ username: "", full_name: "", role: "staff", password: "" });
  const [msg, setMsg] = useState("");
  const s = (k: string, v: string) => setF((o) => ({ ...o, [k]: v }));

  const add = () => start(async () => {
    setMsg("");
    try { await createUser(f); setF({ username: "", full_name: "", role: "staff", password: "" }); setOpen(false); router.refresh(); }
    catch (e: any) { setMsg(e?.message ?? "เพิ่มไม่สำเร็จ"); }
  });
  const toggle = (u: U) => start(async () => {
    try { await setUserActive(u.id, !u.is_active); router.refresh(); } catch (e: any) { alert(e?.message ?? "ทำไม่สำเร็จ"); }
  });
  const reset = (u: U) => {
    const pw = prompt(`ตั้งรหัสผ่านใหม่ให้ @${u.username} (อย่างน้อย 8 ตัว มีตัวอักษร+ตัวเลข)`);
    if (!pw) return;
    start(async () => { try { await resetPassword(u.id, pw); alert("รีเซ็ตรหัสผ่านแล้ว · ผู้ใช้ต้องล็อกอินใหม่"); } catch (e: any) { alert(e?.message); } });
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
            <select className={inp} value={f.role} onChange={(e) => s("role", e.target.value)}><option value="staff">พนักงาน</option><option value="admin">ผู้ดูแลระบบ</option></select></label>
          <label className="block"><span className="text-xs text-muted mb-1 block">รหัสผ่าน</span>
            <input className={inp} type="text" value={f.password} onChange={(e) => s("password", e.target.value)} placeholder="8+ ตัว อักษร+เลข" /></label>
          {msg && <div className="md:col-span-4 text-xs text-danger">{msg}</div>}
          <div className="md:col-span-4 text-right">
            <button onClick={add} disabled={pending} className="btn btn-primary text-sm">เพิ่มผู้ใช้</button>
          </div>
        </div>
      )}

      <table className="w-full text-sm">
        <thead className="bg-canvas"><tr className="th border-b border-line-soft">
          <th className="px-5 py-2.5">ผู้ใช้</th><th className="px-3 py-2.5">บทบาท</th>
          <th className="px-3 py-2.5">สถานะ</th><th className="px-3 py-2.5">เข้าล่าสุด</th><th className="px-5 py-2.5 text-right">จัดการ</th>
        </tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-line-soft last:border-0">
              <td className="px-5 py-3">
                <div className="font-medium text-ink">{u.full_name}{u.id === meId && <span className="text-[11px] text-brand-dark ml-1">(คุณ)</span>}</div>
                <div className="text-[11px] text-muted-soft">@{u.username}</div>
              </td>
              <td className="px-3 py-3"><Badge tone={u.role === "admin" ? "brand" : "gray"}>{u.role === "admin" ? "ผู้ดูแล" : "พนักงาน"}</Badge></td>
              <td className="px-3 py-3">{u.is_active ? <Badge tone="success">ใช้งาน</Badge> : <Badge tone="danger">ปิด</Badge>}</td>
              <td className="px-3 py-3 text-muted text-xs">{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" }) : "-"}</td>
              <td className="px-5 py-3 text-right whitespace-nowrap">
                <button onClick={() => reset(u)} disabled={pending} title="รีเซ็ตรหัสผ่าน" className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink px-2 py-1 rounded hover:bg-line-soft"><KeyRound className="w-3.5 h-3.5" /></button>
                {u.id !== meId && (
                  <button onClick={() => toggle(u)} disabled={pending} title={u.is_active ? "ปิดบัญชี" : "เปิดบัญชี"} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-line-soft ${u.is_active ? "text-danger" : "text-success"}`}><Power className="w-3.5 h-3.5" /></button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
