import { PageHeader, Stat, Card } from "@/components/ui";
import { num } from "@/lib/format";
import { stockLive, stockSummary } from "@/lib/queries";
import { ExportButton } from "@/components/ExportButton";
import { StockTable } from "@/components/StockTable";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { BranchTabs } from "@/components/BranchTabs";
import { isBranch, branchName } from "@/lib/branches";
import { Package, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StockPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const sp = await searchParams;
  const branch = isBranch(sp.branch) ? sp.branch! : null;   // null = all branches combined
  const [rows, s, user] = await Promise.all([stockLive(branch), stockSummary(branch), getCurrentUser()]);
  const lowCount = (s.low ?? 0) + (s.out ?? 0);
  const canRequisition = !!user && can(user, "requisitions");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader icon={Package} title="สต๊อกคงเหลือ"
        subtitle={`คำนวณสดจาก ส่งไป − ขาย · ${branch ? branchName(branch) : "ทุกสาขา"}`}
        action={<div className="flex items-center gap-2"><BranchTabs withAll /><ExportButton kind="stock" /></div>} />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Stat label="คงเหลือรวม" value={num(s.remaining)} tone="success" />
        <Stat label="ส่งไปทั้งหมด" value={num(s.shipped)} />
        <Stat label="ขายไปแล้ว" value={num(s.sold)} />
        <Stat label="ใกล้หมด (≤3)" value={String(s.low)} tone="brand" />
        <Stat label="หมดสต๊อก" value={String(s.out)} tone="danger" />
      </div>

      {lowCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warn/40 bg-warn-soft px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-ink">
            <AlertTriangle className="w-5 h-5 text-warn shrink-0" />
            มีสินค้าใกล้หมด/หมด <b>{lowCount}</b> รายการ — ควรเบิกเพิ่ม
          </div>
          {canRequisition && (
            <a href="/requisitions/new?prefill=lowstock"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark shrink-0">
              สร้างใบเบิกของที่ใกล้หมด
            </a>
          )}
        </div>
      )}
      <Card title={`รายการสินค้า (${rows.length} SKU) · คลิกหัวคอลัมน์เพื่อเรียง`}>
        <StockTable rows={rows} />
      </Card>
    </div>
  );
}
