# ย้ายข้อมูลขึ้น Supabase

แอปนี้รันด้วย **PGlite** (Postgres ในเครื่อง) ตอน dev — เมื่อพร้อมขึ้นจริงให้ชี้ไป
**Supabase Postgres** โดย SQL เหมือนกันทุกอย่าง ไม่ต้องแก้โค้ด

> ตัว `q()` ใน `lib/db.ts` จะสลับไปใช้ Supabase อัตโนมัติเมื่อมี env `DATABASE_URL`
> (ตอนนั้นจะไม่รัน migrate/seed/สร้าง admin ให้อัตโนมัติ — ต้องทำ 3 ขั้นด้านล่างครั้งเดียว)

## ขั้นตอน (ทำครั้งเดียว)

### 1) สร้าง Supabase project
- ไป https://supabase.com → New project → ตั้งรหัส database (จำไว้)
- เมนู **SQL Editor**

### 2) สร้างตาราง (schema)
- เปิด **SQL Editor → New query** → วางเนื้อหาไฟล์ **`supabase/schema.sql`** ทั้งหมด → **Run**
- ได้ทุกตาราง: สินค้า/สาขา/ใบเบิก/ขาย/สต๊อก/เงินสด + auth (users/sessions) + audit_log

### 3) ใส่ข้อมูลธุรกิจ (seed)
- New query → วางเนื้อหา **`supabase/seed.sql`** → **Run**
- (ไฟล์ใหญ่ ~1MB ถ้า editor ช้า ใช้ `psql` แทนได้: `psql "<connection string>" -f supabase/seed.sql`)

### 4) สร้างผู้ดูแลคนแรก (admin)
สร้าง SQL จากสคริปต์ (ได้ INSERT ที่มี bcrypt hash):
```bash
ADMIN_PASSWORD='ตั้งรหัสแข็งแรงของคุณ1' node scripts/gen-admin-sql.mts admin
```
เอาผลลัพธ์ (บรรทัด `insert into users ...`) ไปวางใน SQL Editor → **Run**

## ตั้งค่า env ตอน deploy (เช่น Vercel)
ใส่ตัวแปรเหล่านี้ในโปรเจกต์ที่ deploy (Vercel → Settings → Environment Variables):

```
DATABASE_URL = postgresql://postgres:[รหัส]@db.[project-ref].supabase.co:5432/postgres
```
หา connection string ได้ที่ Supabase → **Project Settings → Database → Connection string → URI**
(ใช้แบบ **Session/Direct** สำหรับ `pg`; ถ้าใช้ pooler ให้ใช้พอร์ต 6543 แบบ transaction)

> ไม่ต้องตั้ง `ADMIN_PASSWORD` บน production — admin สร้างไปแล้วในขั้นที่ 4
> (env นั้นใช้เฉพาะตอน bootstrap อัตโนมัติบน PGlite local)

## เมื่อ Excel อัปเดต (อยากรีเฟรชข้อมูล)
```bash
python3 etl/extract.py          # Excel → seed/*.json
node scripts/gen-seed-sql.mts   # seed/*.json → supabase/seed.sql
```
แล้วรัน `supabase/seed.sql` ใหม่ (อาจ `truncate` ตารางเดิมก่อน)

## สรุปไฟล์
| ไฟล์ | ใช้ทำอะไร |
|---|---|
| `supabase/schema.sql` | สร้างตารางทั้งหมด (ขั้น 2) |
| `supabase/seed.sql` | ข้อมูลธุรกิจ (ขั้น 3) |
| `scripts/gen-admin-sql.mts` | สร้าง SQL เพิ่ม admin (ขั้น 4) |
| `scripts/gen-seed-sql.mts` | รีเจน seed.sql จาก seed/*.json |
