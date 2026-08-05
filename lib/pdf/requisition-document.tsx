/**
 * ใบเบิกสินค้า + ใบส่งของ — react-pdf document (ภาษาไทย, ฟอนต์ Noto Sans Thai)
 * แนวเดียวกับ lib/pdf/po-document.tsx ของ lab-parfumo-next
 */
import path from "path";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

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
  docTitle: { fontSize: 18, fontWeight: "bold" },
  docSub: { fontSize: 8, color: C.faint, textAlign: "right" },
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
  signRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 44 },
  sign: { width: "42%", alignItems: "center" },
  signLine: { borderBottomWidth: 1, borderColor: C.faint, width: "100%", height: 1, marginBottom: 4 },
  signLabel: { fontSize: 8, color: C.muted },
});

export type PdfItem = { barcode?: string; scent?: string; size?: string; qty?: number; grade?: string; sku?: string };
export type PdfPO = {
  po_number: string; version?: string; order_date?: string; branch_label?: string;
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

export function RequisitionDocument({ po, items }: { po: PdfPO; items: PdfItem[] }) {
  registerFontOnce();
  const total = items.reduce((a, i) => a + (Number(i.qty) || 0), 0);
  // column widths (requisition): # code barcode name grade size qty unit
  const rq = [22, 60, 92, 130, 40, 42, 40, 34];
  const dv = [22, 110, 180, 70, 50];

  return (
    <Document>
      {/* ---------- ใบเบิกสินค้า ---------- */}
      <Page size="A4" style={s.page}>
        <View style={s.head}>
          <View><Text style={s.company}>{T(COMPANY)}</Text><Text style={s.addr}>{T(COMPANY_ADDR)}</Text></View>
          <View><Text style={[s.docTitle, { color: C.gold }]}>{T("ใบเบิกสินค้า")}</Text><Text style={s.docSub}>Requisition</Text></View>
        </View>
        <View style={s.grid}>
          <Field label="PO Order No." value={po.po_number} />
          <Field label="วันที่" value={fmtDate(po.order_date)} />
          <Field label="PO Version" value={po.version} />
          <Field label="Branch" value={po.branch_label} />
          <Field label="รหัสสาขา" value={po.store_no} />
          <Field label="Delivery No." value={po.delivery_number} />
        </View>
        <View style={s.th}>
          {["#", "รหัสสินค้า", "Barcode", "ชื่อสินค้า", "ประเภท", "ขนาด", "จำนวน", "หน่วย"].map((h, i) => (
            <Text key={i} style={[s.cell, i === 0 ? s.cellL : {}, s.hCell, { width: rq[i], textAlign: i === 6 ? "right" : "left" }]}>{T(h)}</Text>
          ))}
        </View>
        {items.map((it, i) => (
          <View key={i} style={[s.tr, i === items.length - 1 ? s.trLast : {}]}>
            <Text style={[s.cell, s.cellL, { width: rq[0], color: C.faint }]}>{i + 1}</Text>
            <Text style={[s.cell, { width: rq[1] }]}>{T(it.sku || "-")}</Text>
            <Text style={[s.cell, { width: rq[2], fontSize: 7.5 }]}>{it.barcode || "-"}</Text>
            <Text style={[s.cell, { width: rq[3] }]}>{T(it.scent || "-")}</Text>
            <Text style={[s.cell, { width: rq[4] }]}>{T(it.grade || "-")}</Text>
            <Text style={[s.cell, { width: rq[5] }]}>{T(it.size || "-")}</Text>
            <Text style={[s.cell, { width: rq[6], textAlign: "right", fontWeight: "bold" }]}>{Number(it.qty) || 0}</Text>
            <Text style={[s.cell, { width: rq[7] }]}>{T("ขวด")}</Text>
          </View>
        ))}
        <View style={s.foot}>
          <Text style={[s.cell, s.cellL, { width: rq[0] + rq[1] + rq[2] + rq[3] + rq[4] + rq[5], textAlign: "right", fontWeight: "bold" }]}>{T("รวมทั้งสิ้น")}</Text>
          <Text style={[s.cell, { width: rq[6], textAlign: "right", fontWeight: "bold" }]}>{total}</Text>
          <Text style={[s.cell, { width: rq[7] }]}>{T("ขวด")}</Text>
        </View>
        <View style={s.signRow}><Sign label="ผู้เบิก" /><Sign label="ผู้อนุมัติ" /></View>
      </Page>

      {/* ---------- ใบส่งของ ---------- */}
      <Page size="A4" style={s.page}>
        <View style={s.head}>
          <View><Text style={s.company}>{T(COMPANY)}</Text><Text style={s.addr}>{T(COMPANY_ADDR)}</Text></View>
          <View><Text style={[s.docTitle, { color: C.blue }]}>{T("ใบส่งของ")}</Text><Text style={s.docSub}>Delivery Note</Text></View>
        </View>
        <View style={s.grid}>
          <Field label="Delivery No." value={po.delivery_number} />
          <Field label="Delivery Date" value={fmtDate(po.order_date)} />
          <Field label="PO Order No." value={po.po_number} />
          <Field label="Deliver To" value={po.shipping_name || po.branch_label} />
          <Field label="Phone" value={po.phone} />
          <Field label="Address" value={po.address} />
        </View>
        <View style={s.th}>
          {["#", "Product Code", "ชื่อสินค้า", "Size", "Qty"].map((h, i) => (
            <Text key={i} style={[s.cell, i === 0 ? s.cellL : {}, s.hCell, { width: dv[i], textAlign: i === 4 ? "right" : "left" }]}>{T(h)}</Text>
          ))}
        </View>
        {items.map((it, i) => (
          <View key={i} style={[s.tr, i === items.length - 1 ? s.trLast : {}]}>
            <Text style={[s.cell, s.cellL, { width: dv[0], color: C.faint }]}>{i + 1}</Text>
            <Text style={[s.cell, { width: dv[1], fontSize: 7.5 }]}>{it.barcode || "-"}</Text>
            <Text style={[s.cell, { width: dv[2] }]}>{T(it.scent || "-")}</Text>
            <Text style={[s.cell, { width: dv[3] }]}>{T(it.size || "-")}</Text>
            <Text style={[s.cell, { width: dv[4], textAlign: "right", fontWeight: "bold" }]}>{Number(it.qty) || 0}</Text>
          </View>
        ))}
        <View style={s.signRow}><Sign label="ผู้ส่งสินค้า" /><Sign label="ผู้รับสินค้า" /></View>
      </Page>
    </Document>
  );
}
