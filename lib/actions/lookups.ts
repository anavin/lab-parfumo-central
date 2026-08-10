"use server";
import { q } from "@/lib/db";
import { PRODUCT_SEARCH_ORDER } from "@/lib/product-order";

export async function searchProducts(term: string) {
  // prefix match ("ขึ้นต้นด้วย" — ตรงจากตัวอักษรแรกตามตำแหน่ง): พิมพ์ B → Bu → Buo
  // เจอเฉพาะกลิ่นที่ขึ้นต้นด้วยตัวนั้น (ไม่ใช่มีอยู่กลางคำ) · เรียง featured ก่อน
  const t = `${(term ?? "").trim()}%`;
  return q<{ id: number; barcode: string; scent: string; grade: string; size: string; sku: string; price: number }>(`
    select id, barcode, scent, grade, size, sku, price::float
    from products
    where scent ilike $1 or barcode ilike $1 or sku ilike $1
    ${PRODUCT_SEARCH_ORDER}`, [t]);
}

/** Exact-match a product by scanned barcode (for the sale form scanner). */
export async function findProductByBarcode(barcode: string) {
  const code = (barcode ?? "").trim();
  if (!code) return null;
  const [p] = await q<{ id: number; barcode: string; scent: string; grade: string; size: string; sku: string; price: number }>(`
    select id, barcode, scent, grade, size, sku, price::float
    from products where barcode = $1 limit 1`, [code]);
  return p ?? null;
}

/** All product barcodes — the scanner cross-checks a decoded value against this so a
 *  real product is accepted instantly and a misread (that matches nothing) is caught. */
export async function productBarcodes() {
  const rows = await q<{ barcode: string }>(`select barcode from products where barcode is not null`);
  return rows.map((r) => r.barcode);
}

export async function listPOs() {
  return q<{ po_number: string; order_date: string; branch_label: string; lines: number; qty: number }>(`
    select po.po_number, po.order_date, po.branch_label,
           count(i.id)::int lines, coalesce(sum(i.qty),0)::float qty
    from purchase_orders po left join po_items i on i.po_id = po.id
    where po.deleted_at is null
    group by po.po_number, po.order_date, po.branch_label
    order by po.order_date desc nulls last, po.po_number desc limit 200`);
}

export async function getPoItems(poNumber: string) {
  return q<{ barcode: string; scent: string; size: string; qty: number; grade: string }>(`
    select i.barcode, i.scent, i.size, i.qty::float, p.grade
    from po_items i
    join purchase_orders po on po.id = i.po_id
    left join products p on p.id = i.product_id
    where po.po_number = $1 order by i.line_no nulls last, i.id`, [poNumber]);
}

export async function listBranches() {
  return q<{ id: number; branch_code: string; store_no: string; receiver: string; phone: string; address: string }>(`
    select id, branch_code, store_no, receiver, tel as phone, address
    from branches order by branch_code`);
}
