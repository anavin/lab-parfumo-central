"use client";
import { useState } from "react";
import { Store, ListChecks } from "lucide-react";

// สองแท็บหน้าเงินสด: "เงินสดหน้าร้าน (รายวัน)" เป็นหน้าหลัก และ "รายการเงินสด" (ฟิลเตอร์/ดาวน์โหลด)
// เก็บทั้งสองไว้ใน DOM (ซ่อนด้วย hidden) เพื่อไม่ให้ state ของตัวกรอง/สาขา รีเซ็ตเวลาสลับแท็บ
export function CashTabs({ dailyLabel, listLabel, daily, list }: {
  dailyLabel: string; listLabel: string; daily: React.ReactNode; list: React.ReactNode;
}) {
  const [tab, setTab] = useState<"daily" | "list">("daily");
  const btn = (on: boolean) =>
    `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
      on ? "bg-surface text-ink border border-line shadow-sm" : "text-muted hover:text-ink border border-transparent"}`;
  return (
    <div>
      <div className="inline-flex gap-1 p-1 rounded-xl bg-canvas border border-line mb-5">
        <button onClick={() => setTab("daily")} className={btn(tab === "daily")}>
          <Store className="w-4 h-4" /> {dailyLabel}
        </button>
        <button onClick={() => setTab("list")} className={btn(tab === "list")}>
          <ListChecks className="w-4 h-4" /> {listLabel}
        </button>
      </div>
      <div className={tab === "daily" ? "" : "hidden"}>{daily}</div>
      <div className={tab === "list" ? "" : "hidden"}>{list}</div>
    </div>
  );
}
