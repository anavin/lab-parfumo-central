"use client";
import { useState } from "react";
import { Package, Activity, ShieldAlert, FlaskConical, Barcode, Scale, ShoppingBag } from "lucide-react";

type TabId = "stock" | "move" | "tester" | "packaging" | "sku" | "reconcile" | "loss";

// สลับแท็บบนหน้า /stock — คงเหลือ · การเคลื่อนไหว · เทสเตอร์ · ถุง/บรรจุภัณฑ์ · SKU · เทียบ SKU · ป้องกันของหาย
// ("เทียบข้อมูลใหม่" ยุบไปที่หน้า "สต็อกหน้าร้าน" /shelf แล้ว)
// ทุกแท็บ mount ค้างไว้ (ใช้ hidden) เพื่อไม่ให้ state (การแก้จำนวน/ตัวกรอง) รีเซ็ตตอนสลับ
// loss/sku/reconcile = null → ไม่มีสิทธิ์ (ผู้จัดการ/แอดมิน/ปฏิบัติการเท่านั้น) → ซ่อนแท็บนั้น
export function StockTabs({ matrix, movement, tester = null, packaging = null, sku = null, reconcile = null, loss = null, lossAlert = false }:
  { matrix: React.ReactNode; movement: React.ReactNode; tester?: React.ReactNode; packaging?: React.ReactNode; sku?: React.ReactNode; reconcile?: React.ReactNode; loss?: React.ReactNode; lossAlert?: boolean }) {
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
      <div className="flex flex-wrap items-center gap-1 p-1 mb-3 rounded-xl border border-line bg-surface">
        {/* กลุ่ม 1: ดูสินค้า/สต๊อก */}
        <Btn id="stock" icon={Package} label="คงเหลือ" />
        <Btn id="move" icon={Activity} label="การเคลื่อนไหว" />
        {tester && <Btn id="tester" icon={FlaskConical} label="เทสเตอร์ & ถุง" />}
        {packaging && <Btn id="packaging" icon={ShoppingBag} label="ถุง/บรรจุภัณฑ์" />}
        {/* กลุ่ม 2: SKU & ตรวจสอบ (ผู้จัดการ) */}
        {(sku || reconcile || loss) && <span aria-hidden className="mx-1 self-stretch w-px bg-line hidden sm:block" />}
        {sku && <Btn id="sku" icon={Barcode} label="ทะเบียน SKU" />}
        {reconcile && <Btn id="reconcile" icon={Scale} label="ตรวจส่วนต่าง SKU" />}
        {loss && <Btn id="loss" icon={ShieldAlert} label="ป้องกันของหาย" dot={lossAlert} />}
      </div>
      <div hidden={tab !== "stock"}>{matrix}</div>
      <div hidden={tab !== "move"}>{movement}</div>
      {tester && <div hidden={tab !== "tester"}>{tester}</div>}
      {packaging && <div hidden={tab !== "packaging"}>{packaging}</div>}
      {sku && <div hidden={tab !== "sku"}>{sku}</div>}
      {reconcile && <div hidden={tab !== "reconcile"}>{reconcile}</div>}
      {loss && <div hidden={tab !== "loss"}>{loss}</div>}
    </div>
  );
}
