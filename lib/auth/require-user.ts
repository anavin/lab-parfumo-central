import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";
import type { User } from "./constants";
import { can, landingFor, type PermKey } from "./permissions";

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Gate a page/action on a single permission; bounce to the user's landing page. */
export async function requirePermission(key: PermKey): Promise<User> {
  const user = await requireUser();
  if (!can(user, key)) redirect(landingFor(user));
  return user;
}

/** Gate on ANY of several permissions — for actions shared by roles (e.g. a cash
 * action used by both a salesperson `my_sales` and an admin `cash`). Server-side
 * re-gate so a direct action call from a lower-privilege session is rejected even
 * though the UI is hidden. */
export async function requireAnyPermission(keys: PermKey[]): Promise<User> {
  const user = await requireUser();
  if (!keys.some((k) => can(user, k))) redirect(landingFor(user));
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect(landingFor(user));
  return user;
}

export function isAdmin(user: User | null | undefined): boolean {
  return !!user && user.role === "admin";
}
