// Generate an admin INSERT (with a bcrypt hash) to paste into Supabase SQL editor.
// The ensureAdmin() auto-bootstrap only runs on the local PGlite path — on
// Supabase (DATABASE_URL) you create the first admin once with this.
//
// Usage:
//   ADMIN_PASSWORD='YourStrongPass1' node scripts/gen-admin-sql.mts [username]
import bcrypt from "bcryptjs";

const username = (process.argv[2] || "admin").toLowerCase();
const pw = process.env.ADMIN_PASSWORD;
if (!pw || pw.length < 8) {
  console.error("Set ADMIN_PASSWORD (min 8 chars, must include a letter and a number). Example:");
  console.error("  ADMIN_PASSWORD='YourStrongPass1' node scripts/gen-admin-sql.mts admin");
  process.exit(1);
}
const hash = await bcrypt.hash(pw, 12);
const esc = (s: string) => s.replace(/'/g, "''");
console.log(
  `insert into users (username, password_hash, full_name, role)\n` +
  `values ('${esc(username)}', '${hash}', 'ผู้ดูแลระบบ', 'admin')\n` +
  `on conflict (username) do update set password_hash = excluded.password_hash;`,
);
