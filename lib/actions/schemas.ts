/**
 * Zod schemas for Server Action inputs — mirrors lab-parfumo-next convention.
 * Every action validates via .safeParse() before touching the DB.
 */
import { z } from "zod";

const dateStr = z.string().min(8, "กรุณาระบุวันที่");

export const reqItemSchema = z.object({
  barcode: z.string().trim().max(64).optional().default(""),
  scent: z.string().trim().max(200),
  size: z.string().trim().max(40).optional().default(""),
  qty: z.coerce.number().min(0, "จำนวนต้องไม่ติดลบ").max(999999),
  product_id: z.number().int().nullable().optional(),
}).refine((i) => i.scent || i.barcode, "ต้องมีชื่อสินค้าหรือบาร์โค้ด");

export const requisitionSchema = z.object({
  order_date: dateStr,
  branch_label: z.string().trim().min(1, "กรุณาเลือกสาขา").max(120),
  store_no: z.string().trim().max(60).optional(),
  delivery_number: z.string().trim().max(60).optional(),
  phone: z.string().trim().max(40).optional(),
  shipping_name: z.string().trim().max(200).optional(),
  address: z.string().trim().max(400).optional(),
  remark: z.string().trim().max(500).optional(),
  status: z.enum(["draft", "issued", "delivered", "closed"]).optional(),
  items: z.array(reqItemSchema).min(1, "กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ").max(200),
});

export const shipmentSchema = z.object({
  po_number: z.string().trim().min(1, "เลือก PO ก่อน").max(60),
  ship_date: dateStr,
  branch_label: z.string().trim().max(120).optional().default(""),
  lines: z.array(z.object({
    barcode: z.string().trim().max(64).optional().default(""),
    name: z.string().trim().max(200).optional().default(""),
    grade: z.string().trim().max(40).optional().default(""),
    size: z.string().trim().max(40).optional().default(""),
    skus: z.array(z.string().trim().max(60)),
  })).min(1),
});

export const returnSchema = z.object({
  po_number: z.string().trim().min(1, "เลือก PO ก่อน").max(60),
  return_date: dateStr,
  branch_label: z.string().trim().max(120).optional().default(""),
  skus: z.array(z.string().trim().max(60)).min(1, "ใส่รหัสหน่วยอย่างน้อย 1"),
});

export const saleSchema = z.object({
  sale_date: dateStr,
  sale_time: z.string().trim().max(8).optional(),   // 'HH:MM' from the entry form
  source: z.string().trim().max(40).default("CTW"),
  ba: z.string().trim().max(120).optional(),
  receipt_no: z.string().trim().max(60).optional(),
  item: z.string().trim().min(1, "กรุณาระบุสินค้า").max(200),
  barcode: z.string().trim().max(64).optional(),
  size: z.string().trim().max(40).optional(),
  qty: z.coerce.number().min(1, "จำนวนต้องอย่างน้อย 1").max(999999),
  unit_price: z.coerce.number().min(0).max(99999999).optional(),
  discount: z.coerce.number().min(0).max(99999999).optional(),
  payment_channel: z.string().trim().max(60).optional(),
  nation: z.string().trim().max(20).optional(),
});

export const customerDaySchema = z.object({
  cust_date: dateStr,
  ba: z.string().trim().max(120).optional(),
  customers: z.coerce.number().int().min(0).max(999999),
  sell_amount: z.coerce.number().min(0).max(99999999).optional(),
  thai: z.coerce.number().min(0).max(999999).optional(),
  foreign: z.coerce.number().min(0).max(999999).optional(),
});

// One bill = one customer, one or more item lines sharing payment/nationality/receipt.
export const billSchema = z.object({
  sale_date: dateStr,
  sale_time: z.string().trim().max(8).optional(),
  source: z.string().trim().max(40).default("CTW"),
  receipt_no: z.string().trim().max(60).optional(),
  payment_channel: z.string().trim().max(60).optional(),
  nation: z.string().trim().max(20).optional(),
  items: z.array(z.object({
    item: z.string().trim().min(1, "กรุณาระบุสินค้า").max(200),
    barcode: z.string().trim().max(64).optional(),
    size: z.string().trim().max(40).optional(),
    qty: z.coerce.number().min(1, "จำนวนต้องอย่างน้อย 1").max(999999),
    unit_price: z.coerce.number().min(0).max(99999999).optional(),
    discount: z.coerce.number().min(0).max(99999999).optional(),
    payment_channel: z.string().trim().max(60).optional(),   // per-item override (else bill default)
  })).min(1, "กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ").max(50),
  attachments: z.array(z.string().startsWith("data:image/", "ไฟล์แนบไม่ถูกต้อง").max(3_000_000)).max(6).optional(),
});

export const productSchema = z.object({
  barcode: z.string().trim().min(1, "กรุณาระบุบาร์โค้ด").max(64),
  scent: z.string().trim().min(1, "กรุณาระบุชื่อกลิ่น").max(200),
  grade: z.string().trim().max(40).optional(),
  size: z.string().trim().max(40).optional(),
  sku: z.string().trim().max(60).optional(),
  price: z.coerce.number().min(0).max(9999999).optional(),
});

export const cashSchema = z.object({
  cash_date: dateStr,
  description: z.string().trim().min(1, "กรุณาระบุรายละเอียด").max(200),
  amount: z.coerce.number().max(9999999999),
  type: z.string().trim().max(60).optional(),
});
