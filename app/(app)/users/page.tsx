import { Users } from "lucide-react";
import { PageHeader, Card } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/require-user";
import { q } from "@/lib/db";
import { UsersManager } from "@/components/UsersManager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await requireAdmin();
  const users = await q<{ id: number; username: string; full_name: string; role: string; is_active: boolean; last_login_at: string | null }>(
    `select id, username, full_name, role, is_active, last_login_at from users order by role, username`);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[900px] mx-auto">
      <PageHeader icon={Users} title="จัดการผู้ใช้" subtitle={`${users.length} บัญชี · เฉพาะผู้ดูแลระบบ`} />
      <Card bodyClass="p-0">
        <UsersManager users={users} meId={me.id} />
      </Card>
    </div>
  );
}
