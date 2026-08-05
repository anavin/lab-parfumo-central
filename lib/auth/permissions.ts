// Central permission model (pure — safe to import from client & server).
// Access is menu/page based: one permission key per protected area. A user's
// EFFECTIVE permissions come from their role preset, unless an admin has set a
// custom `permissions` override on the account.
import type { User } from "./constants";

export type PermKey =
  | "dashboard" | "requisitions" | "shipments" | "sales" | "stock"
  | "products" | "cash" | "review" | "users" | "audit" | "trash" | "my_sales";

export type PermMeta = { key: PermKey; label: string; href: string; group: string };

// Order here drives the sidebar + the "landing page" pick after login.
export const PERMISSIONS: PermMeta[] = [
  { key: "dashboard",    label: "แดชบอร์ด",        href: "/",             group: "ภาพรวม" },
  { key: "requisitions", label: "ใบเบิกสินค้า",     href: "/requisitions", group: "ปฏิบัติการ" },
  { key: "shipments",    label: "ส่ง / คืนสินค้า",  href: "/shipments",    group: "ปฏิบัติการ" },
  { key: "sales",        label: "การขาย",           href: "/sales",        group: "ปฏิบัติการ" },
  { key: "stock",        label: "สต๊อกคงเหลือ",     href: "/stock",        group: "คลัง & การเงิน" },
  { key: "products",     label: "สินค้า",           href: "/products",     group: "คลัง & การเงิน" },
  { key: "cash",         label: "เงินสด",           href: "/cash",         group: "คลัง & การเงิน" },
  { key: "review",       label: "ตรวจสอบยอดขาย",    href: "/review",       group: "ผู้ดูแล" },
  { key: "users",        label: "จัดการผู้ใช้",      href: "/users",        group: "ผู้ดูแล" },
  { key: "audit",        label: "บันทึกกิจกรรม",    href: "/audit",        group: "ผู้ดูแล" },
  { key: "trash",        label: "ถังขยะ",           href: "/trash",        group: "ผู้ดูแล" },
  { key: "my_sales",     label: "ยอดขายของฉัน",     href: "/my",           group: "พนักงานขาย" },
];

export const ALL_PERM_KEYS: PermKey[] = PERMISSIONS.map((p) => p.key);

export type RoleKey = "admin" | "manager" | "operations" | "viewer" | "staff";

export const ROLES: { key: RoleKey; label: string; desc: string }[] = [
  { key: "admin",      label: "ผู้ดูแลระบบ",          desc: "เข้าถึงได้ทุกเมนู รวมการจัดการผู้ใช้" },
  { key: "manager",    label: "ผู้จัดการ",            desc: "ดูภาพรวม จัดการปฏิบัติการ และตรวจสอบยอดขาย" },
  { key: "operations", label: "เจ้าหน้าที่ปฏิบัติการ", desc: "จัดการใบเบิก ส่ง/คืน การขาย สต๊อก สินค้า เงินสด" },
  { key: "viewer",     label: "ผู้ดูแล (ดูอย่างเดียว)", desc: "ดูแดชบอร์ด รายการขาย และสต๊อก (อ่านอย่างเดียว)" },
  { key: "staff",      label: "พนักงานขาย",           desc: "กรอกยอดขายของตัวเองเท่านั้น" },
];

export const ROLE_LABEL: Record<string, string> =
  Object.fromEntries(ROLES.map((r) => [r.key, r.label]));

// "*" = every permission (admin). Presets are the default when a user has no
// custom `permissions` override.
export const ROLE_PRESETS: Record<RoleKey, PermKey[] | ["*"]> = {
  admin: ["*"],
  manager: ["dashboard", "requisitions", "shipments", "sales", "stock", "products", "cash", "review"],
  operations: ["dashboard", "requisitions", "shipments", "sales", "stock", "products", "cash"],
  viewer: ["dashboard", "sales", "stock"],
  staff: ["my_sales"],
};

function presetFor(role: string): PermKey[] {
  const p = ROLE_PRESETS[role as RoleKey];
  if (!p) return [];
  return p[0] === "*" ? [...ALL_PERM_KEYS] : (p as PermKey[]);
}

/** The permission keys a user actually has (custom override wins over preset). */
export function effectivePermissions(user: Pick<User, "role" | "permissions">): PermKey[] {
  if (user.role === "admin") return [...ALL_PERM_KEYS];
  const custom = user.permissions;
  if (custom && custom.length) return custom.filter((k): k is PermKey => (ALL_PERM_KEYS as string[]).includes(k));
  return presetFor(user.role);
}

export function can(user: Pick<User, "role" | "permissions">, key: PermKey): boolean {
  if (user.role === "admin") return true;
  return effectivePermissions(user).includes(key);
}

/** Map a request path to the permission that guards it (longest prefix wins). */
export function permissionForPath(path: string): PermKey | null {
  if (path === "/") return "dashboard";
  // check most specific hrefs first (skip "/" which we handled above)
  const byLen = PERMISSIONS.filter((p) => p.href !== "/").sort((a, b) => b.href.length - a.href.length);
  for (const p of byLen) {
    if (path === p.href || path.startsWith(p.href + "/")) return p.key;
  }
  return null;
}

/** Where to send a user after login / when blocked — first page they can see. */
export function landingFor(user: Pick<User, "role" | "permissions">): string {
  const keys = new Set(effectivePermissions(user));
  const first = PERMISSIONS.find((p) => keys.has(p.key));
  return first ? first.href : "/my";
}
