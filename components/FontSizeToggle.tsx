"use client";
import { useEffect, useState } from "react";

// ปุ่มสลับขนาดตัวอักษรทั้งระบบ — ก / กก / กกก (เหมือนระบบเบิกสินค้า/stockflow)
// เก็บใน localStorage แยกต่อเครื่อง แล้วตั้ง data-fontsize บน <html>
// (globals.css แมป data-fontsize → font-size ฐาน; ตัวอักษรที่ใช้หน่วย rem จะสเกลตาม)
const LEVELS = [
  { key: "sm", label: "ก", title: "เล็ก", fs: "12px" },
  { key: "md", label: "กก", title: "กลาง (ค่าเริ่มต้น)", fs: "14px" },
  { key: "lg", label: "กกก", title: "ใหญ่", fs: "16px" },
] as const;

export function FontSizeToggle() {
  const [level, setLevel] = useState<string>("md");

  useEffect(() => {
    try {
      const v = localStorage.getItem("lp_fontsize");
      if (v === "sm" || v === "md" || v === "lg") setLevel(v);
    } catch {}
  }, []);

  function apply(key: string) {
    setLevel(key);
    try { localStorage.setItem("lp_fontsize", key); } catch {}
    document.documentElement.setAttribute("data-fontsize", key);
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="text-[13px] text-white/55">ขนาดตัวอักษร</span>
      <div className="ml-auto flex overflow-hidden rounded-lg border border-white/15" role="group" aria-label="ขนาดตัวอักษร">
        {LEVELS.map((l) => (
          <button key={l.key} type="button" onClick={() => apply(l.key)} title={l.title} aria-pressed={level === l.key}
            className={`px-2.5 py-1 font-medium leading-none transition-colors ${level === l.key ? "bg-brand text-white" : "text-white/55 hover:bg-white/[0.08] hover:text-white/80"}`}
            style={{ fontSize: l.fs }}>
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
