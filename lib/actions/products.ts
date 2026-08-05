"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { productSchema } from "./schemas";
import { logAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/require-user";

// Postgres unique_violation → friendly message (barcode is unique).
function friendly(e: any): never {
  if (e?.code === "23505") throw new Error("บาร์โค้ดนี้ถูกใช้กับสินค้าอื่นแล้ว");
  throw e;
}

export async function createProduct(input: unknown) {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const d = parsed.data;
  let id: number;
  try {
    const [row] = await q<{ id: number }>(
      `insert into products (barcode, scent, grade, size, sku, price)
       values ($1,$2,$3,$4,$5,$6) returning id`,
      [d.barcode, d.scent, d.grade || null, d.size || null, d.sku || null, d.price ?? null]);
    id = row.id;
  } catch (e) { friendly(e); }
  // link any past sales that used this barcode but weren't matched to a product
  await q(`update sales set product_id = $1 where barcode = $2 and product_id is null`, [id!, d.barcode]);
  await logAudit("create", "product", id!, `${d.scent} ${d.size ?? ""} · ${d.barcode}`);
  revalidatePath("/products");
}

export async function updateProduct(id: number, input: unknown) {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const d = parsed.data;
  try {
    await q(
      `update products set barcode=$2, scent=$3, grade=$4, size=$5, sku=$6, price=$7 where id=$1`,
      [id, d.barcode, d.scent, d.grade || null, d.size || null, d.sku || null, d.price ?? null]);
  } catch (e) { friendly(e); }
  await q(`update sales set product_id = $1 where barcode = $2 and product_id is null`, [id, d.barcode]);
  await logAudit("update", "product", id, `${d.scent} ${d.size ?? ""} · ${d.barcode}`);
  revalidatePath("/products");
}
