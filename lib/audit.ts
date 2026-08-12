import { q } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export type AuditAction = "create" | "update" | "delete" | "restore" | "purge" | "login" | "logout" | "login_failed" | "password" | "submit" | "approve" | "reject";
export type AuditEntity = "requisition" | "sale" | "cash" | "customer" | "shipment" | "return" | "user" | "auth" | "submission" | "product" | "stock";

type Actor = { id?: number | null; username?: string; role?: string; full_name?: string };

/** Record an audit entry. Actor defaults to the current user; pass a name-only
 * actor (no id) for events with no valid user, e.g. a failed login. Never throws. */
export async function logAudit(
  action: AuditAction, entity: AuditEntity, entityId?: string | number | null, detail?: string,
  actor?: Actor,
): Promise<void> {
  try {
    const u: Actor | null = actor ?? (await getCurrentUser());
    const name = u ? (u.full_name || u.username || "ระบบ") : "ระบบ";
    await q(
      `insert into audit_log (user_id, user_name, user_role, action, entity, entity_id, detail)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [u?.id ?? null, name, u?.role ?? null, action, entity,
       entityId != null ? String(entityId) : null, detail ?? null]);
  } catch (e) {
    console.error("[audit] log failed:", e);
  }
}
