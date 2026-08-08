import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { isSafeNext } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && isSafeNext(next) ? next : "/";
  if (await getCurrentUser()) redirect(safeNext);

  return (
    <div className="min-h-screen min-h-dvh flex flex-col items-center justify-start sm:justify-center bg-nav px-4 py-10 sm:py-4 overflow-y-auto">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white font-bold text-lg shadow">LP</div>
            <div className="text-left">
              <div className="text-lg font-bold text-white">Lab Parfumo</div>
              <div className="text-xs text-brand">centralwOrld</div>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-7 shadow-pop">
          <h1 className="text-[17px] font-bold text-ink mb-1">เข้าสู่ระบบ</h1>
          <p className="text-[12.5px] text-muted mb-5">กรอกชื่อผู้ใช้และรหัสผ่าน</p>
          <LoginForm next={safeNext} />
        </div>
      </div>
    </div>
  );
}
