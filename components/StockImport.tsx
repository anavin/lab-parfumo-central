"use client";
import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, Loader2, ClipboardCheck, Trash2, Search, CheckCircle2 } from "lucide-react";
import { parseInventoryUpload, type ImportLine } from "@/lib/actions/stock-import";
import { submitStockCount } from "@/lib/actions/stock-count";

type Row = ImportLine & { key: number };
const inp = "border border-line rounded-lg px-2 py-1.5 text-sm bg-surface text-ink focus:outline-none focus:border-brand";

/** Admin: upload the CTW inventory workbook → edit quantities → send to the stock-count
 *  queue for a second admin to approve. Approval sets CTW stock to these numbers. */
export function StockImport() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [term, setTerm] = useState("");
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<number | null>(null);
  const [reading, startRead] = useTransition();
  const [saving, startSave] = useTransition();

  const onFile = (file: File | null) => {
    if (!file) return;
    setErr(null); setDoneId(null); setFileName(file.name);
    startRead(async () => {
      const fd = new FormData(); fd.append("file", file);
      const res = await parseInventoryUpload(fd);
      if (!res.ok || !res.lines) { setErr(res.error ?? "อ่านไฟล์ไม่สำเร็จ"); setRows([]); return; }
      setRows(res.lines.map((l, i) => ({ ...l, key: i })));
    });
  };

  const setCounted = (key: number, v: string) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, counted: Math.max(0, Math.round(Number(v.replace(/[^\d]/g, "")) || 0)) } : r)));
  const removeRow = (key: number) => setRows((rs) => rs.filter((r) => r.key !== key));

  const diffCount = useMemo(() => rows.filter((r) => r.counted !== r.expected).length, [rows]);
  const totalUnits = useMemo(() => rows.reduce((s, r) => s + r.counted, 0), [rows]);
  const list = useMemo(() => {
    const t = term.trim().toLowerCase();
    return !t ? rows : rows.filter((r) => r.scent.toLowerCase().includes(t) || r.barcode.includes(t));
  }, [rows, term]);

  const submit = () => startSave(async () => {
    setErr(null);
    const lines = rows.map((r) => ({ barcode: r.barcode, scent: r.scent, size: r.size, expected: r.expected, counted: r.counted }));
    const res = await submitStockCount("CTW", lines, note || "นำเข้าสต๊อก CTW จากไฟล์");
    if (res.ok) { setDoneId(res.id ?? null); router.refresh(); } else setErr(res.error ?? "ส่งไม่สำเร็จ");
  });

  if (doneId != null) {
    return (
      <div className="rounded-xl border border-success/40 bg-success-soft p-6 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
        <div className="text-ink font-semibold">ส่งเข้าระบบแล้ว ({rows.length} รายการ)</div>
        <p className="text-sm text-muted">รอแอดมินตรวจและอนุมัติ — เมื่ออนุมัติแล้ว สต๊อก CTW จะอัปเดตตามตัวเลขนี้</p>
        <div className="flex items-center justify-center gap-2">
          <Link href="/stock/counts" className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark">ไปหน้าตรวจนับสต๊อก</Link>
          <button onClick={() => { setDoneId(null); setRows([]); setFileName(""); }} className="px-4 py-2 rounded-lg border border-line text-sm text-muted hover:bg-canvas">นำเข้าไฟล์ใหม่</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* upload */}
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept=".xlsx" className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          <button onClick={() => fileRef.current?.click()} disabled={reading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">
            {reading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} เลือกไฟล์ Excel (.xlsx)
          </button>
          {fileName && <span className="text-sm text-muted truncate">{fileName}</span>}
        </div>
        <p className="text-[12px] text-muted-soft mt-2">ไฟล์ต้องมีคอลัมน์ <b>Code</b> (บาร์โค้ด) และ <b>คงเหลือ</b> — ระบบจะดึงสต๊อกปัจจุบันมาเทียบให้</p>
        {err && <div className="mt-2 text-sm text-danger">{err}</div>}
      </div>

      {rows.length > 0 && (
        <>
          {/* toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-muted-soft absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="ค้นหากลิ่น / บาร์โค้ด…" className={inp + " w-full pl-8"} />
            </div>
            <div className="text-sm text-muted">{rows.length} รายการ · <span className="text-warn-dark font-medium">ต่างจากระบบ {diffCount}</span> · รวม {totalUnits} ชิ้น</div>
          </div>

          {/* table */}
          <div className="rounded-xl border border-line bg-surface overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[12px] text-muted border-b border-line">
                  <th className="px-3 py-2 font-medium">กลิ่น</th>
                  <th className="px-3 py-2 font-medium">ขนาด</th>
                  <th className="px-3 py-2 font-medium text-right">สต๊อกในระบบ</th>
                  <th className="px-3 py-2 font-medium text-right">คงเหลือ (แก้ได้)</th>
                  <th className="px-3 py-2 font-medium text-right">ส่วนต่าง</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {list.map((r) => {
                  const diff = r.counted - r.expected;
                  return (
                    <tr key={r.key} className="hover:bg-canvas/50">
                      <td className="px-3 py-2 text-ink">{r.scent}</td>
                      <td className="px-3 py-2 text-muted">{r.size}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted">{r.expected}</td>
                      <td className="px-3 py-2 text-right">
                        <input value={String(r.counted)} inputMode="numeric" onFocus={(e) => e.target.select()}
                          onChange={(e) => setCounted(r.key, e.target.value)}
                          className={inp + ` w-16 text-right tabular-nums ${diff !== 0 ? (diff < 0 ? "border-danger text-danger" : "border-warn text-warn-dark") : ""}`} />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {diff === 0 ? <span className="text-muted-soft">0</span>
                          : diff < 0 ? <span className="text-danger">{diff}</span>
                          : <span className="text-warn-dark">+{diff}</span>}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => removeRow(r.key)} className="p-1 rounded text-muted-soft hover:text-danger hover:bg-danger-soft" aria-label="ลบแถว"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* submit */}
          <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุ (ถ้ามี)" className={inp + " w-full"} />
            {err && <div className="text-sm text-danger">{err}</div>}
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] text-muted-soft">ส่งแล้วจะเข้าคิว “ตรวจนับสต๊อก” ให้แอดมินอนุมัติอีกครั้งก่อนปรับสต๊อกจริง</p>
              <button onClick={submit} disabled={saving || rows.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50 shrink-0">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />} ส่งเข้าระบบให้แอดมินตรวจ
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
