"use server";
import ExcelJS from "exceljs";
import { requirePermission } from "@/lib/auth/require-user";
import { stockLive } from "@/lib/queries";
import { q } from "@/lib/db";

export type ImportLine = { barcode: string; scent: string; size: string; expected: number; counted: number };

const norm = (v: any) => String(v ?? "").trim().toLowerCase();
// a numeric barcode cell (8857128011188) must become the exact string, no ".0"/scientific
const cellText = (v: any): string => {
  if (v == null) return "";
  if (typeof v === "object") { if ("text" in v) return String((v as any).text); if ("result" in v) return String((v as any).result); }
  if (typeof v === "number") return Number.isInteger(v) ? v.toFixed(0) : String(v);
  return String(v).trim();
};
const cellNum = (v: any): number => {
  const n = Number(cellText(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** Parse an uploaded CTW inventory workbook (columns: Code, รายการน้ำหอม, …, คงเหลือ) into
 *  editable count lines. `counted` = the file's คงเหลือ (what CTW stock should become);
 *  `expected` = current SYSTEM stock, so approval posts the right adjustment (counted−expected). */
export async function parseInventoryUpload(formData: FormData): Promise<{ ok: boolean; error?: string; lines?: ImportLine[] }> {
  await requirePermission("requisitions");
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "ไม่พบไฟล์" };
  if (!/\.xlsx$/i.test(file.name)) return { ok: false, error: "รองรับเฉพาะไฟล์ .xlsx" };

  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(Buffer.from(await file.arrayBuffer()) as any); }
  catch { return { ok: false, error: "อ่านไฟล์ไม่สำเร็จ (ไฟล์เสียหรือไม่ใช่ .xlsx)" }; }
  const ws = wb.worksheets[0];
  if (!ws) return { ok: false, error: "ไฟล์ว่าง" };

  // locate the header row + the Code / คงเหลือ / name columns by their labels
  let codeCol = 0, keepCol = 0, nameCol = 0, headerRow = 0;
  for (let r = 1; r <= Math.min(ws.rowCount, 10) && !headerRow; r++) {
    const row = ws.getRow(r);
    row.eachCell((cell, col) => {
      const t = norm(cellText(cell.value));
      if (t === "code" || t === "barcode" || t === "บาร์โค้ด") codeCol = col;
      else if (t.includes("คงเหลือ") || t === "remaining") keepCol = col;
      else if (t.includes("รายการ") || t.includes("กลิ่น") || t === "name") nameCol = col;
    });
    if (codeCol && keepCol) headerRow = r;
  }
  if (!headerRow) return { ok: false, error: "ไม่พบคอลัมน์ Code และ คงเหลือ ในไฟล์" };

  // read rows
  const raw: { barcode: string; name: string; counted: number }[] = [];
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const barcode = cellText(row.getCell(codeCol).value);
    if (!barcode) continue;
    raw.push({ barcode, name: nameCol ? cellText(row.getCell(nameCol).value) : "", counted: Math.max(0, Math.round(cellNum(row.getCell(keepCol).value))) });
  }
  if (!raw.length) return { ok: false, error: "ไม่พบข้อมูลสินค้าในไฟล์" };

  // enrich: current CTW system stock (expected) + product scent/size for accurate labels
  const stock = await stockLive("CTW");
  const stockMap = new Map(stock.map((s) => [s.barcode, s]));
  const codes = raw.map((r) => r.barcode);
  let prodMap = new Map<string, { scent: string; size: string }>();
  try {
    const prods = await q<{ barcode: string; scent: string; size: string }>(
      `select barcode, coalesce(scent,'') scent, coalesce(size,'') size from products where barcode = any($1)`, [codes]);
    prodMap = new Map(prods.map((p) => [p.barcode, { scent: p.scent, size: p.size }]));
  } catch { /* products lookup is best-effort */ }

  const lines: ImportLine[] = raw.map((r) => {
    const st = stockMap.get(r.barcode);
    const pr = prodMap.get(r.barcode);
    return {
      barcode: r.barcode,
      scent: (pr?.scent || st?.scent || r.name || r.barcode),
      size: (pr?.size || st?.size || ""),
      expected: Math.max(0, Math.round(Number(st?.remaining) || 0)),
      counted: r.counted,
    };
  });
  return { ok: true, lines };
}
