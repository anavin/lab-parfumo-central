import type { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
// PGlite is imported dynamically inside init() so the Supabase (pg) path on
// Vercel never bundles/loads its WASM — smaller function, faster cold start.

// Local dev uses an embedded Postgres (PGlite) persisted to ./.pgdata.
// To move to Supabase later: run migrations/0001_init.sql there, seed once,
// and swap this module's query() for a supabase-js / pg client. The SQL is
// identical Postgres — nothing else in the app needs to change.

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, ".pgdata");
const MIG_DIR = path.join(ROOT, "migrations");
const SEED_DIR = path.join(ROOT, "seed");

type G = { _pg?: Promise<PGlite> };
const g = globalThis as unknown as G;

async function migrate(db: PGlite) {
  const files = (await readdir(MIG_DIR)).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const sql = await readFile(path.join(MIG_DIR, f), "utf8");
    await db.exec(sql);
  }
}

async function isEmpty(db: PGlite) {
  const r = await db.query<{ n: number }>("select count(*)::int as n from products");
  return r.rows[0].n === 0;
}

async function loadSeed(name: string): Promise<any[]> {
  try {
    const raw = await readFile(path.join(SEED_DIR, `${name}.json`), "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** Bulk insert helper: builds one multi-row INSERT with $-params. */
async function insertRows(db: PGlite, table: string, cols: string[], rows: any[][]) {
  if (rows.length === 0) return;
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const values: any[] = [];
    const tuples = slice.map((row) => {
      const ph = row.map((_, j) => `$${values.length + j + 1}`);
      values.push(...row);
      return `(${ph.join(",")})`;
    });
    await db.query(
      `insert into ${table} (${cols.join(",")}) values ${tuples.join(",")}`,
      values,
    );
  }
}

export async function seed(db: PGlite) {
  const branches = await loadSeed("branches");
  await insertRows(
    db, "branches",
    ["branch_code", "store_code", "store_no", "tel", "receiver", "email_store", "email_admin", "address"],
    branches.map((b) => [b.branch_code, b.store_code, b.store_no, b.tel, b.receiver, b.email_store, b.email_admin, b.address]),
  );

  const products = await loadSeed("products");
  await insertRows(
    db, "products",
    ["barcode", "scent", "grade", "size", "sku", "brand", "price", "description"],
    products.map((p) => [p.barcode, p.scent, p.grade, p.size, p.sku, p.brand, p.price, p.description]),
  );

  const pos = await loadSeed("purchase_orders");
  await insertRows(
    db, "purchase_orders",
    ["po_number", "version", "order_date", "branch_label", "store_no", "delivery_number", "phone", "shipping_name", "address", "remark"],
    pos.map((p) => [p.po_number, p.version, p.order_date, p.branch_label, p.store_no, p.delivery_number, p.phone, p.shipping_name, p.address, p.remark]),
  );

  // Map (po_number,version) -> po_id for line items.
  const idRes = await db.query<{ id: number; po_number: string; version: string }>(
    "select id, po_number, coalesce(version,'') as version from purchase_orders",
  );
  const poId = new Map(idRes.rows.map((r) => [`${r.po_number}||${r.version}`, r.id]));

  const items = await loadSeed("po_items");
  await insertRows(
    db, "po_items",
    ["po_id", "line_no", "barcode", "scent", "size", "qty"],
    items.map((it) => [poId.get(`${it.po_number}||${it.version ?? ""}`) ?? null, it.line_no, it.barcode, it.scent, it.size, it.qty]),
  );

  const ship = await loadSeed("shipment_items");
  await insertRows(
    db, "shipment_items",
    ["line_no", "ship_date", "po_number", "sku", "name", "serial", "grade", "size", "branch_label", "receive_status"],
    ship.map((s) => [s.line_no, s.ship_date, s.po_number, s.sku, s.name, s.serial, s.grade, s.size, s.branch_label, s.receive_status]),
  );

  const ret = await loadSeed("return_items");
  await insertRows(
    db, "return_items",
    ["line_no", "return_date", "po_number", "sku", "name", "serial", "grade", "size", "branch_label", "receive_status"],
    ret.map((s) => [s.line_no, s.return_date, s.po_number, s.sku, s.name, s.serial, s.grade, s.size, s.branch_label, s.receive_status]),
  );

  const sales = await loadSeed("sales");
  await insertRows(
    db, "sales",
    ["source", "month", "sale_date", "sale_time", "ba", "order_no", "receipt_no", "item", "barcode", "grade", "size", "qty", "unit_price", "discount", "total", "paid", "payment_channel", "note", "nation"],
    sales.map((s) => [s.source, s.month, s.sale_date, s.sale_time, s.ba, s.order_no, s.receipt_no, s.item, s.barcode, s.grade, s.size, s.qty, s.unit_price, s.discount, s.total, s.paid, s.payment_channel, s.note, s.nation]),
  );

  const cust = await loadSeed("daily_customers");
  await insertRows(
    db, "daily_customers",
    ["month", "cust_date", "ba", "customers", "sell_amount", "thai", "thai_sales", "foreign_cnt", "foreign_sales"],
    cust.map((c) => [c.month, c.cust_date, c.ba, c.customers, c.sell_amount, c.thai, c.thai_sales, c.foreign, c.foreign_sales]),
  );

  const costs = await loadSeed("product_costs");
  await insertRows(
    db, "product_costs",
    ["cost_date", "scent", "size", "barcode", "unit_cost", "qty", "total_cost"],
    costs.map((c) => [c.cost_date, c.scent, c.size, c.barcode, c.unit_cost, c.qty, c.total_cost]),
  );

  const cash = await loadSeed("cash_entries");
  await insertRows(
    db, "cash_entries",
    ["cash_date", "description", "amount", "type"],
    cash.map((c) => [c.cash_date, c.description, c.amount, c.type]),
  );

  const stock = await loadSeed("stock_snapshot");
  await insertRows(
    db, "stock_snapshot",
    ["scent", "size", "barcode", "shipped", "sold", "remaining"],
    stock.map((s) => [s.scent, s.size, s.barcode, s.shipped, s.sold, s.remaining]),
  );

  // Link foreign keys by barcode / po where possible (best-effort).
  await db.exec(`
    update po_items i set product_id = p.id from products p where p.barcode = i.barcode and i.product_id is null;
    update sales s set product_id = p.id from products p where p.barcode = s.barcode and s.product_id is null;
    update shipment_items sh set po_id = po.id from purchase_orders po where po.po_number = sh.po_number and sh.po_id is null;
  `);
}

// Bootstrap the first admin from env (ADMIN_USERNAME / ADMIN_PASSWORD) so no
// password or hash is committed to the repo. If ADMIN_PASSWORD is unset, a random
// one is generated and printed once to the server console.
async function ensureAdmin(db: PGlite) {
  const [{ n }] = (await db.query<{ n: number }>("select count(*)::int n from users")).rows;
  if (n > 0) return;
  const { randomBytes } = await import("node:crypto");
  const { hashBcrypt } = await import("./auth/password");
  const username = (process.env.ADMIN_USERNAME || "admin").trim();
  let pw = process.env.ADMIN_PASSWORD;
  if (!pw) {
    pw = randomBytes(9).toString("base64url").replace(/[^a-zA-Z0-9]/g, "") + "9a";
    console.log(`\n[auth] ADMIN_PASSWORD not set — created admin "${username}" with a random password:\n        ${pw}\n        (set ADMIN_PASSWORD in .env.local to control it)\n`);
  }
  await db.query(
    `insert into users (username, password_hash, full_name, role) values ($1,$2,$3,'admin')`,
    [username, await hashBcrypt(pw), "ผู้ดูแลระบบ"]);
}

async function init(): Promise<PGlite> {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(DATA_DIR);
  await db.waitReady;
  await migrate(db);
  if (await isEmpty(db)) {
    console.log("[db] empty — seeding from ./seed …");
    await seed(db);
    console.log("[db] seed complete");
  }
  await ensureAdmin(db);
  return db;
}

export function getDb(): Promise<PGlite> {
  if (!g._pg) g._pg = init();
  return g._pg;
}

// ---------------------------------------------------------------------------
// Query interface. Local dev → PGlite. Production → Supabase Postgres via `pg`
// (set DATABASE_URL to the Supabase connection string). Identical SQL both ways
// — mirrors lab-parfumo-next while keeping the rich aggregation queries intact.
// ---------------------------------------------------------------------------
type GP = G & { _pgPool?: any };
const gp = globalThis as unknown as GP;

function usePg() {
  return !!process.env.DATABASE_URL;
}

async function getPgPool() {
  if (!gp._pgPool) {
    const { Pool, types } = await import("pg");
    // node-postgres returns bigint (int8) as a string by default, while PGlite
    // returns a number — that mismatch broke id comparisons (e.g. ownPending's
    // created_by check) on prod only. Parse int8 as a number so both match.
    types.setTypeParser(20, (v: string | null) => (v == null ? null : parseInt(v, 10)));
    // Serverless-friendly: keep few connections per instance (Supabase NANO has
    // a small direct-connection limit), release idle ones, and fail fast on a
    // stuck connect instead of hanging a Server Component render.
    gp._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      allowExitOnIdle: true,
    });
    gp._pgPool.on("error", (e: any) => console.error("[pg pool] idle client error:", e?.message));
  }
  return gp._pgPool;
}

// Transient connection errors are common on serverless + Supabase NANO (dropped
// idle sockets, cold starts, brief connection-limit spikes). Retry these a few
// times so a blip doesn't surface as a hard "Server Components render" error.
function isTransientDbError(e: any): boolean {
  const code = e?.code;
  if (["57P01", "57P03", "53300", "08006", "08003", "08001", "ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "EPIPE"].includes(code)) return true;
  return /terminat|connection|timeout|reset by peer|server closed|too many clients|ECONNRESET|socket hang up/i.test(String(e?.message || ""));
}

/** Convenience: run a query and return rows (with transient-error retry on pg). */
export async function q<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (usePg()) {
    const MAX = 4;
    let lastErr: any;
    for (let attempt = 0; attempt < MAX; attempt++) {
      try {
        const pool = await getPgPool();
        const r = await pool.query(sql, params);
        return r.rows as T[];
      } catch (e) {
        lastErr = e;
        if (attempt === MAX - 1 || !isTransientDbError(e)) throw e;
        console.warn(`[db] transient error, retrying (${attempt + 1}/${MAX - 1}):`, (e as any)?.message);
        await new Promise((res) => setTimeout(res, 250 * (attempt + 1)));  // 250 / 500 / 750ms
      }
    }
    throw lastErr;
  }
  const db = await getDb();
  const r = await db.query<T>(sql, params);
  return r.rows;
}
