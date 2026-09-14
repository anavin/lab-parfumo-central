"use client";
import { useState } from "react";
import { Package, Activity } from "lucide-react";

// สลับแท็บบนหน้า /stock — คงเหลือ (matrix) ↔ การเคลื่อนไหว (heatmap ขายรายวัน)
// ทั้งสองแท็บ mount ค้างไว้ (ใช้ hidden) เพื่อไม่ให้ state (การแก้จำนวน/ตัวกรอง) รีเซ็ตตอนสลับ
export function StockTabs({ matrix, movement }: { matrix: React.ReactNode; movement: React.ReactNode }) {
  const [tab, setTab] = useState<"stock" | "move">("stock");
  const Btn = ({ id, icon: Icon, label }: { id: "stock" | "move"; icon: any; label: string }) => (
    <button onClick={() => setTab(id)}
      className={"inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition " +
        (tab === id ? "bg-brand text-white" : "text-muted hover:bg-canvas")}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
  return (
    <div>
      <div className="inline-flex gap-1 p-1 mb-3 rounded-xl border border-line bg-surface">
        <Btn id="stock" icon={Package} label="คงเหลือ" />
        <Btn id="move" icon={Activity} label="การเคลื่อนไหว" />
      </div>
      <div hidden={tab !== "stock"}>{matrix}</div>
      <div hidden={tab !== "move"}>{movement}</div>
    </div>
  );
}
