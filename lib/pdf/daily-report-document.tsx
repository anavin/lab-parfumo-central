/**
 * รายงานสรุปยอดขายประจำวัน — server-rendered A4 PDF (react-pdf), same reliable path
 * as the receipt PDF so Safari never prints it blank. Mirrors DailyReportPrint.
 * NOTE: react-pdf's Thai shaper drops a leading consonant before า in a word-initial
 * C+า cluster (ร+า in รายงาน/รายละเอียด/รายการ; บ+า in บาท). Avoid those: use
 * สรุป / บิลทั้งหมด / สินค้า, and the ฿ symbol instead of "บาท".
 */
import path from "path";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { PAYMENTS } from "@/lib/payments";
import type { DailyReport as ReportData, DaySaleRow } from "@/lib/queries";

const FONTS_DIR = path.join(process.cwd(), "public", "fonts");
let fontRegistered = false;
function registerFontOnce() {
  if (fontRegistered) return;
  Font.register({
    family: "NotoSansThai",
    fonts: [
      { src: path.join(FONTS_DIR, "NotoSansThai-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(FONTS_DIR, "NotoSansThai-Bold.ttf"), fontWeight: "bold" },
    ],
  });
  Font.registerHyphenationCallback((w) => [w]);
  fontRegistered = true;
}

const SRC_LABEL: Record<string, string> = { CTW: "Central World (CTW)", EVENT_SCS: "Event" };
const nf = (n: number) => Math.round(n || 0).toLocaleString("en-US");
const thaiDate = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
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

const C = { ink: "#1a1614", muted: "#6b645d", faint: "#9a938c", border: "#d8d3cc", soft: "#f4f2ee" };
const s = StyleSheet.create({
  page: { fontFamily: "NotoSansThai", fontSize: 9, color: C.ink, padding: 32, lineHeight: 1.4 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 2, borderBottomColor: C.ink, paddingBottom: 10, marginBottom: 14 },
  brand: { fontSize: 20, fontWeight: "bold", letterSpacing: -0.3 },
  sub: { fontSize: 9, color: C.muted, marginTop: 3 },
  seller: { fontSize: 9, color: C.ink, marginTop: 2 },
  dateBig: { fontSize: 12, fontWeight: "bold", textAlign: "right" },
  gen: { fontSize: 7.5, color: C.faint, textAlign: "right", marginTop: 2 },
  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  kpi: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 5, paddingVertical: 6, paddingHorizontal: 8 },
  kpiPrimary: { borderColor: C.ink, borderWidth: 1.5 },
  kpiLabel: { fontSize: 7.5, color: C.muted, textTransform: "uppercase" },
  kpiVal: { fontSize: 15, fontWeight: "bold" },
  kpiValBig: { fontSize: 18, fontWeight: "bold" },
  cols: { flexDirection: "row", gap: 24, marginBottom: 16 },
  col: { flex: 1 },
  secTitle: { fontSize: 8.5, fontWeight: "bold", color: C.muted, textTransform: "uppercase", borderBottomWidth: 1, borderBottomColor: C.ink, paddingBottom: 2, marginBottom: 4 },
  kv: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#e6e2db", borderStyle: "dashed", paddingVertical: 2 },
  kvVal: { fontWeight: "bold" },
  th: { flexDirection: "row", backgroundColor: C.soft, borderTopWidth: 1, borderColor: C.border },
  tr: { flexDirection: "row", borderTopWidth: 1, borderColor: C.border },
  cell: { paddingVertical: 3, paddingHorizontal: 4, borderRightWidth: 1, borderColor: C.border },
  cellL: { borderLeftWidth: 1, borderColor: C.border },
  hCell: { fontWeight: "bold", fontSize: 7.5, color: C.muted },
  foot: { flexDirection: "row", borderTopWidth: 1.5, borderColor: C.ink, backgroundColor: C.soft },
  signRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 40 },
  sign: { width: "42%", alignItems: "center" },
  signLine: { borderBottomWidth: 1, borderColor: C.faint, width: "100%", height: 1, marginBottom: 4 },
});

// widths: # time items pay nation amount
const W = [22, 40, 250, 90, 46, 70];

export function DailyReportDocument({ date, source, report, bills: rawBills, generatedAt }: {
  date: string; source: string; report: ReportData; bills: DaySaleRow[]; generatedAt: string;
}) {
  registerFontOnce();
  const bills = groupBills(rawBills);
  const srcLabel = SRC_LABEL[source] ?? source;
  const aov = report.orders ? report.total / report.orders : 0;
  const totalQty = bills.reduce((s2, b) => s2 + b.rows.reduce((x, r) => x + (r.qty ?? 0), 0), 0);
  let gross = 0, disc = 0;
  for (const b of bills) for (const r of b.rows) { disc += r.discount ?? 0; gross += (r.total ?? 0) + (r.discount ?? 0); }
  const byPerson = (() => {
    const m = new Map<string, { bills: number; total: number }>();
    for (const b of bills) { const c = m.get(b.author) ?? { bills: 0, total: 0 }; c.bills += 1; c.total += b.total; m.set(b.author, c); }
    return [...m.entries()].map(([author, v]) => ({ author, ...v })).sort((a, b) => b.total - a.total);
  })();
  const sellers = byPerson.map((p) => p.author);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.head}>
          <View>
            <Text style={s.brand}>Lab Parfumo</Text>
            <Text style={s.sub}>สรุปยอดขายประจำวัน · {srcLabel}</Text>
            {sellers.length > 0 && <Text style={s.seller}>พนักงานขาย: <Text style={{ fontWeight: "bold" }}>{sellers.join(" · ")}</Text></Text>}
          </View>
          <View>
            <Text style={s.dateBig}>{thaiDate(date)}</Text>
            <Text style={s.gen}>ออกเอกสารเมื่อ {generatedAt} น.</Text>
          </View>
        </View>

        {/* KPIs */}
        <View style={s.kpiRow}>
          <View style={[s.kpi, s.kpiPrimary]}><Text style={s.kpiLabel}>ยอดขายรวม</Text><Text style={s.kpiValBig}>{nf(report.total)}</Text></View>
          <View style={s.kpi}><Text style={s.kpiLabel}>จำนวนบิล</Text><Text style={s.kpiVal}>{report.orders}</Text></View>
          <View style={s.kpi}><Text style={s.kpiLabel}>จำนวนชิ้น</Text><Text style={s.kpiVal}>{Math.round(totalQty)}</Text></View>
          <View style={s.kpi}><Text style={s.kpiLabel}>เฉลี่ย/บิล</Text><Text style={s.kpiVal}>{nf(aov)}</Text></View>
        </View>

        {/* breakdowns */}
        <View style={s.cols}>
          <View style={s.col}>
            <Text style={s.secTitle}>ช่องทางรับเงิน</Text>
            <View style={s.kv}><Text>เงินสด</Text><Text style={s.kvVal}>฿{nf(report.cash)}</Text></View>
            <View style={s.kv}><Text>โอน / เครดิต</Text><Text style={s.kvVal}>฿{nf(report.nonCash)}</Text></View>
          </View>
          <View style={s.col}>
            <Text style={s.secTitle}>สัญชาติลูกค้า</Text>
            <View style={s.kv}><Text>คนไทย ({report.thaiCount})</Text><Text style={s.kvVal}>฿{nf(report.thaiAmt)}</Text></View>
            <View style={s.kv}><Text>ต่างชาติ ({report.foreignCount})</Text><Text style={s.kvVal}>฿{nf(report.foreignAmt)}</Text></View>
            {report.otherCount > 0 && <View style={s.kv}><Text>อื่นๆ ({report.otherCount})</Text><Text style={s.kvVal}>฿{nf(report.otherAmt)}</Text></View>}
          </View>
        </View>

        {/* per-salesperson (only if >1) */}
        {byPerson.length > 1 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={s.secTitle}>สรุปตามพนักงานขาย</Text>
            <View style={s.th}>
              <Text style={[s.cell, s.cellL, s.hCell, { flex: 1 }]}>พนักงานขาย</Text>
              <Text style={[s.cell, s.hCell, { width: 90, textAlign: "right" }]}>จำนวนบิล</Text>
              <Text style={[s.cell, s.hCell, { width: 100, textAlign: "right" }]}>ยอด (฿)</Text>
            </View>
            {byPerson.map((p, i) => (
              <View key={i} style={s.tr}>
                <Text style={[s.cell, s.cellL, { flex: 1, fontWeight: "bold" }]}>{p.author}</Text>
                <Text style={[s.cell, { width: 90, textAlign: "right" }]}>{p.bills}</Text>
                <Text style={[s.cell, { width: 100, textAlign: "right", fontWeight: "bold" }]}>{nf(p.total)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* per-bill detail */}
        <Text style={s.secTitle}>บิลทั้งหมด</Text>
        <View style={s.th}>
          {["#", "เวลา", "สินค้า", "ชำระ", "สัญชาติ", "ยอด (฿)"].map((h, i) => (
            <Text key={i} style={[s.cell, i === 0 ? s.cellL : {}, s.hCell, { width: W[i], textAlign: i === 5 ? "right" : "left" }]}>{h}</Text>
          ))}
        </View>
        {bills.map((b) => (
          <View key={b.key} style={s.tr} wrap={false}>
            <Text style={[s.cell, s.cellL, { width: W[0], fontWeight: "bold" }]}>{b.no}</Text>
            <Text style={[s.cell, { width: W[1] }]}>{b.time || "-"}</Text>
            <View style={[s.cell, { width: W[2] }]}>
              {b.rows.map((r) => {
                const g = (r.total ?? 0) + (r.discount ?? 0);
                return (
                  <View key={r.id} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ flex: 1, fontSize: 8 }}>{Math.round(r.qty ?? 0)}× {r.item}{r.size ? ` ${r.size}` : ""}</Text>
                    <Text style={{ width: 70, textAlign: "right", fontSize: 8, color: C.muted }}>เต็ม {nf(g)}</Text>
                    <Text style={{ width: 54, textAlign: "right", fontSize: 8, color: C.muted }}>ลด {nf(r.discount ?? 0)}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={[s.cell, { width: W[3] }]}>{payLabel(b.pay)}</Text>
            <Text style={[s.cell, { width: W[4] }]}>{natLabel(b.nation)}</Text>
            <Text style={[s.cell, { width: W[5], textAlign: "right", fontWeight: "bold" }]}>{nf(b.total)}</Text>
          </View>
        ))}
        <View style={s.foot}>
          <Text style={[s.cell, s.cellL, { width: W[0] + W[1], fontWeight: "bold" }]}>รวม</Text>
          <Text style={[s.cell, { width: W[2], textAlign: "right", fontWeight: "bold" }]}>เต็ม {nf(gross)} · ลด {nf(disc)}</Text>
          <Text style={[s.cell, { width: W[3] + W[4], fontWeight: "bold" }]}>{bills.length} บิล</Text>
          <Text style={[s.cell, { width: W[5], textAlign: "right", fontWeight: "bold" }]}>{nf(report.total)}</Text>
        </View>

        <View style={s.signRow}>
          <View style={s.sign}><View style={s.signLine} /><Text style={{ fontSize: 8, color: C.muted }}>ผู้จัดทำ</Text></View>
          <View style={s.sign}><View style={s.signLine} /><Text style={{ fontSize: 8, color: C.muted }}>ผู้ตรวจสอบ</Text></View>
        </View>
      </Page>
    </Document>
  );
}
