"use server";
import { q } from "@/lib/db";

export async function searchProducts(term: string) {
  const t = `%${(term ?? "").trim()}%`;
  return q<{ id: number; barcode: string; scent: string; grade: string; size: string; sku: string; price: number }>(`
    select id, barcode, scent, grade, size, sku, price::float
    from products
    where scent ilike $1 or barcode ilike $1 or sku ilike $1
    order by scent, size limit 25`, [t]);
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
