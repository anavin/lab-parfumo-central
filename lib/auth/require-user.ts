import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";
import type { User } from "./constants";

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}

export function isAdmin(user: User | null | undefined): boolean {
  return !!user && user.role === "admin";
}
