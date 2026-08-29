import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { requirePermission } from "@/lib/auth/require-user";
import { auditLog } from "@/lib/queries";
import { AuditTimeline } from "@/components/AuditTimeline";

export const dynamic = "force-dynamic";

const isDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await requirePermission("audit");
  const sp = await searchParams;
  const from = isDate(sp.from) ? sp.from! : undefined;
  const to = isDate(sp.to) ? sp.to! : undefined;
  // a date range may reach past the default window, so widen the fetch when one is set
  const LIMIT = from || to ? 2000 : 300;
  const rows = await auditLog({ from, to }, LIMIT);
  // don't hide the cap silently — tell the reviewer older records aren't shown
  const subtitle = rows.length >= LIMIT
    ? `ใครทำอะไรเมื่อไหร่ · แสดง ${LIMIT} รายการล่าสุด (เก่ากว่านี้ไม่แสดง)`
    : "ใครทำอะไรเมื่อไหร่ — ไทม์ไลน์กิจกรรมของทั้งระบบ";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader icon={ScrollText} title="บันทึกกิจกรรม (Audit Log)" subtitle={subtitle} />
      <AuditTimeline rows={rows} from={from ?? ""} to={to ?? ""} />
    </div>
  );
}
