"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip } from "lucide-react";
import { PhotoStrip } from "@/components/BillPhotos";
import { compressImage } from "@/lib/img";
import { addPoAttachments, deletePoAttachment, type PoAttachment } from "@/lib/actions/po-attachments";

/** Attach / view files on a requisition (packing slip photos, etc.). Editable while
 *  the requisition isn't received yet. */
export function RequisitionAttachments({ poId, initial, editable }: { poId: number; initial: PoAttachment[]; editable: boolean }) {
  const router = useRouter();
  const [busy, startBusy] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true); setErr(null);
    try {
      const room = Math.max(0, 8 - initial.length);
      const out: string[] = [];
      for (const f of Array.from(files).slice(0, room)) { try { out.push(await compressImage(f)); } catch { /* skip */ } }
      if (!out.length) { setErr("แนบไม่สำเร็จ — รองรับ JPG/PNG"); return; }
      const res = await addPoAttachments(poId, out);
      if (res.ok) router.refresh(); else setErr(res.error ?? "แนบไม่สำเร็จ");
    } finally { setUploading(false); }
  };
  const del = (id: number) => startBusy(async () => { await deletePoAttachment(id, poId); router.refresh(); });

  return (
    <div className="no-print card p-5 mb-8">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2"><Paperclip className="w-4 h-4" /> ไฟล์แนบ</h3>
        <span className="text-[11px] text-muted-soft">{initial.length}/8</span>
      </div>
      {initial.length === 0 && !editable && <p className="text-sm text-muted py-3 text-center">ไม่มีไฟล์แนบ</p>}
      <PhotoStrip photos={initial} size={72} onDelete={editable ? del : undefined} kind="po" />
      {editable && initial.length < 8 && (
        <label className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-line text-sm text-muted hover:bg-canvas cursor-pointer">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />} แนบไฟล์
          <input type="file" accept="image/*" multiple className="hidden" disabled={uploading || busy} onChange={(e) => pick(e.target.files)} />
        </label>
      )}
      {err && <div className="mt-2 text-xs text-danger">{err}</div>}
    </div>
  );
}
