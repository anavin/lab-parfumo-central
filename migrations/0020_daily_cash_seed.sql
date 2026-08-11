-- Multi-branch cash: "เงินสดที่เอาไปสาขา" (float brought to the branch that day),
-- separate from ยกมา (carried from the previous day). A new branch starts with
-- ยกมา = 0 and records the brought cash here instead.
--   คงเหลือ = ยกมา + เอาไป + เงินสดขาย − เข้าธนาคาร
alter table daily_cash add column if not exists seed numeric(12,2) not null default 0;
