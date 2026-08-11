/**
 * Presentational daily-report sheet (white A4, black-on-white). Shared by the
 * on-screen preview (DailyReportPrint) and the standalone print page so the
 * preview and the printed page are the exact same markup — identical output.
 */
import type { DailyReport as ReportData, DaySaleRow } from "@/lib/queries";
import { PAYMENTS } from "@/lib/payments";
import { branchName } from "@/lib/branches";
const nf = (n: number) => Math.round(n || 0).toLocaleString("en-US");
const thaiDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const payLabel = (v: string) => PAYMENTS.find((p) => p.v === v)?.label.replace(/\s*\(.*\)$/, "") || v || "-";
const natLabel = (n: string) => (n === "Foreign" ? "ต่างชาติ" : n === "Thai" ? "ไทย" : "-");

type Bill = { key: string; no: number; time: string; author: string; nation: string; pay: string; rows: DaySaleRow[]; total: number };
function groupBills(rows: DaySaleRow[]): Bill[] {
  const map = new Map<string, DaySaleRow[]>(); const order: string[] = [];
  for (const r of rows) { const k = r.receipt_no || `id:${r.id}`; if (!map.has(k)) { map.set(k, []); order.push(k); } map.get(k)!.push(r); }
  return order.map((k, i) => {
    const rs = map.get(k)!; const f = rs[0];
    return { key: k, no: i + 1, time: (f.sale_time || "").slice(0, 5), author: f.author, nation: f.nation || "", pay: f.payment_channel || "", rows: rs, total: rs.reduce((s, r) => s + (r.total ?? 0), 0) };
  });
}

const Kpi = ({ label, value, primary = false }: { label: string; value: string; primary?: boolean }) => (
  <div className={`border rounded-lg px-3 py-2.5 ${primary ? "border-black border-2" : "border-neutral-400"}`}>
    <div className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</div>
    <div className={`tabular-nums font-bold leading-tight ${primary ? "text-[22px]" : "text-lg"}`}>{value}</div>
  </div>
);
const SecTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500 border-b border-black pb-1 mb-2">{children}</div>
);
const KV = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between items-baseline py-1 border-b border-dashed border-neutral-300 text-[13px]">
    <span>{k}</span><span className="font-semibold tabular-nums">{v}</span>
  </div>
);

export function DailyReportSheet({ date, source, data, rows, showDetail = true, generatedAt }: {
  date: string; source: string; data: ReportData | null; rows: DaySaleRow[]; showDetail?: boolean; generatedAt: string;
}) {
  const bills = groupBills(rows);
  const srcLabel = branchName(source);
  const ready = !!data && data.orders > 0;
  const aov = ready ? data!.total / data!.orders : 0;
  const totalQty = bills.reduce((s, b) => s + b.rows.reduce((x, r) => x + (r.qty ?? 0), 0), 0);
  let gross = 0, disc = 0;
  for (const b of bills) for (const r of b.rows) { disc += r.discount ?? 0; gross += (r.total ?? 0) + (r.discount ?? 0); }
  const byPerson = (() => {
    const m = new Map<string, { bills: number; total: number }>();
    for (const b of bills) { const c = m.get(b.author) ?? { bills: 0, total: 0 }; c.bills += 1; c.total += b.total; m.set(b.author, c); }
    return [...m.entries()].map(([author, v]) => ({ author, ...v })).sort((a, b) => b.total - a.total);
  })();
  const sellers = byPerson.map((p) => p.author);

  return (
    <div className="daily-sheet mx-auto w-full max-w-[760px] rounded-xl border border-line bg-white text-black shadow-sm px-10 py-8">
      <div className="flex items-start justify-between gap-6 border-b-2 border-black pb-3 mb-5">
        <div>
          <div className="text-[22px] font-extrabold tracking-tight leading-none">Lab Parfumo</div>
          <div className="text-[13px] text-neutral-600 mt-1.5">รายงานสรุปยอดขายประจำวัน · {srcLabel}</div>
          {ready && sellers.length > 0 && (
            <div className="text-[13px] text-neutral-700 mt-1">พนักงานขาย: <span className="font-semibold">{sellers.join(" · ")}</span></div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[15px] font-bold leading-tight">{thaiDate(date)}</div>
          <div className="text-[11px] text-neutral-500 mt-1">ออกรายงานเมื่อ {generatedAt} น.</div>
        </div>
      </div>

      {!ready ? (
        <div className="py-12 text-center text-sm text-neutral-500">ยังไม่มียอดขายของวันนี้</div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3 mb-6">
            <Kpi label="ยอดขายรวม" value={`฿${nf(data!.total)}`} primary />
            <Kpi label="จำนวนบิล" value={`${data!.orders}`} />
            <Kpi label="จำนวนชิ้น" value={`${Math.round(totalQty)}`} />
            <Kpi label="เฉลี่ย/บิล" value={`฿${nf(aov)}`} />
          </div>

          <div className="grid grid-cols-2 gap-x-10 mb-6">
            <div>
              <SecTitle>ช่องทางรับเงิน</SecTitle>
              <KV k="เงินสด" v={`฿${nf(data!.cash)}`} />
              <KV k="โอน / เครดิต" v={`฿${nf(data!.nonCash)}`} />
            </div>
            <div>
              <SecTitle>สัญชาติลูกค้า</SecTitle>
              <KV k={`คนไทย (${data!.thaiCount})`} v={`฿${nf(data!.thaiAmt)}`} />
              <KV k={`ต่างชาติ (${data!.foreignCount})`} v={`฿${nf(data!.foreignAmt)}`} />
              {data!.otherCount > 0 && <KV k={`อื่นๆ (${data!.otherCount})`} v={`฿${nf(data!.otherAmt)}`} />}
            </div>
          </div>

          {byPerson.length > 1 && (
            <div className="mb-6">
              <SecTitle>สรุปตามพนักงานขาย</SecTitle>
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="text-left text-neutral-500 text-[11px] uppercase tracking-wide">
                    <th className="pb-1.5 font-semibold">พนักงานขาย</th>
                    <th className="pb-1.5 w-24 text-right font-semibold">จำนวนบิล</th>
                    <th className="pb-1.5 w-28 text-right font-semibold">ยอด (฿)</th>
                  </tr>
                </thead>
                <tbody>
                  {byPerson.map((p) => (
                    <tr key={p.author} className="border-t border-neutral-200">
                      <td className="py-1.5 font-medium">{p.author}</td>
                      <td className="py-1.5 text-right tabular-nums">{p.bills}</td>
                      <td className="py-1.5 text-right font-semibold tabular-nums">{nf(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showDetail && (
            <div className="mb-6">
              <SecTitle>รายละเอียดแต่ละบิล</SecTitle>
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="text-left text-neutral-500 text-[11px] uppercase tracking-wide">
                    <th className="pb-1.5 pr-2 w-7 font-semibold">#</th>
                    <th className="pb-1.5 pr-2 w-12 font-semibold">เวลา</th>
                    <th className="pb-1.5 pr-2 font-semibold">รายการ</th>
                    <th className="pb-1.5 pr-2 w-24 font-semibold">ชำระ</th>
                    <th className="pb-1.5 pr-2 w-14 font-semibold">สัญชาติ</th>
                    <th className="pb-1.5 text-right w-20 font-semibold">ยอด (฿)</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((b) => (
                    <tr key={b.key} className="border-t border-neutral-200 align-top">
                      <td className="py-2 pr-2 font-semibold tabular-nums">{b.no}</td>
                      <td className="py-2 pr-2 tabular-nums">{b.time || "-"}</td>
                      <td className="py-2 pr-2">
                        <ul className="text-[11px] text-neutral-700 space-y-0.5">
                          {b.rows.map((r) => {
                            const g = (r.total ?? 0) + (r.discount ?? 0);
                            return (
                              <li key={r.id} className="flex items-baseline gap-2">
                                <span className="flex-1 min-w-0 truncate text-black">{Math.round(r.qty ?? 0)}× {r.item}{r.size ? ` ${r.size}` : ""}</span>
                                <span className="w-24 text-right tabular-nums text-neutral-500">เต็ม ฿{nf(g)}</span>
                                <span className="w-20 text-right tabular-nums text-neutral-500">ลด ฿{nf(r.discount ?? 0)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                      <td className="py-2 pr-2">{payLabel(b.pay)}</td>
                      <td className="py-2 pr-2">{natLabel(b.nation)}</td>
                      <td className="py-2 text-right font-semibold tabular-nums">{nf(b.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-black">
                    <td colSpan={2} className="py-2 font-bold align-baseline">รวม {bills.length} บิล</td>
                    <td className="py-2 align-baseline">
                      <div className="flex items-baseline gap-2 text-[11px] font-semibold">
                        <span className="flex-1" />
                        <span className="w-24 text-right tabular-nums">เต็ม ฿{nf(gross)}</span>
                        <span className="w-20 text-right tabular-nums">ลด ฿{nf(disc)}</span>
                      </div>
                    </td>
                    <td colSpan={2} className="align-baseline" />
                    <td className="py-2 text-right font-bold text-[13px] tabular-nums align-baseline">{nf(data!.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="grid grid-cols-2 gap-12 pt-12 text-[13px]">
            <div className="text-center"><div className="border-t border-black pt-1.5">ผู้จัดทำ</div></div>
            <div className="text-center"><div className="border-t border-black pt-1.5">ผู้ตรวจสอบ</div></div>
          </div>
        </>
      )}
    </div>
  );
}
