/**
 * Logical backup of the production database (Supabase) → timestamped JSON files.
 *
 *   DATABASE_URL="postgres://…supabase…" npm run backup
 *
 * Read-only: dumps every public table to backups/<YYYY-MM-DD_HHmm>/<table>.json plus a
 * manifest with row counts. Portable (uses the `pg` driver — no pg_dump needed) so it can run
 * from a laptop or a cron job. This is a SUPPLEMENT to Supabase's own automated backups /
 * point-in-time recovery (enable those in the Supabase dashboard — they are the primary safety net).
 */
import { Pool } from "pg";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✗ DATABASE_URL is not set. Copy the Supabase connection string (Project → Settings → Database) and run:\n  DATABASE_URL=\"postgres://…\" npm run backup");
  process.exit(1);
}

const stamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "");
const outDir = path.join("backups", stamp);

const pool = new Pool({ connectionString: url, max: 2, ssl: { rejectUnauthorized: false } });

try {
  await mkdir(outDir, { recursive: true });
  const { rows: tables } = await pool.query<{ tablename: string }>(
    `select tablename from pg_tables where schemaname = 'public' order by tablename`);
  if (!tables.length) { console.error("✗ no public tables found — check the connection string"); process.exit(1); }

  const manifest: { table: string; rows: number }[] = [];
  for (const { tablename } of tables) {
    const { rows } = await pool.query(`select * from "${tablename}"`);
    await writeFile(path.join(outDir, `${tablename}.json`), JSON.stringify(rows, null, 2));
    manifest.push({ table: tablename, rows: rows.length });
    console.log(`  ✓ ${tablename.padEnd(24)} ${rows.length} rows`);
  }
  await writeFile(path.join(outDir, "_manifest.json"),
    JSON.stringify({ at: new Date().toISOString(), tables: manifest }, null, 2));
  const total = manifest.reduce((s, t) => s + t.rows, 0);
  console.log(`\n✓ Backup complete → ${outDir}  (${tables.length} tables, ${total} rows)`);
} catch (e) {
  console.error("✗ backup failed:", (e as Error).message);
  process.exit(1);
} finally {
  await pool.end();
}
