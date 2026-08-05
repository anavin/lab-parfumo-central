import { ScrollText } from "lucide-react";
import { PageHeader, Card, Badge } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/require-user";
import { auditLog } from "@/lib/queries";

export const dynamic = "force-dynamic";

const ACTION: Record<string, { label: string; tone: "success" | "info" | "danger" | "warn" | "brand" | "gray" }> = {
  create: { label: "สร้าง", tone: "success" },
  update: { label: "แก้ไข", tone: "info" },
  delete: { label: "ลบ", tone: "warn" },
  restore: { label: "กู้คืน", tone: "brand" },
  purge: { label: "ลบถาวร", tone: "danger" },
  login: { label: "เข้าระบบ", tone: "success" },
  logout: { label: "ออกระบบ", tone: "gray" },
  login_failed: { label: "เข้าไม่สำเร็จ", tone: "danger" },
  password: { label: "รหัสผ่าน", tone: "warn" },
};
const ENTITY: Record<string, string> = {
  requisition: "ใบเบิก", sale: "การขาย", cash: "เงินสด", customer: "ลูกค้า",
  shipment: "ส่งสินค้า", return: "คืนสินค้า", user: "ผู้ใช้", auth: "ระบบ",
};

export default async function AuditPage() {
  await requireAdmin();
  const rows = await auditLog({}, 300);

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      <PageHeader icon={ScrollText} title="บันทึกกิจกรรม (Audit Log)" subtitle={`${rows.length} รายการล่าสุด · ใครทำอะไรเมื่อไหร่`} />
      <Card bodyClass="p-0">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-canvas sticky top-0"><tr className="th border-b border-line-soft">
              <th className="px-5 py-2.5">เวลา</th><th className="px-3 py-2.5">ผู้ใช้</th>
              <th className="px-3 py-2.5">การกระทำ</th><th className="px-3 py-2.5">ประเภท</th><th className="px-5 py-2.5">รายละเอียด</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => {
                const a = ACTION[r.action] ?? { label: r.action, tone: "gray" as const };
                return (
                  <tr key={r.id} className="border-b border-line-soft last:border-0">
                    <td className="px-5 py-2.5 text-muted text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString("th-TH", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-3 py-2.5"><span className="font-medium text-ink">{r.user_name}</span>{r.user_role === "admin" && <span className="text-[10px] text-brand-dark ml-1">admin</span>}</td>
                    <td className="px-3 py-2.5"><Badge tone={a.tone}>{a.label}</Badge></td>
                    <td className="px-3 py-2.5 text-muted">{ENTITY[r.entity] ?? r.entity}</td>
                    <td className="px-5 py-2.5 text-ink-soft">{r.detail}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted">ยังไม่มีบันทึก</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
