// Generate supabase/seed.sql from seed/*.json — a portable INSERT script
// to paste into the Supabase SQL editor (after running supabase/schema.sql).
// Kept OUT of migrations/ so the local PGlite loader never re-runs it.
// Usage: node scripts/gen-seed-sql.mts
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SEED = path.join(ROOT, "seed");
const OUT = path.join(ROOT, "supabase", "seed.sql");

const load = async (n: string) => JSON.parse(await readFile(path.join(SEED, `${n}.json`), "utf8"));
const lit = (v: any) =>
  v === null || v === undefined || v === "" ? "null"
  : typeof v === "number" ? String(v)
  : `'${String(v).replace(/'/g, "''")}'`;

async function table(name: string, cols: string[], rows: any[], map: (r: any) => any[]) {
  if (!rows.length) return "";
  const lines: string[] = [`-- ${name} (${rows.length})`];
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const vals = rows.slice(i, i + CHUNK)
      .map((r) => `(${map(r).map(lit).join(",")})`).join(",\n");
    lines.push(`insert into ${name} (${cols.join(",")}) values\n${vals};`);
  }
  return lines.join("\n") + "\n\n";
}

const branches = await load("branches");
const products = await load("products");
const pos = await load("purchase_orders");
const poItems = await load("po_items");
const ship = await load("shipment_items");
const ret = await load("return_items");
const sales = await load("sales");
const cust = await load("daily_customers");
const costs = await load("product_costs");
const cash = await load("cash_entries");
const stock = await load("stock_snapshot");

let sql = "-- Seed data generated from seed/*.json. Run AFTER 0001_init.sql.\nbegin;\n\n";
sql += await table("branches", ["branch_code","store_code","store_no","tel","receiver","email_store","email_admin","address"],
  branches, (b) => [b.branch_code,b.store_code,b.store_no,b.tel,b.receiver,b.email_store,b.email_admin,b.address]);
sql += await table("products", ["barcode","scent","grade","size","sku","brand","price","description"],
  products, (p) => [p.barcode,p.scent,p.grade,p.size,p.sku,p.brand,p.price,p.description]);
sql += await table("purchase_orders", ["po_number","version","order_date","branch_label","store_no","delivery_number","phone","shipping_name","address","remark"],
  pos, (p) => [p.po_number,p.version,p.order_date,p.branch_label,p.store_no,p.delivery_number,p.phone,p.shipping_name,p.address,p.remark]);
// po_items: resolve po_id per row via SELECT on (po_number, version)
sql += `-- po_items (${poItems.length}) — po_id resolved from purchase_orders\n`;
sql += poItems.map((it: any) =>
  `insert into po_items (po_id,line_no,barcode,scent,size,qty) ` +
  `select id,${lit(it.line_no)},${lit(it.barcode)},${lit(it.scent)},${lit(it.size)},${lit(it.qty)} ` +
  `from purchase_orders where po_number=${lit(it.po_number)} and coalesce(version,'')=${lit(it.version ?? "")};`
).join("\n") + "\n\n";
sql += await table("shipment_items", ["line_no","ship_date","po_number","sku","name","serial","grade","size","branch_label","receive_status"],
  ship, (s) => [s.line_no,s.ship_date,s.po_number,s.sku,s.name,s.serial,s.grade,s.size,s.branch_label,s.receive_status]);
sql += await table("return_items", ["line_no","return_date","po_number","sku","name","serial","grade","size","branch_label","receive_status"],
  ret, (s) => [s.line_no,s.return_date,s.po_number,s.sku,s.name,s.serial,s.grade,s.size,s.branch_label,s.receive_status]);
sql += await table("sales", ["source","month","sale_date","sale_time","ba","order_no","receipt_no","item","barcode","grade","size","qty","unit_price","discount","total","paid","payment_channel","note","nation"],
  sales, (s) => [s.source,s.month,s.sale_date,s.sale_time,s.ba,s.order_no,s.receipt_no,s.item,s.barcode,s.grade,s.size,s.qty,s.unit_price,s.discount,s.total,s.paid,s.payment_channel,s.note,s.nation]);
sql += await table("daily_customers", ["month","cust_date","ba","customers","sell_amount","thai","thai_sales","foreign_cnt","foreign_sales"],
  cust, (c) => [c.month,c.cust_date,c.ba,c.customers,c.sell_amount,c.thai,c.thai_sales,c.foreign,c.foreign_sales]);
sql += await table("product_costs", ["cost_date","scent","size","barcode","unit_cost","qty","total_cost"],
  costs, (c) => [c.cost_date,c.scent,c.size,c.barcode,c.unit_cost,c.qty,c.total_cost]);
sql += await table("cash_entries", ["cash_date","description","amount","type"],
  cash, (c) => [c.cash_date,c.description,c.amount,c.type]);
sql += await table("stock_snapshot", ["scent","size","barcode","shipped","sold","remaining"],
  stock, (s) => [s.scent,s.size,s.barcode,s.shipped,s.sold,s.remaining]);

// relink foreign keys
sql += `-- relink product / shipment foreign keys
update po_items i set product_id = p.id from products p where p.barcode = i.barcode;
update sales s set product_id = p.id from products p where p.barcode = s.barcode;
update shipment_items sh set po_id = po.id from purchase_orders po where po.po_number = sh.po_number;

commit;
`;

await writeFile(OUT, sql);
console.log(`Wrote ${OUT} (${(sql.length/1024).toFixed(0)} KB)`);
