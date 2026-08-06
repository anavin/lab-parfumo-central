// Pure constants (no Node APIs) so the Edge middleware can import them.
export const SESSION_COOKIE = "lp_session";
export const SESSION_IDLE_MIN = 5;   // auto-logout after 5 min idle (unless "remember me")
export const SESSION_COOKIE_MAX_AGE_DAYS = 7;

// Kept broad on purpose: role is free text in the DB and the set of presets can
// grow (see lib/auth/permissions.ts ROLES). "admin"/"staff" are the originals.
export type Role = "admin" | "manager" | "operations" | "viewer" | "staff" | (string & {});

export type User = {
  id: number;
  username: string;
  full_name: string;
  role: Role;
  // Per-user permission override. null → inherit the role preset.
  permissions: string[] | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
};
