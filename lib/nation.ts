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
