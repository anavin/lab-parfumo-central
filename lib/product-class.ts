// กฎจำแนกสินค้าที่ "ไม่ใช่น้ำหอมมี SKU ปกติ" — รวมศูนย์ไว้ที่เดียว
// (เดิม regex พวกนี้เขียนซ้ำกระจายหลายไฟล์ แก้กฎทีต้องไล่ทุกที่ → ย้ายมารวมกันกันตกหล่น)

/** 4ml = ของแจก/ทดลอง ไม่มี SKU — เทียบกับ "ขนาด" (size) */
export const isGiveawaySize = (size?: string | null) => /^\s*4\s*ml/i.test(String(size || ""));

/** เทสเตอร์ (TRY ME) = ของโชว์ ไม่ใช่สต๊อกขาย — เทียบกับ "ชื่อ/กลิ่น" */
export const isTester = (name?: string | null) => /try\s*me/i.test(String(name || ""));

/** ถุงกระดาษ = บรรจุภัณฑ์ ไม่ใช่น้ำหอม — เทียบกับ "ชื่อ/กลิ่น" */
export const isPackaging = (name?: string | null) => /ถุง/.test(String(name || ""));

/** ไม่ใช่สต๊อกสินค้าปกติ (เทสเตอร์ + ถุง) → ซ่อนจากคงเหลือ/คิดยอด/เทียบ SKU */
export const isNonStock = (name?: string | null) => isTester(name) || isPackaging(name);
