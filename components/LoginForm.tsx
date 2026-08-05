"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn } from "@/lib/actions/auth";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending}
      className="w-full bg-ink text-white rounded-lg py-2.5 text-sm font-medium hover:bg-black disabled:opacity-50 transition-colors">
      {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(signIn, null);
  return (
    <form action={action} className="space-y-3.5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="block text-xs text-muted mb-1">ชื่อผู้ใช้</label>
        <input name="username" autoFocus autoComplete="username"
          className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">รหัสผ่าน</label>
        <input name="password" type="password" autoComplete="current-password"
          className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand" />
      </div>
      {state?.error && (
        <div className="text-xs text-danger bg-danger-soft border border-danger/20 rounded-lg px-3 py-2">
          {state.error}
          {typeof state.attemptsRemaining === "number" && state.attemptsRemaining > 0 &&
            <span className="text-muted"> · เหลือ {state.attemptsRemaining} ครั้ง</span>}
        </div>
      )}
      <Submit />
    </form>
  );
}
