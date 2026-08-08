import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

type Row = {
  sale_date: string; sale_time: string | null; receipt_no: string | null; author: string;
  item: string | null; size: string | null; qty: number; unit_price: number; discount: number;
  total: number; payment_channel: string | null; nation: string | null; source: string | null;
};

const MONEY = "#,##0.00";
const INT = "#,##0";
const thMonth = (m: string) => {
  const [y, mm] = m.split("-").map(Number);
  const names = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  return `${names[mm] || mm} ${y + 543}`;
};
const nation = (n: string | null) => (n === "Foreign" ? "ต่างชาติ" : n === "Thai" ? "ไทย" : (n || ""));

// Style a sheet's header row (row 1) consistently.
function styleHeader(ws: ExcelJS.Worksheet) {
  const h = ws.getRow(1);
  h.font = { bold: true, color: { argb: "FFFFFFFF" } };
  h.alignment = { vertical: "middle" };
  h.height = 20;
  h.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF8A6D3F" } }; });
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });
  if (!can(user, "sales")) return new NextResponse("forbidden", { status: 403 });

  const url = new URL(req.url);
  const month = (url.searchParams.get("month") || "").match(/^\d{4}-\d{2}$/)?.[0]
    || new Date().toISOString().slice(0, 7);
  const source = url.searchParams.get("source"); // optional: CTW / EVENT_SCS; null = all

  const first = `${month}-01`;
  const rows = await q<Row>(
    `select s.sale_date::text sale_date, s.sale_time::text sale_time, s.receipt_no,
       coalesce(u.full_name, nullif(s.ba,''), 'ไม่ระบุ') author,
       s.item, s.size, s.qty::float qty, coalesce(s.unit_price,0)::float unit_price,
       coalesce(s.discount,0)::float discount, coalesce(s.total,0)::float total,
       s.payment_channel, s.nation, s.source
     from sales s left join users u on u.id = s.created_by
     where s.sale_date >= $1::date and s.sale_date < ($1::date + interval '1 month')
       and ($2::text is null or s.source = $2)
     order by s.sale_date, s.sale_time nulls last, s.receipt_no, s.id`,
    [first, source]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Lab Parfumo";

  // ---- Sheet 1: รายละเอียด (every sale line) ----
  const d = wb.addWorksheet("รายละเอียด");
  d.columns = [
    { header: "วันที่", key: "sale_date", width: 12 },
    { header: "เวลา", key: "sale_time", width: 8 },
    { header: "เลขใบเสร็จ", key: "receipt_no", width: 18 },
    { header: "พนักงานขาย", key: "author", width: 16 },
    { header: "สินค้า", key: "item", width: 28 },
    { header: "ขนาด", key: "size", width: 9 },
    { header: "จำนวน", key: "qty", width: 8, style: { numFmt: INT } },
    { header: "ราคา/หน่วย", key: "unit_price", width: 12, style: { numFmt: MONEY } },
    { header: "ส่วนลด", key: "discount", width: 11, style: { numFmt: MONEY } },
    { header: "ยอดสุทธิ", key: "total", width: 12, style: { numFmt: MONEY } },
    { header: "ช่องทางชำระ", key: "payment_channel", width: 16 },
    { header: "สัญชาติ", key: "nation", width: 9 },
    { header: "ช่องทางขาย", key: "source", width: 12 },
  ];
  for (const r of rows) {
    d.addRow({ ...r, sale_time: (r.sale_time || "").slice(0, 5), nation: nation(r.nation) });
  }
  // totals row
  const totQty = rows.reduce((s, r) => s + r.qty, 0);
  const totDisc = rows.reduce((s, r) => s + r.discount, 0);
  const totNet = rows.reduce((s, r) => s + r.total, 0);
  const tr = d.addRow({ receipt_no: "", author: "", item: "รวมทั้งหมด", qty: totQty, discount: totDisc, total: totNet });
  tr.font = { bold: true };
  tr.getCell("qty").numFmt = INT; tr.getCell("discount").numFmt = MONEY; tr.getCell("total").numFmt = MONEY;
  styleHeader(d);

  // ---- Sheet 2: สรุปรายวัน ----
  const byDay = new Map<string, { bills: Set<string>; qty: number; disc: number; net: number }>();
  for (const r of rows) {
    const k = r.sale_date;
    const g = byDay.get(k) || { bills: new Set<string>(), qty: 0, disc: 0, net: 0 };
    g.bills.add(r.receipt_no || `#${k}`); g.qty += r.qty; g.disc += r.discount; g.net += r.total;
    byDay.set(k, g);
  }
  const sDay = wb.addWorksheet("สรุปรายวัน");
  sDay.columns = [
    { header: "วันที่", key: "date", width: 12 },
    { header: "จำนวนบิล", key: "bills", width: 11, style: { numFmt: INT } },
    { header: "จำนวนชิ้น", key: "qty", width: 11, style: { numFmt: INT } },
    { header: "ส่วนลด", key: "disc", width: 13, style: { numFmt: MONEY } },
    { header: "ยอดขาย", key: "net", width: 14, style: { numFmt: MONEY } },
  ];
  for (const [date, g] of [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    sDay.addRow({ date, bills: g.bills.size, qty: g.qty, disc: g.disc, net: g.net });
  }
  const dTot = sDay.addRow({ date: "รวม", bills: null, qty: totQty, disc: totDisc, net: totNet });
  dTot.font = { bold: true }; dTot.getCell("qty").numFmt = INT; dTot.getCell("disc").numFmt = MONEY; dTot.getCell("net").numFmt = MONEY;
  styleHeader(sDay);

  // ---- Sheet 3: สรุปพนักงาน ----
  const byPerson = new Map<string, { bills: Set<string>; qty: number; net: number }>();
  for (const r of rows) {
    const g = byPerson.get(r.author) || { bills: new Set<string>(), qty: 0, net: 0 };
    g.bills.add(r.receipt_no || `#${r.sale_date}`); g.qty += r.qty; g.net += r.total;
    byPerson.set(r.author, g);
  }
  const sP = wb.addWorksheet("สรุปพนักงาน");
  sP.columns = [
    { header: "พนักงานขาย", key: "author", width: 18 },
    { header: "จำนวนบิล", key: "bills", width: 11, style: { numFmt: INT } },
    { header: "จำนวนชิ้น", key: "qty", width: 11, style: { numFmt: INT } },
    { header: "ยอดขาย", key: "net", width: 14, style: { numFmt: MONEY } },
  ];
  for (const [author, g] of [...byPerson.entries()].sort((a, b) => b[1].net - a[1].net)) {
    sP.addRow({ author, bills: g.bills.size, qty: g.qty, net: g.net });
  }
  styleHeader(sP);

  // ---- Sheet 4: สรุปสินค้า (top sellers) ----
  const byItem = new Map<string, { qty: number; net: number }>();
  for (const r of rows) {
    const k = `${r.item || "-"}${r.size ? ` ${r.size}` : ""}`;
    const g = byItem.get(k) || { qty: 0, net: 0 };
    g.qty += r.qty; g.net += r.total; byItem.set(k, g);
  }
  const sI = wb.addWorksheet("สรุปสินค้า");
  sI.columns = [
    { header: "อันดับ", key: "rank", width: 8, style: { numFmt: INT } },
    { header: "สินค้า", key: "item", width: 32 },
    { header: "จำนวนชิ้น", key: "qty", width: 11, style: { numFmt: INT } },
    { header: "ยอดขาย", key: "net", width: 14, style: { numFmt: MONEY } },
  ];
  [...byItem.entries()].sort((a, b) => b[1].net - a[1].net).forEach(([item, g], i) => {
    sI.addRow({ rank: i + 1, item, qty: g.qty, net: g.net });
  });
  styleHeader(sI);

  const buf = await wb.xlsx.writeBuffer();
  const fname = `LAB-Sales-${month}.xlsx`;
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fname}"`,
      "Cache-Control": "no-store",
    },
  });
}
