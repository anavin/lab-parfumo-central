// Pure constants (no Node APIs) so the Edge middleware can import them.
export const SESSION_COOKIE = "lp_session";
export const SESSION_IDLE_MIN = 60;
export const SESSION_COOKIE_MAX_AGE_DAYS = 7;

export type Role = "admin" | "staff";

export type User = {
  id: number;
  username: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
};
