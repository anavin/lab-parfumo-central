import { Users, LogIn } from "lucide-react";
import { PageHeader, Card } from "@/components/ui";
import { requirePermission } from "@/lib/auth/require-user";
import { q } from "@/lib/db";
import { loginHistory } from "@/lib/queries";
import { fmtDateTH, fmtTimeTH } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/auth/permissions";
import { UsersManager } from "@/components/UsersManager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await requirePermission("users");
  type URow = { id: number; username: string; full_name: string; role: string; permissions: string[] | null; is_active: boolean; last_login_at: string | null; branch: string | null };
  const usersSel = (branchCol: string) => `select id, username, full_name, role, permissions, is_active, last_login_at, ${branchCol} as branch from users order by role, username`;
  let users: URow[];
  try { users = await q<URow>(usersSel("branch")); }
  catch (e: any) { if (e?.code !== "42703") throw e; users = await q<URow>(usersSel("null::text")); }   // 0026 not run yet
  const logins = await loginHistory(5);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader icon={Users} title="จัดการผู้ใช้ & สิทธิ์" subtitle={`${users.length} บัญชี · กำหนดบทบาทและสิทธิ์การเข้าถึงรายเมนู`} />
      <Card bodyClass="p-0">
        <UsersManager users={users} meId={me.id} />
      </Card>

      {/* login history — last 5 days */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-1.5">
          <LogIn className="w-4 h-4 text-brand-dark" /> ประวัติการเข้าใช้งาน 5 วันล่าสุด
          <span className="text-xs font-normal text-muted">· {logins.length} ครั้ง</span>
        </h2>
        <Card bodyClass="p-0">
          <div className="max-h-[440px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas sticky top-0">
                <tr className="th border-b border-line-soft text-left">
                  <th className="px-5 py-2.5">ผู้ใช้</th>
                  <th className="px-3 py-2.5">บทบาท</th>
                  <th className="px-5 py-2.5">วันที่ · เวลา</th>
                </tr>
              </thead>
              <tbody>
                {logins.map((l, i) => (
                  <tr key={i} className="border-b border-line-soft last:border-0">
                    <td className="px-5 py-2.5 font-medium text-ink whitespace-nowrap">{l.user_name}</td>
                    <td className="px-3 py-2.5 text-muted">{ROLE_LABEL[(l.user_role || "") as keyof typeof ROLE_LABEL] ?? l.user_role ?? "-"}</td>
                    <td className="px-5 py-2.5 whitespace-nowrap">
                      <span className="text-ink text-xs font-medium">{fmtDateTH(l.created_at)}</span>
                      <span className="text-muted text-[11px] tabular-nums ml-1.5">{fmtTimeTH(l.created_at)} น.</span>
                    </td>
                  </tr>
                ))}
                {logins.length === 0 && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-muted">ยังไม่มีการเข้าใช้งานใน 5 วันนี้</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
