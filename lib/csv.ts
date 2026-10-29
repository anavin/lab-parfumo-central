// ดาวน์โหลด/แชร์ CSV ฝั่ง client (ใส่ BOM ให้ Excel เปิดภาษาไทยไม่เพี้ยน)
// มือถือ iOS PWA: a.download มักไม่ทำงาน → ใช้ Share Sheet (เซฟลง Files/ส่งต่อ) ก่อน แล้วค่อย fallback
export async function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + body], { type: "text/csv;charset=utf-8;" });

  // iOS/มือถือ: Web Share API แชร์ไฟล์ได้ (เซฟลง Files, Line, อีเมล ฯลฯ)
  try {
    const nav = navigator as any;
    const file = new File([blob], filename, { type: "text/csv" });
    if (nav.canShare && nav.canShare({ files: [file] })) {
      try { await nav.share({ files: [file], title: filename }); } catch { /* ผู้ใช้ยกเลิก */ }
      return;
    }
  } catch { /* ไม่รองรับ share → ไปทางดาวน์โหลด */ }

  // desktop: ดาวน์โหลดตามปกติ
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
