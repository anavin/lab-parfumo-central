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

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect(landingFor(user));
  return user;
}

export function isAdmin(user: User | null | undefined): boolean {
  return !!user && user.role === "admin";
}
