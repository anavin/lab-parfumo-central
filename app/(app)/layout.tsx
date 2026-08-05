import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { requireUser } from "@/lib/auth/require-user";
import { pendingCount } from "@/lib/queries";

// Staff may only reach their own workspace; everything else is admin-only.
const STAFF_ALLOWED = ["/my"];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const path = (await headers()).get("x-pathname") || "";
  if (user.role !== "admin" && !STAFF_ALLOWED.some((p) => path === p || path.startsWith(p + "/"))) {
    redirect("/my");
  }
  const pending = user.role === "admin" ? await pendingCount() : 0;
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar user={user} pending={pending} />
      <main className="flex-1 min-w-0 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
