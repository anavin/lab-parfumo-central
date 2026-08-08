import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { IdleLogout } from "@/components/IdleLogout";
import { requireUser } from "@/lib/auth/require-user";
import { can, permissionForPath, landingFor } from "@/lib/auth/permissions";
import { pendingCount } from "@/lib/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const path = (await headers()).get("x-pathname") || "";
  // Enforce menu-level access: if this path maps to a permission the user
  // lacks, send them to the first page they can see.
  const perm = permissionForPath(path);
  if (perm && !can(user, perm)) redirect(landingFor(user));
  const pending = can(user, "review") ? await pendingCount() : 0;
  return (
    <div className="app-shell flex min-h-screen bg-canvas">
      <IdleLogout />
      <Sidebar user={user} pending={pending} />
      <main className="app-main flex-1 min-w-0 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
