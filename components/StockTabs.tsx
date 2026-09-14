"use client";
import { useState } from "react";
import { Package, Activity, ShieldAlert } from "lucide-react";

type TabId = "stock" | "move" | "loss";

// สลับแท็บบนหน้า /stock — คงเหลือ (matrix) · การเคลื่อนไหว (heatmap ขายรายวัน) · ป้องกันของหาย
// ทุกแท็บ mount ค้างไว้ (ใช้ hidden) เพื่อไม่ให้ state (การแก้จำนวน/ตัวกรอง) รีเซ็ตตอนสลับ
// loss = null → ไม่มีสิทธิ์ (ผู้จัดการ/แอดมิน/ปฏิบัติการเท่านั้น) → ซ่อนแท็บป้องกันของหาย
export function StockTabs({ matrix, movement, loss = null, lossAlert = false }:
  { matrix: React.ReactNode; movement: React.ReactNode; loss?: React.ReactNode; lossAlert?: boolean }) {
  const [tab, setTab] = useState<TabId>("stock");
  const Btn = ({ id, icon: Icon, label, dot }: { id: TabId; icon: any; label: string; dot?: boolean }) => (
    <button onClick={() => setTab(id)}
      className={"relative inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition " +
        (tab === id ? "bg-brand text-white" : "text-muted hover:bg-canvas")}>
      <Icon className="w-4 h-4" /> {label}
      {dot && tab !== id && <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-danger" />}
    </button>
  );
  return (
    <div>
      <div className="inline-flex gap-1 p-1 mb-3 rounded-xl border border-line bg-surface">
        <Btn id="stock" icon={Package} label="คงเหลือ" />
        <Btn id="move" icon={Activity} label="การเคลื่อนไหว" />
        {loss && <Btn id="loss" icon={ShieldAlert} label="ป้องกันของหาย" dot={lossAlert} />}
      </div>
      <div hidden={tab !== "stock"}>{matrix}</div>
      <div hidden={tab !== "move"}>{movement}</div>
      {loss && <div hidden={tab !== "loss"}>{loss}</div>}
    </div>
  );
}
