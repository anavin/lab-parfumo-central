/**
 * Supabase server-side client (Service Role) — ใช้ใน Server Components,
 * Server Actions, และ Route Handlers. ห้าม import ฝั่ง browser.
 *
 * หมายเหตุ: ระบบนี้ query ผ่าน raw SQL (lib/db.ts) เป็นหลัก — client นี้ไว้ใช้
 * งาน auth/storage/realtime ในอนาคตให้ตรงกับ lab-parfumo-next
 */
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
