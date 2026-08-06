"use client";
// In-app confirm dialog — replaces window.confirm() which shows the site URL on
// mobile. Renders nothing when closed.
export function ConfirmDialog({ open, title, message, confirmLabel = "ยืนยัน", danger = false, pending = false, onConfirm, onCancel }: {
  open: boolean; title: string; message?: string; confirmLabel?: string; danger?: boolean; pending?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-xs p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
        {message && <p className="text-sm text-muted mb-4">{message}</p>}
        <div className={"flex gap-2 justify-end" + (message ? "" : " mt-4")}>
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-line text-sm hover:bg-canvas">ยกเลิก</button>
          <button onClick={onConfirm} disabled={pending}
            className={"px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 " + (danger ? "bg-red-600 hover:bg-red-700" : "bg-brand hover:bg-brand-dark")}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
