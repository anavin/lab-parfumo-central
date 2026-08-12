"use server";
import { q } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { shipmentSchema, returnSchema } from "./schemas";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/require-user";

export type ShipLine = { barcode: string; name: string; grade: string; size: string; skus: string[] };
export type ShipInput = { po_number: string; ship_date: string; branch_label: string; lines: ShipLine[] };

export async function createShipment(input: ShipInput) {
  await requirePermission("shipments");
  const parsed = shipmentSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const data = parsed.data;
  const [po] = await q<{ id: number }>(
    `select id from purchase_orders where po_number=$1 order by id limit 1`, [data.po_number]);
  let n = 0;
  for (const line of data.lines) {
    for (const sku of line.skus) {
      const code = sku.trim();
      if (!code) continue;
      await q(
        `insert into shipment_items (ship_date, po_number, po_id, sku, name, serial, grade, size, branch_label, receive_status)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Shipped')`,
        [data.ship_date, data.po_number, po?.id ?? null, code, line.name, line.barcode, line.grade, line.size, data.branch_label]);
      n++;
    }
  }
  await logAudit("create", "shipment", data.po_number, `${data.po_number} · ${n} หน่วย`);
  revalidatePath("/shipments");
  revalidatePath("/stock");
  return { inserted: n };
}

export async function setReceiveStatus(id: number, status: string) {
  await requirePermission("shipments");
  await q(`update shipment_items set receive_status=$2 where id=$1`, [id, status]);
  revalidatePath("/shipments");
}

/** Record returns: move given SKUs (of a PO) into return_items. */
export async function createReturn(input: { po_number: string; return_date: string; branch_label: string; skus: string[] }) {
  await requirePermission("shipments");
  const parsed = returnSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const data = parsed.data;
  let n = 0;
  for (const raw of data.skus) {
    const sku = raw.trim();
    if (!sku) continue;
    const [src] = await q<any>(
      `select name, serial, grade, size, branch_label from shipment_items
       where sku=$1 and po_number=$2 order by id limit 1`, [sku, data.po_number]);
    await q(
      `insert into return_items (return_date, po_number, sku, name, serial, grade, size, branch_label, receive_status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,'Returned')`,
      [data.return_date, data.po_number, sku, src?.name ?? null, src?.serial ?? null,
       src?.grade ?? null, src?.size ?? null, src?.branch_label ?? data.branch_label]);
    if (src) await q(`update shipment_items set receive_status='Returned' where sku=$1 and po_number=$2`, [sku, data.po_number]);
    n++;
  }
  await logAudit("create", "return", data.po_number, `${data.po_number} · ${n} หน่วย`);
  revalidatePath("/shipments");
  revalidatePath("/stock");
  return { inserted: n };
}
