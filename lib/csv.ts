// ดาวน์โหลด CSV ฝั่ง client เป็น "ไฟล์" (ใส่ BOM ให้ Excel เปิดภาษาไทยไม่เพี้ยน)
// Desktop + Android: ดาวน์โหลดไฟล์ตรง ๆ ด้วย <a download>
// iOS เท่านั้น: a.download ไม่ทำงาน → ใช้ Share Sheet ("เซฟลงไฟล์") เป็นทางเดียวที่ได้ไฟล์
export async function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + body], { type: "text/csv;charset=utf-8;" });

  // iOS (iPhone/iPad) เท่านั้น: <a download> ไม่ทำงาน → ใช้ Web Share ให้ "เซฟลงไฟล์" ได้
  const ua = navigator.userAgent || "";
  const isIOS = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
  if (isIOS) {
    try {
      const nav = navigator as any;
      const file = new File([blob], filename, { type: "text/csv" });
      if (nav.canShare && nav.canShare({ files: [file] })) {
        try { await nav.share({ files: [file], title: filename }); } catch { /* ผู้ใช้ยกเลิก */ }
        return;
      }
    } catch { /* ไปทางดาวน์โหลด */ }
  }

  // ดาวน์โหลดไฟล์ตามปกติ
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
