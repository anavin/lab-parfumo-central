// สัญชาติลูกค้า — ค่าที่เก็บใน DB เป็น canonical ภาษาอังกฤษ (เข้ากับข้อมูลเดิม Thai/Foreign)
// "Foreign" = ค่าเดิมก่อนแยกเป็น จีน/ฝรั่ง — ยังนับเป็นต่างชาติเพื่อไม่ให้รายงานย้อนหลังเพี้ยน
// แก้ที่นี่ที่เดียวถ้าจะเพิ่ม/เปลี่ยนสัญชาติ

export type NationValue = "Thai" | "Chinese" | "Western";

// ตัวเลือกที่ให้พนักงานเลือก (ปุ่ม/ดรอปดาวน์)
export const NATION_OPTIONS: { value: NationValue; label: string }[] = [
  { value: "Thai", label: "ไทย" },
  { value: "Chinese", label: "จีน" },
  { value: "Western", label: "ฝรั่ง" },
];

// ปุ่มโต (มีอิโมจิ) สำหรับหน้า /my
export const NATION_BUTTONS: readonly (readonly [NationValue, string])[] = [
  ["Thai", "🇹🇭 ไทย"],
  ["Chinese", "🇨🇳 จีน"],
  ["Western", "🌍 ฝรั่ง"],
] as const;

// ป้ายแสดงผลจากค่าใน DB — รองรับค่าเดิม "Foreign", ค่าว่าง, และสัญชาติที่พิมพ์ระบุเอง (อื่นๆ)
export function natLabel(n?: string | null): string {
  const v = (n || "").trim();
  switch (v) {
    case "Thai": return "ไทย";
    case "Chinese": return "จีน";
    case "Western": return "ฝรั่ง";
    case "Foreign": return "ต่างชาติ"; // ข้อมูลเดิมก่อนแยกจีน/ฝรั่ง
    case "": return "-";
    default: return v; // สัญชาติที่พิมพ์ระบุเอง เช่น ญี่ปุ่น/เกาหลี → แสดงตามที่พิมพ์
  }
}

// นับเป็น "ต่างชาติ" ไหม — ทุกค่าที่ระบุแล้วและไม่ใช่คนไทย (จีน/ฝรั่ง/Foreign เดิม)
export function isForeignNation(n?: string | null): boolean {
  const v = (n || "").trim();
  return v !== "" && v !== "Thai";
}

// ── normalize สัญชาติที่พิมพ์เอง ("อื่นๆ") ────────────────────────────────
// รวมคำที่สะกดต่างกัน/คนละภาษา/พิมพ์ผิดนิดหน่อย ให้เป็นค่าเดียว เวลารายงานจะได้ไม่กระจาย
// สามหลัก (ไทย/จีน/ฝรั่ง) คง canonical อังกฤษไว้ (เข้ากับปุ่ม + ข้อมูลเดิม); ที่เหลือใช้คำไทย
const NATION_ALIASES: Record<string, string> = {
  // ไทย
  thai: "Thai", thailand: "Thai", th: "Thai", ไทย: "Thai", คนไทย: "Thai", ไธย: "Thai", ไท: "Thai",
  // จีน
  chinese: "Chinese", china: "Chinese", cn: "Chinese", prc: "Chinese", จีน: "Chinese", คนจีน: "Chinese", จีนน: "Chinese",
  // ฝรั่ง / ตะวันตก (รวมของเดิม Foreign/Western)
  western: "Western", farang: "Western", europe: "Western", european: "Western", usa: "Western", american: "Western",
  ฝรั่ง: "Western", ฝารั่ง: "Western", ยุโรป: "Western", อเมริกา: "Western", อเมริกัน: "Western",
  foreign: "Foreign", ต่างชาติ: "Foreign", ต่างประเทศ: "Foreign",
  // อื่นๆ ที่พบบ่อย → คำไทยมาตรฐาน
  japanese: "ญี่ปุ่น", japan: "ญี่ปุ่น", jp: "ญี่ปุ่น", ญี่ปุ่น: "ญี่ปุ่น", ญีปุ่น: "ญี่ปุ่น", ญี่ปุน: "ญี่ปุ่น", ยุ่น: "ญี่ปุ่น",
  korean: "เกาหลี", korea: "เกาหลี", kr: "เกาหลี", เกาหลี: "เกาหลี", เกาหลีใต้: "เกาหลี", กาหลี: "เกาหลี",
  indian: "อินเดีย", india: "อินเดีย", อินเดีย: "อินเดีย", แขก: "อินเดีย",
  russian: "รัสเซีย", russia: "รัสเซีย", รัสเซีย: "รัสเซีย", รัซเซีย: "รัสเซีย",
  arab: "อาหรับ", arabic: "อาหรับ", อาหรับ: "อาหรับ", อาราบ: "อาหรับ",
  vietnamese: "เวียดนาม", vietnam: "เวียดนาม", เวียดนาม: "เวียดนาม", เวียตนาม: "เวียดนาม",
  taiwanese: "ไต้หวัน", taiwan: "ไต้หวัน", ไต้หวัน: "ไต้หวัน", ไตหวัน: "ไต้หวัน",
  "hong kong": "ฮ่องกง", hongkong: "ฮ่องกง", ฮ่องกง: "ฮ่องกง", ฮองกง: "ฮ่องกง",
  singaporean: "สิงคโปร์", singapore: "สิงคโปร์", สิงคโปร์: "สิงคโปร์", สิงค์โปร์: "สิงคโปร์",
  malaysian: "มาเลเซีย", malaysia: "มาเลเซีย", มาเลเซีย: "มาเลเซีย", มาเลย์: "มาเลเซีย",
  lao: "ลาว", laos: "ลาว", ลาว: "ลาว",
  burmese: "พม่า", myanmar: "พม่า", พม่า: "พม่า", เมียนมา: "พม่า", เมียนมาร์: "พม่า",
  cambodian: "กัมพูชา", cambodia: "กัมพูชา", กัมพูชา: "กัมพูชา", เขมร: "กัมพูชา",
};

/** รวมสัญชาติที่พิมพ์เองให้เป็นค่าเดียว — ใช้ทั้งตอนบันทึก (ช่อง "อื่นๆ") และตอนทำรายงาน.
 *  คืนค่า canonical (อังกฤษสำหรับ 3 หลัก, คำไทยสำหรับที่เหลือ) หรือค่าที่พิมพ์ (จัดช่องว่างแล้ว) ถ้าไม่รู้จัก. */
export function normalizeNation(raw?: string | null): string {
  const t = (raw || "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  const key = t.toLowerCase();
  return NATION_ALIASES[key] ?? t;
}

// คำแนะนำสำหรับช่อง "อื่นๆ" (ปุ่ม ไทย/จีน/ฝรั่ง มีอยู่แล้ว) — โชว์ใน datalist ตอนพิมพ์
export const NATION_SUGGESTIONS: string[] = [
  "ญี่ปุ่น", "เกาหลี", "อินเดีย", "รัสเซีย", "อาหรับ", "เวียดนาม", "ไต้หวัน",
  "ฮ่องกง", "สิงคโปร์", "มาเลเซีย", "ลาว", "พม่า", "กัมพูชา",
];
