"use client";
import { Receipt, Wallet, Wrench, ChevronDown } from "lucide-react";
import type { LossSignals as Signals } from "@/lib/queries";

// สัญญาณผิดปกติ (theft vectors) — บิลน่าสงสัย · เงินสดขาด · ปรับมือ(ลบ) · พับดูรายละเอียดได้
const baht = (n: number) => (n < 0 ? "−" : "+") + "฿" + Math.abs(Math.round(n)).toLocaleString("en-US");

function Card({ icon: Icon, title, count, tone, children }:
  { icon: any; title: string; count: number; tone: "danger" | "warn"; children: React.ReactNode }) {
  if (count === 0) return null;
  const toneCls = tone === "danger" ? "text-danger" : "text-warn";
  return (
    <details className="rounded-lg border border-line bg-surface group">
      <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none text-sm font-medium text-ink hover:bg-canvas/60 rounded-lg">
        <Icon className={"w-4 h-4 " + toneCls} />
        {title}
        <span className={"ml-1 text-xs font-bold " + toneCls}>{count}</span>
        <ChevronDown className="w-4 h-4 text-muted ml-auto transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-3 pb-3 pt-1 border-t border-line-soft overflow-x-auto">{children}</div>
    </details>
  );
}

const th = "text-left font-medium text-muted px-2 py-1.5 whitespace-nowrap";
const td = "px-2 py-1.5 align-top";

export function LossSignals({ signals }: { signals: Signals }) {
  const { bills, cash, adjusts } = signals;
  const total = bills.length + cash.length + adjusts.length;
  if (total === 0) return null;   // เงียบไว้ถ้าไม่มีสัญญาณ (variance table โชว์ต่อด้านล่าง)

  return (
    <div className="space-y-2 mb-4">
      <div className="text-xs font-semibold text-muted uppercase tracking-wide">สัญญาณผิดปกติ · 30 วัน</div>

      <Card icon={Receipt} title="บิลน่าสงสัย" count={bills.length} tone="warn">
        <table className="w-full text-[12.5px] min-w-[460px]">
          <thead><tr><th className={th}>เวลา</th><th className={th}>พนักงาน</th><th className={th}>บิล / รายการ</th><th className={th}>เหตุ</th></tr></thead>
          <tbody>
            {bills.map((b, i) => (
              <tr key={i} className="border-t border-line-soft">
                <td className={td + " text-muted whitespace-nowrap"}>{b.at}</td>
                <td className={td + " whitespace-nowrap"}>{b.who || "—"}</td>
                <td className={td}>{b.ref ? <b>{b.ref}</b> : "—"} · {b.item || "—"}</td>
                <td className={td}><span className="chip-warn">{b.reason}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card icon={Wallet} title="เงินสดขาด/เกิน (นับลิ้นชัก)" count={cash.length} tone="danger">
        <table className="w-full text-[12.5px] min-w-[420px]">
          <thead><tr><th className={th}>วันที่</th><th className={th}>ผู้ปิดยอด</th><th className={th + " text-right"}>ควรมี</th><th className={th + " text-right"}>นับได้</th><th className={th + " text-right"}>ผลต่าง</th></tr></thead>
          <tbody>
            {cash.map((c, i) => (
              <tr key={i} className={"border-t border-line-soft " + (c.diff < 0 ? "bg-danger-soft" : "")}>
                <td className={td + " whitespace-nowrap"}>{c.date}</td>
                <td className={td + " whitespace-nowrap text-muted"}>{c.who || "—"}</td>
                <td className={td + " text-right tabular-nums"}>{Math.round(c.closing).toLocaleString()}</td>
                <td className={td + " text-right tabular-nums"}>{Math.round(c.counted).toLocaleString()}</td>
                <td className={td + " text-right tabular-nums font-semibold " + (c.diff < 0 ? "text-danger" : "text-brand")}>{baht(c.diff)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card icon={Wrench} title="ปรับสต๊อกมือ (ลด)" count={adjusts.length} tone="warn">
        <table className="w-full text-[12.5px] min-w-[420px]">
          <thead><tr><th className={th}>เวลา</th><th className={th}>พนักงาน</th><th className={th}>สินค้า</th><th className={th + " text-right"}>จำนวน</th><th className={th}>เหตุผล</th></tr></thead>
          <tbody>
            {adjusts.map((a, i) => (
              <tr key={i} className="border-t border-line-soft">
                <td className={td + " text-muted whitespace-nowrap"}>{a.at.slice(0, 16).replace("T", " ")}</td>
                <td className={td + " whitespace-nowrap"}>{a.who || "—"}</td>
                <td className={td}>{a.item || "—"}</td>
                <td className={td + " text-right tabular-nums text-danger font-semibold"}>{a.qty}</td>
                <td className={td + " text-muted"}>{a.note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
