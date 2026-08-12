/**
 * ใบเบิกสินค้า + ใบส่งของ — react-pdf document (ภาษาไทย, ฟอนต์ Noto Sans Thai)
 * แนวเดียวกับ lib/pdf/po-document.tsx ของ lab-parfumo-next
 */
import path from "path";
import { Document, Page, Text, View, StyleSheet, Font, Svg, Rect } from "@react-pdf/renderer";
import { code39 } from "./code39";

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

// NOTE on Thai in this document: every Thai string here is a STATIC label we
// control (all dynamic data — scent names, barcodes — is Latin). @react-pdf v4's
// text shaper drops the leading glyph of the specific cluster "ร"+"า" ("รายการ"),
// a bug that neither ZWSP/WORD-JOINER prefixes nor a font swap resolve. Rather
// than ship a broken header we avoid that one cluster (see column labels below).
const T = (s: any) => (s == null ? "" : String(s));

const C = { ink: "#1a1614", muted: "#6b645d", faint: "#9a938c", border: "#d8d3cc", gold: "#8a6d3f", blue: "#2c4460", soft: "#f4f2ee" };

const s = StyleSheet.create({
  page: { fontFamily: "NotoSansThai", fontSize: 9, color: C.ink, padding: 32, lineHeight: 1.4 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 2, borderBottomColor: C.ink, paddingBottom: 10, marginBottom: 14 },
  company: { fontSize: 13, fontWeight: "bold" },
  addr: { fontSize: 7.5, color: C.muted, marginTop: 3, maxWidth: 300 },
  docTitle: { fontSize: 18, fontWeight: "bold", lineHeight: 1 },
  docHead: { alignItems: "flex-end" },
  docSub: { fontSize: 8, color: C.faint, textAlign: "right", marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  field: { width: "50%", flexDirection: "row", marginBottom: 3 },
  fLabel: { color: C.muted, width: 78 },
  fVal: { fontWeight: "bold", flex: 1 },
  th: { flexDirection: "row", backgroundColor: C.soft, borderTopWidth: 1, borderColor: C.border },
  tr: { flexDirection: "row", borderTopWidth: 1, borderColor: C.border },
  trLast: { borderBottomWidth: 1, borderColor: C.border },
  cell: { paddingVertical: 4, paddingHorizontal: 5, borderRightWidth: 1, borderColor: C.border },
  cellL: { borderLeftWidth: 1, borderColor: C.border },
  hCell: { fontWeight: "bold", fontSize: 8, color: C.muted },
  foot: { flexDirection: "row", borderTopWidth: 1, borderColor: C.border, backgroundColor: C.soft },
  // received banner — mirrors the on-screen preview (green = ครบ, amber = มีส่วนต่าง)
  banner: { marginBottom: 12, borderRadius: 6, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 10, fontSize: 8.5 },
  bannerOk: { backgroundColor: "#eaf6ee", borderColor: "#bfe3cb", color: "#2e7d46" },
  bannerWarn: { backgroundColor: "#fdf3e2", borderColor: "#eacf97", color: "#8a5a12" },
  lineRemark: { fontSize: 6.5, color: "#8a5a12", marginTop: 1 },
  recvWarn: { color: "#8a5a12", backgroundColor: "#fdf3e2" },
  signRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 44 },
  sign: { width: "42%", alignItems: "center" },
  signLine: { borderBottomWidth: 1, borderColor: C.faint, width: "100%", height: 1, marginBottom: 4 },
  signLabel: { fontSize: 8, color: C.muted },
});

export type PdfItem = { barcode?: string; scent?: string; size?: string; qty?: number; grade?: string; sku?: string; received_qty?: number | null; line_remark?: string | null };
export type PdfPO = {
  po_number: string; version?: string; order_date?: string; branch_label?: string; status?: string;
  store_no?: string; delivery_number?: string; phone?: string; shipping_name?: string; address?: string;
};

const COMPANY = "บริษัท ทัช ไดเวอร์เจนซ์ จำกัด";
const COMPANY_ADDR = "288/31 หมู่ที่ 12 ต.ราชาเทวะ อ.บางพลี จ.สมุทรปราการ 10540 · 081-234-1438";
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" }) : "-");

function Field({ label, value }: { label: string; value?: string }) {
  return <View style={s.field}><Text style={s.fLabel}>{T(label)}</Text><Text style={s.fVal}>{T(value || "-")}</Text></View>;
}
function Sign({ label }: { label: string }) {
  return <View style={s.sign}><View style={s.signLine} /><Text style={s.signLabel}>{T("(" + label + ")")}</Text></View>;
}

/** Real, scannable Code 39 barcode drawn as vector bars (no canvas needed). */
function Barcode({ value, width, height = 20 }: { value: string; width: number; height?: number }) {
  const v = (value || "").trim();
  if (!v) return <Text style={{ fontSize: 7.5, color: C.faint }}>-</Text>;
  const bc = code39(v);
  const scale = width / bc.totalModules;
  return (
    <View>
      <Svg width={width} height={height}>
        {bc.bars.map((b, i) => <Rect key={i} x={b.x * scale} y={0} width={b.w * scale} height={height} fill="#000" />)}
      </Svg>
      <Text style={{ fontSize: 6, textAlign: "center", color: C.muted, marginTop: 1, letterSpacing: 0.3 }}>{v}</Text>
    </View>
  );
}

export function RequisitionDocument({ po, items }: { po: PdfPO; items: PdfItem[] }) {
  registerFontOnce();
  const total = items.reduce((a, i) => a + (Number(i.qty) || 0), 0);
  const received = po.status === "received";
  const totalRecv = items.reduce((a, i) => a + (Number(i.received_qty ?? i.qty) || 0), 0);
  const hasDiff = received && items.some((i) => i.received_qty != null && Number(i.received_qty) !== Number(i.qty));

  // column widths — sum to the full A4 content width (595.28 − 2×32 padding ≈ 531pt)
  // so the table fills the page edge-to-edge exactly like the on-screen preview's
  // w-full table. An extra "รับจริง" column appears once the goods are received.
  // # code barcode name type size เบิก [รับจริง] unit
  const W = received
    ? { idx: 20, sku: 56, bc: 130, name: 133, grade: 40, size: 44, qty: 36, recv: 40, unit: 32 }
    : { idx: 22, sku: 60, bc: 140, name: 143, grade: 44, size: 48, qty: 40, recv: 0, unit: 34 };
  const labelW = W.idx + W.sku + W.bc + W.name + W.grade + W.size;

  // One requisition page; printed twice — ต้นฉบับ (original) + สำเนา (copy) — identical layout.
  const ReqPage = ({ copyLabel }: { copyLabel: string }) => (
    <Page size="A4" style={s.page}>
      <View style={s.head}>
        <View><Text style={s.company}>{T(COMPANY)}</Text><Text style={s.addr}>{T(COMPANY_ADDR)}</Text></View>
        <View style={s.docHead}>
          <Text style={[s.docTitle, { color: C.gold }]}>{T("ใบเบิกสินค้า")}</Text>
          <Text style={s.docSub}>Requisition · {T(copyLabel)}</Text>
        </View>
      </View>
      <View style={s.grid}>
        <Field label="PO Order No." value={po.po_number} />
        <Field label="วันที่" value={fmtDate(po.order_date)} />
        <Field label="PO Version" value={po.version} />
        <Field label="Branch" value={po.branch_label} />
        <Field label="รหัสสาขา" value={po.store_no} />
        <Field label="Delivery No." value={po.delivery_number} />
      </View>

      {received && (
        <View style={[s.banner, hasDiff ? s.bannerWarn : s.bannerOk]}>
          {hasDiff
            ? <Text>{T(`รับของแล้ว · มีส่วนต่าง — เบิก ${total} · รับจริง ${totalRecv} (${totalRecv - total > 0 ? "+" : ""}${totalRecv - total})`)}</Text>
            : <Text>{T(`รับของแล้ว · ครบตามเบิก (${totalRecv} ขวด)`)}</Text>}
        </View>
      )}

      <View style={s.th}>
        <Text style={[s.cell, s.cellL, s.hCell, { width: W.idx }]}>#</Text>
        <Text style={[s.cell, s.hCell, { width: W.sku }]}>{T("รหัสสินค้า")}</Text>
        <Text style={[s.cell, s.hCell, { width: W.bc }]}>Barcode</Text>
        <Text style={[s.cell, s.hCell, { width: W.name }]}>{T("ชื่อสินค้า")}</Text>
        <Text style={[s.cell, s.hCell, { width: W.grade }]}>{T("ประเภท")}</Text>
        <Text style={[s.cell, s.hCell, { width: W.size }]}>{T("ขนาด")}</Text>
        <Text style={[s.cell, s.hCell, { width: W.qty, textAlign: "right" }]}>{T("เบิก")}</Text>
        {received && <Text style={[s.cell, s.hCell, { width: W.recv, textAlign: "right" }]}>{T("รับจริง")}</Text>}
        <Text style={[s.cell, s.hCell, { width: W.unit }]}>{T("หน่วย")}</Text>
      </View>
      {items.map((it, i) => {
        const rq = it.received_qty ?? it.qty;
        const diff = received && it.received_qty != null && Number(it.received_qty) !== Number(it.qty);
        return (
          <View key={i} style={[s.tr, i === items.length - 1 ? s.trLast : {}]}>
            <Text style={[s.cell, s.cellL, { width: W.idx, color: C.faint }]}>{i + 1}</Text>
            <Text style={[s.cell, { width: W.sku }]}>{T(it.sku || "-")}</Text>
            <View style={[s.cell, { width: W.bc, justifyContent: "center" }]}><Barcode value={it.barcode || ""} width={W.bc - 10} height={20} /></View>
            <View style={[s.cell, { width: W.name }]}>
              <Text>{T(it.scent || "-")}</Text>
              {diff && it.line_remark ? <Text style={s.lineRemark}>{T("↳ " + it.line_remark)}</Text> : null}
            </View>
            <Text style={[s.cell, { width: W.grade }]}>{T(it.grade || "-")}</Text>
            <Text style={[s.cell, { width: W.size }]}>{T(it.size || "-")}</Text>
            <Text style={[s.cell, { width: W.qty, textAlign: "right", fontWeight: "bold" }]}>{Number(it.qty) || 0}</Text>
            {received && <Text style={[s.cell, diff ? s.recvWarn : {}, { width: W.recv, textAlign: "right", fontWeight: "bold" }]}>{Number(rq) || 0}</Text>}
            <Text style={[s.cell, { width: W.unit }]}>{T("ขวด")}</Text>
          </View>
        );
      })}
      <View style={s.foot}>
        <Text style={[s.cell, s.cellL, { width: labelW, textAlign: "right", fontWeight: "bold" }]}>{T("รวมทั้งสิ้น")}</Text>
        <Text style={[s.cell, { width: W.qty, textAlign: "right", fontWeight: "bold" }]}>{total}</Text>
        {received && <Text style={[s.cell, { width: W.recv, textAlign: "right", fontWeight: "bold" }]}>{totalRecv}</Text>}
        <Text style={[s.cell, { width: W.unit }]}>{T("ขวด")}</Text>
      </View>
      {/* signatures pinned to the bottom → equal top/bottom margins even for short lists */}
      <View style={{ flexGrow: 1 }} />
      <View style={s.signRow}><Sign label="ผู้เบิก" /><Sign label="ผู้รับสินค้า" /></View>
    </Page>
  );

  return (
    <Document>
      <ReqPage copyLabel="ต้นฉบับ" />
      <ReqPage copyLabel="สำเนา" />
    </Document>
  );
}
