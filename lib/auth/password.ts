import bcrypt from "bcryptjs";

// Cost factor 14 ≈ 1s/hash (matches lab-parfumo-next).
const BCRYPT_ROUNDS = 14;

export async function hashBcrypt(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyBcrypt(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export function validatePassword(pwd: string, username = ""): { ok: boolean; message: string } {
  const MIN = 8;
  if (!pwd || pwd.length < MIN) return { ok: false, message: `รหัสผ่านต้องยาวอย่างน้อย ${MIN} ตัวอักษร` };
  if (username && pwd.toLowerCase() === username.toLowerCase()) return { ok: false, message: "รหัสผ่านห้ามเหมือน username" };
  if (!/[A-Za-z]/.test(pwd)) return { ok: false, message: "ต้องมีตัวอักษรอย่างน้อย 1 ตัว" };
  if (!/[0-9]/.test(pwd)) return { ok: false, message: "ต้องมีตัวเลขอย่างน้อย 1 ตัว" };
  const weak = ["password", "12345678", "qwerty", "admin123", "staff123", "password1", "password123", "letmein"];
  if (weak.includes(pwd.toLowerCase())) return { ok: false, message: "รหัสผ่านนี้อ่อนแอเกินไป" };
  return { ok: true, message: "OK" };
}
