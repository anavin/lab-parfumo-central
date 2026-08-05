// Standalone seed / verify runner. Usage: npm run seed  (or npm run reset)
import { getDb } from "../lib/db.ts";

const db = await getDb();
const tables = [
  "branches", "products", "purchase_orders", "po_items", "shipment_items",
  "return_items", "sales", "daily_customers", "product_costs", "cash_entries",
  "stock_snapshot",
];
console.log("\nRow counts:");
for (const t of tables) {
  const r = await db.query<{ n: number }>(`select count(*)::int as n from ${t}`);
  console.log(`  ${t.padEnd(18)} ${r.rows[0].n}`);
}
const rev = await db.query<{ v: number }>("select coalesce(sum(total),0)::float as v from sales");
console.log(`\n  total revenue  ${rev.rows[0].v.toLocaleString()}`);
process.exit(0);
