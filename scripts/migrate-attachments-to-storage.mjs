// One-time migration: move existing base64 attachment images out of the DB and
// into Supabase Storage, RE-COMPRESSING each one on the way (sharp → JPEG, ≤1280px,
// target ~160KB). Shrinks the DB, cuts read-egress, and downsizes old photos in a
// single pass. Safe to re-run: it only touches rows still holding base64
// (data not null and storage_path null), so finished rows are skipped.
//
// Run it with the prod credentials in the environment (NOT committed):
//   DATABASE_URL=postgres://...             (prod Supabase connection string)
//   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=eyJ...        (Settings → API → service_role)
//   node scripts/migrate-attachments-to-storage.mjs
//
// It also creates the private `attachments` bucket if it doesn't exist yet.
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const BUCKET = "attachments";
const TABLES = [
  { table: "bill_attachments", kind: "bill" },
  { table: "cash_attachments", kind: "cash" },
  { table: "po_attachments", kind: "po" },
];
const TARGET_BYTES = 160 * 1024;

const { DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!DATABASE_URL || !NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing env: DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const client = new pg.Client({ connectionString: DATABASE_URL });

function decode(dataUri) {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(dataUri || "");
  if (!m) return Buffer.from(dataUri || "", "base64");
  return Buffer.from(m[2], "base64");
}

// resize ≤1280px, step quality down until ~160KB (fewer pixels only if still too big)
async function recompress(buf) {
  let edge = 1280;
  for (let pass = 0; pass < 3; pass++) {
    let q = 72;
    let out = await sharp(buf).rotate().resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: q, mozjpeg: true }).toBuffer();
    while (out.length > TARGET_BYTES && q > 40) {
      q -= 8;
      out = await sharp(buf).rotate().resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: q, mozjpeg: true }).toBuffer();
    }
    if (out.length <= TARGET_BYTES) return out;
    edge = Math.round(edge * 0.8);
  }
  // best effort: return the smallest we produced
  return sharp(buf).rotate().resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 45, mozjpeg: true }).toBuffer();
}

async function ensureBucket() {
  const { data } = await admin.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await admin.storage.createBucket(BUCKET, { public: false });
  if (error && !/already exists/i.test(error.message)) throw error;
  console.log(`bucket "${BUCKET}" ready`);
}

async function migrateTable(table, kind) {
  let moved = 0, savedBefore = 0, savedAfter = 0;
  for (;;) {
    const { rows } = await client.query(
      `select id, data from ${table} where data is not null and storage_path is null order by id limit 25`);
    if (!rows.length) break;
    for (const r of rows) {
      try {
        const orig = decode(r.data);
        const small = await recompress(orig);
        const path = `${kind}/${r.id}.jpg`;
        const up = await admin.storage.from(BUCKET).upload(path, small, { contentType: "image/jpeg", upsert: true });
        if (up.error) throw up.error;
        await client.query(`update ${table} set storage_path=$1, data=null where id=$2`, [path, r.id]);
        moved++; savedBefore += orig.length; savedAfter += small.length;
      } catch (e) {
        console.error(`  ! ${table}#${r.id} skipped:`, e?.message || e);
      }
    }
    process.stdout.write(`\r  ${table}: moved ${moved} ...`);
  }
  console.log(`\r  ${table}: moved ${moved} · ${(savedBefore / 1e6).toFixed(1)}MB → ${(savedAfter / 1e6).toFixed(1)}MB in Storage`);
}

(async () => {
  await client.connect();
  await ensureBucket();
  for (const { table, kind } of TABLES) {
    try { await migrateTable(table, kind); }
    catch (e) { console.error(`table ${table} failed:`, e?.message || e); }
  }
  await client.end();
  console.log("done.");
})().catch((e) => { console.error(e); process.exit(1); });
