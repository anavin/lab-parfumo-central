# Lab Parfumo — Central · ระบบใบเบิก & Dashboard

ระบบเก็บบันทึกใบเบิกสินค้าและแดชบอร์ดสรุปยอดขาย สำหรับธุรกิจน้ำหอม Lab Parfumo (เครือ Central)
สร้างจากข้อมูลจริงในไฟล์ `ใบเบิกสินค้าเครือ Central.xlsx`

## สแตก (ตรงกับ lab-parfumo-next)
- **Next.js 15** (App Router) + **TypeScript** + **Tailwind**
- **zod** — validate ทุก server action · **radix-ui** + **lucide-react** — UI
- **@react-pdf/renderer** — ใบเบิก/ใบส่งของ PDF (ฟอนต์ Noto Sans Thai) · **Recharts** — กราฟ
- **@supabase/supabase-js** + **@supabase/ssr** — client พร้อมใช้ (auth/storage อนาคต)
- **ฐานข้อมูล**: local ใช้ **PGlite** (Postgres ฝังในตัว, `./.pgdata/`) — ตั้ง `DATABASE_URL`
  เมื่อไหร่ ระบบสลับไปใช้ **Supabase Postgres** (`pg`) อัตโนมัติ SQL เดียวกันไม่ต้องแก้

## เริ่มใช้งาน
```bash
cd lab-parfumo-central
npm install
python3 etl/extract.py     # ดึงข้อมูลจาก Excel -> seed/*.json (ทำครั้งเดียว/เมื่อ Excel อัปเดต)
npm run dev                # เปิด http://localhost:3010  (ครั้งแรกจะ seed อัตโนมัติ)
```
คำสั่งอื่น:
- `npm run seed` — ตรวจ/สร้างฐานข้อมูล + แสดงจำนวนแถว
- `npm run reset` — ล้าง `.pgdata` แล้ว seed ใหม่

## โครงสร้าง
```
etl/extract.py       ETL: อ่าน Excel -> JSON (จัดการ marker rows, #REF!, ปี พ.ศ.)
seed/*.json          ข้อมูลที่ normalize แล้ว (products, sales, po, ...)
migrations/0001_init.sql   schema Postgres (ใช้ได้ทั้ง PGlite และ Supabase)
lib/db.ts            PGlite singleton + auto-migrate + auto-seed
lib/queries.ts       query รวมสำหรับแดชบอร์ด
app/                 หน้าเว็บ (dashboard, requisitions, sales, stock, products, cash)
```

## หน้าจอ
| หน้า | รายละเอียด |
|---|---|
| `/` แดชบอร์ด | KPI, รายได้/ลูกค้ารายเดือน, Top กลิ่น, สัดส่วนขนาด, ช่องทางชำระ, สัญชาติ, BA |
| `/requisitions` | รายการใบเบิก (PO) + เปิดดูราย PO |
| `/requisitions/[id]` | ฟอร์ม **ใบเบิกสินค้า + ใบส่งของ** พร้อมปุ่มพิมพ์/บันทึก PDF (A4) |
| `/sales` | สรุปยอดขายรายเดือน + รายการขายล่าสุด |
| `/stock` | สต๊อกคงเหลือ (ส่งไป − ขาย) + แจ้งใกล้หมด/หมด |
| `/products` | มาสเตอร์สินค้า + ยอดขายสะสม |
| `/cash` | บันทึกเงินสดหน้าร้าน/เงินสดย่อย |

## เข้าสู่ระบบ
มี password gate (middleware). ค่าเริ่มต้น `labparfumo` — ตั้งค่าที่ `APP_PASSWORD` ใน `.env.local`

## ย้ายขึ้น Supabase (เมื่อพร้อม)
1. สร้าง project → รัน `supabase/schema.sql` ใน SQL editor
2. รัน `node scripts/gen-seed-sql.mts` เพื่อสร้าง `supabase/seed.sql` แล้ว paste ลง SQL editor (หรือใช้ psql)
3. ใส่คีย์ใน `.env.local` แล้วสลับ `q()` ใน `lib/db.ts` ไปใช้ `@supabase/supabase-js`/`pg` — โค้ดหน้าเว็บไม่ต้องแก้ (SQL เดียวกัน)

## สถานะ (v0.2 — ครบวงจร)
- ✅ ETL + schema + import ครบทุกชีต
- ✅ แดชบอร์ดครบ + ใบเบิก/ใบส่งของ พิมพ์ PDF ได้
- ✅ **สร้าง/แก้/ลบใบเบิก** (ออกเลข PO อัตโนมัติ, autocomplete สินค้า, สถานะ)
- ✅ **บันทึกส่ง/คืนสินค้า** ระดับหน่วย (SKU) → สต๊อกคำนวณสด
- ✅ **บันทึกขาย / ลูกค้ารายวัน / เงินสด** → แดชบอร์ดอัปเดตทันที
- ✅ Login (password gate) + พร้อมย้าย Supabase
- 🔜 (ถ้าต้องการ) ปรับให้เหมือน lab-parfumo-next 100%: `@supabase/ssr`, `@react-pdf/renderer`, zod, radix-ui
