"use server";
import { q, tx } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requisitionSchema } from "./schemas";
import { logAudit } from "@/lib/audit";
import { requirePermission, requireUser, requireAnyPermission } from "@/lib/auth/require-user";
import { can } from "@/lib/auth/permissions";
import { resolveBranch } from "@/lib/branches";
import { ctwEnabled, ctwSendRequisition, ctwGetRequisition, ctwReceive } from "@/lib/ctw-client";

export type ReqItemInput = { barcode: string; scent: string; size: string; qty: number; product_id?: number | null };
export type ReqInput = {
  order_date: string;
  branch_label: string;
  store_no?: string;
  delivery_number?: string;
  phone?: string;
  shipping_name?: string;
  address?: string;
  remark?: string;
  status?: string;
  items: ReqItemInput[];
};

/** Generate WPO{yy}{mm}{dd}{seq3} unique per day. Uses MAX(sequence)+1 (not
 * count) so a purge or a gap never reuses an existing number; date parts come
 * from the string to stay timezone-stable. */
async function nextPoNumber(orderDate: string): Promise<string> {
  const [y, m, dd] = orderDate.split("-");
  const prefix = `WPO${y.slice(2)}${(m || "").padStart(2, "0")}${(dd || "").padStart(2, "0")}`;
  const [row] = await q<{ n: number }>(
    `select coalesce(max(substring(po_number from '[0-9]{3}$')::int), 0) n
     from purchase_orders where po_number like $1`, [`${prefix}%`]);
  const seq = String((row?.n ?? 0) + 1).padStart(3, "0");
  return `${prefix}${seq}`;
}

async function replaceItems(poId: number, items: ReqItemInput[]) {
  await q(`delete from po_items where po_id = $1`, [poId]);
  let line = 1;
  for (const it of items) {
    if ((!it.scent && !it.barcode) || (Number(it.qty) || 0) <= 0) continue;   // skip empty / qty-0 lines
    await q(
      `insert into po_items (po_id, line_no, barcode, product_id, scent, size, qty)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [poId, line++, it.barcode || null, it.product_id ?? null, it.scent || null, it.size || null, Number(it.qty) || 0]);
  }
  await q(
    `update po_items i set product_id = p.id from products p
     where p.barcode = i.barcode and i.po_id = $1 and i.product_id is null`, [poId]);
}

export async function createRequisition(input: ReqInput) {
  await requirePermission("requisitions");
  const parsed = requisitionSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const data = parsed.data;
  // Two same-day requisitions can compute the same next number concurrently;
  // the unique(po_number,version) constraint then throws 23505. Retry with a
  // freshly-computed number a few times instead of surfacing a raw DB error.
  let po: { id: number } | undefined;
  let po_number = "";
  for (let attempt = 0; attempt < 6; attempt++) {
    po_number = await nextPoNumber(data.order_date);
    try {
      [po] = await q<{ id: number }>(
        `insert into purchase_orders
           (po_number, version, order_date, branch_label, store_no, delivery_number, phone, shipping_name, address, remark, status)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id`,
        [po_number, `${po_number}-1`, data.order_date, data.branch_label, data.store_no || null,
         data.delivery_number || null, data.phone || null, data.shipping_name || null,
         data.address || null, data.remark || null, data.status || "draft"]);
      break;
    } catch (e: any) {
      if (e?.code === "23505" && attempt < 5) continue;   // number taken → try next
      throw e;
    }
  }
  if (!po) throw new Error("สร้างเลขใบเบิกไม่สำเร็จ กรุณาลองใหม่");
  await replaceItems(po.id, data.items);
  await logAudit("create", "requisition", po.id, `${po_number} · ${data.branch_label} · ${data.items.length} รายการ`);
  revalidatePath("/requisitions");
  redirect(`/requisitions/${po.id}`);
}

export async function updateRequisition(id: number, input: ReqInput) {
  await requirePermission("requisitions");
  const parsed = requisitionSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
  const data = parsed.data;
  // once received, the lines carry received_qty; editing replaces the lines and would
  // wipe it (and drop the goods from stock). Block it — ask to un-receive first.
  const [cur] = await q<{ received_at: string | null }>(`select received_at from purchase_orders where id=$1`, [id]);
  if (cur?.received_at) throw new Error("ใบเบิกนี้รับของเข้าสต๊อกแล้ว แก้ไขไม่ได้");
  await q(
    `update purchase_orders set order_date=$2, branch_label=$3, store_no=$4,
       delivery_number=$5, phone=$6, shipping_name=$7, address=$8, remark=$9, status=$10,
       approved_at = case when $10 in ('draft','issued','delivered') then null else approved_at end,
       approved_by = case when $10 in ('draft','issued','delivered') then null else approved_by end
     where id=$1`,
    [id, data.order_date, data.branch_label, data.store_no || null,
     data.delivery_number || null, data.phone || null, data.shipping_name || null,
     data.address || null, data.remark || null, data.status || "issued"]);
  await replaceItems(id, data.items);
  const [po] = await q<{ po_number: string }>(`select po_number from purchase_orders where id=$1`, [id]);
  await logAudit("update", "requisition", id, po?.po_number);
  revalidatePath(`/requisitions/${id}`);
  revalidatePath("/requisitions");
  redirect(`/requisitions/${id}`);
}

/** (A) Push a requisition into the central warehouse (stockflow) so it can pick + dispatch.
 *  Best-effort — returns a warn string on any problem (never throws); a warehouse outage must
 *  not block the local status change. Idempotent on po_no upstream (safe to call repeatedly).
 *  Called from BOTH approveRequisition and setRequisitionStatus (issue/approve). */
async function pushRequisitionToCtw(id: number): Promise<string | undefined> {
  if (!ctwEnabled()) return undefined;
  const [po] = await q<{ po_number: string; branch_label: string | null }>(`select po_number, branch_label from purchase_orders where id=$1`, [id]);
  if (!po?.po_number) return undefined;
  const items = await q<{ barcode: string | null; qty: number }>(`select barcode, qty::float qty from po_items where po_id=$1`, [id]);
  const send = items.filter((i) => i.barcode?.trim()).map((i) => ({ barcode: i.barcode!, qty: i.qty }));
  const res = await ctwSendRequisition(po.po_number, po.branch_label, send);
  let warn: string | undefined;
  if (!res.ok) warn = `ส่งเข้าคลังกลางไม่สำเร็จ: ${res.error || `HTTP ${res.httpStatus}`}`;
  else if (res.unmatched?.length) warn = `ส่งคลังกลางแล้ว แต่บาร์โค้ดไม่รู้จัก ${res.unmatched.length} รายการ`;
  await logAudit("update", "requisition", id, `ส่งคลังกลาง ${po.po_number}${warn ? ` · ${warn}` : ` · ${res.saved ?? 0} รายการ`}`);
  return warn;
}

/** Admin override: force a requisition to any status. Stamps approved/received
 *  timestamps so downstream logic (stock, sync) stays consistent. */
export async function setRequisitionStatus(id: number, status: string): Promise<{ ok: boolean; error?: string; warn?: string }> {
  const me = await requirePermission("requisitions");
  try {
    // keep the lifecycle timestamps in sync with the forced status
    const stamp =
      status === "approved" ? `, approved_at = coalesce(approved_at, now()), approved_by = coalesce(approved_by, $3)`
      : status === "received" ? `, received_at = coalesce(received_at, now()), received_by = coalesce(received_by, $3)`
      : "";
    await q(`update purchase_orders set status=$2 ${stamp} where id=$1`, stamp ? [id, status, me.id] : [id, status]);
    await logAudit("update", "requisition", id, `สถานะ → ${status}`);

    const warn = (status === "issued" || status === "approved") ? await pushRequisitionToCtw(id) : undefined;

    revalidatePath(`/requisitions/${id}`); revalidatePath("/requisitions");
    revalidatePath("/my"); revalidatePath("/my/receive"); revalidatePath("/stock");   // received affects branch stock + inbox
    return { ok: true, warn };
  } catch (e: any) {
    if (e?.code === "42703") return { ok: false, error: "ยังไม่ได้ติดตั้งคอลัมน์ (รัน SQL 0021)" };
    console.error("[setRequisitionStatus]", e);
    return { ok: false, error: "เปลี่ยนสถานะไม่สำเร็จ" };
  }
}

/** Admin approves a requisition → status 'approved', sent to the branch to receive. */
export async function approveRequisition(id: number): Promise<{ ok: boolean; error?: string; warn?: string }> {
  const me = await requirePermission("requisitions");
  try {
    await q(`update purchase_orders set status='approved', approved_at=now(), approved_by=$2
             where id=$1 and coalesce(status,'') in ('draft','issued','delivered')`, [id, me.id]);
    await logAudit("update", "requisition", id, "อนุมัติใบเบิก");
    const warn = await pushRequisitionToCtw(id);   // (A) send to central warehouse on approve
    revalidatePath(`/requisitions/${id}`); revalidatePath("/requisitions"); revalidatePath("/my");
    return { ok: true, warn };
  } catch (e: any) { if (e?.code === "42703") return { ok: false, error: "ยังไม่ได้ติดตั้งคอลัมน์ (รัน SQL 0021)" }; console.error("[approveRequisition]", e); return { ok: false, error: "อนุมัติไม่สำเร็จ" }; }
}

/** Admin un-approves (only before the branch receives) → back to draft. */
export async function unapproveRequisition(id: number): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("requisitions");
  try {
    const res = await q<{ id: number }>(`update purchase_orders set status='draft', approved_at=null, approved_by=null
             where id=$1 and status='approved' returning id`, [id]);
    if (!res.length) return { ok: false, error: "ยกเลิกไม่ได้ (รับของแล้ว หรือยังไม่อนุมัติ)" };
    await logAudit("update", "requisition", id, "ยกเลิกการอนุมัติใบเบิก");
    revalidatePath(`/requisitions/${id}`); revalidatePath("/requisitions"); revalidatePath("/my");
    return { ok: true };
  } catch (e) { console.error("[unapproveRequisition]", e); return { ok: false, error: "ยกเลิกไม่สำเร็จ" }; }
}

/** Branch staff confirms receipt → records received qty per line + remark, marks
 *  the requisition 'received' (which is what makes it count toward branch stock). */
/** (B) Central-warehouse status for a requisition (created→issued→dispatched→received) plus the
 *  per-piece SKUs it shipped. Returns { enabled:false } when the integration isn't configured. */
export async function ctwRequisitionStatus(id: number): Promise<{ enabled: boolean; ok?: boolean; error?: string; status?: string; dispatched?: boolean; shipped?: number }> {
  await requireAnyPermission(["my_sales", "requisitions"]);
  if (!ctwEnabled()) return { enabled: false };
  const [head] = await q<{ po_number: string }>(`select po_number from purchase_orders where id=$1`, [id]);
  if (!head?.po_number) return { enabled: true, ok: false, error: "ไม่พบเลขใบเบิก" };
  const wh = await ctwGetRequisition(head.po_number);
  if (!wh.ok) return { enabled: true, ok: false, error: wh.error || `HTTP ${wh.httpStatus}` };
  return { enabled: true, ok: true, status: wh.status, dispatched: wh.status === "dispatched" || wh.status === "received", shipped: (wh.skus || []).length };
}

export async function receiveRequisition(id: number, lines: { id: number; received_qty: number; remark?: string }[], remark?: string): Promise<{ ok: boolean; error?: string; warn?: string }> {
  const me = await requireAnyPermission(["my_sales", "requisitions"]);
  try {
    // Received quantities come from the SKUs the warehouse shipped. In the push model those are
    // already stored on the PO (shipped_skus) — the goods are here, so use them directly and DON'T
    // re-gate on the warehouse status. Only when nothing was pushed do we pull from the warehouse
    // (which then requires it to have dispatched). Match SKUs→lines by barcode (name+size fallback).
    let ctwLines: { id: number; received_qty: number; remark?: string }[] | null = null;
    let poNumber = "";
    let ctwWarn: string | undefined;
    let shipped: { barcode?: string | null; product?: string | null; size?: string | null }[] = [];
    let fromPush = false;   // goods pushed to us → warehouse already closed its side (don't call back)

    try {
      const [head] = await q<{ po_number: string; shipped_skus: any }>(`select po_number, shipped_skus from purchase_orders where id=$1`, [id]);
      poNumber = head?.po_number || "";
      shipped = Array.isArray(head?.shipped_skus) ? head!.shipped_skus : [];
      fromPush = shipped.length > 0;
    } catch (e: any) {
      if (e?.code !== "42703") throw e;   // shipped_skus not migrated (pre-0031)
      const [head] = await q<{ po_number: string }>(`select po_number from purchase_orders where id=$1`, [id]);
      poNumber = head?.po_number || "";
    }

    // nothing pushed yet → pull from the warehouse (must be dispatched)
    if (!shipped.length && ctwEnabled() && poNumber) {
      const wh = await ctwGetRequisition(poNumber);
      if (wh.ok && (wh.status === "dispatched" || wh.status === "received")) shipped = wh.skus || [];
      else if (wh.ok) return { ok: false, error: `คลังกลางยังไม่จัดส่ง (สถานะ: ${wh.status ?? "-"}) — รับไม่ได้` };
      // wh not reachable → fall through to the branch's manual lines
    }

    if (shipped.length) {
      // count shipped SKUs by BARCODE (1:1 across both systems); name+size only for SKUs w/o barcode
      const norm = (s: any) => String(s || "").toLowerCase().replace(/[^a-z0-9ก-๙]/g, "");
      const byBarcode = new Map<string, number>();
      const byName = new Map<string, number>();
      for (const s of shipped) {
        const bc = String(s.barcode || "").trim();
        if (bc) byBarcode.set(bc, (byBarcode.get(bc) || 0) + 1);
        else { const k = `${norm(s.product)}|${norm(s.size)}`; byName.set(k, (byName.get(k) || 0) + 1); }
      }
      const poItems = await q<{ id: number; barcode: string | null; scent: string | null; size: string | null }>(`select id, barcode, scent, size from po_items where po_id=$1`, [id]);
      ctwLines = poItems.map((it) => {
        const bc = String(it.barcode || "").trim();
        const qty = bc && byBarcode.has(bc) ? byBarcode.get(bc)! : (byName.get(`${norm(it.scent || "")}|${norm(it.size || "")}`) ?? 0);
        return { id: it.id, received_qty: qty };
      });
      const matched = ctwLines.reduce((s, l) => s + l.received_qty, 0);
      if (shipped.length > 0 && matched !== shipped.length) ctwWarn = `จับคู่ SKU คลังไม่ครบ: เข้าสต๊อก ${matched}/${shipped.length} ชิ้น — ตรวจสอบบาร์โค้ด/ชื่อสินค้า`;
    }
    const useLines = ctwLines ?? lines;

    // FOR UPDATE + conditional status flip in one tx: two concurrent receives can't
    // both pass the status check, and the per-line updates commit all-or-nothing with
    // the status change (no half-received PO skewing branch stock).
    const res = await tx<{ ok: boolean; error?: string }>(async (run) => {
      const [po] = await run<{ status: string; branch_label: string | null; assigned_to: number | null }>(
        `select status, branch_label, assigned_to from purchase_orders where id=$1 and deleted_at is null for update`, [id]);
      if (!po) return { ok: false, error: "ไม่พบใบเบิก" };
      if (!["delivered", "approved"].includes(po.status)) return { ok: false, error: "ใบเบิกนี้รับไม่ได้ (ยังไม่ส่ง/อนุมัติ หรือรับแล้ว)" };
      // a salesperson (my_sales, not an admin with `requisitions`) may only receive a PO ASSIGNED
      // to them — the same scope as their /my inbox (pendingReceipts filters by assigned_to). This
      // works regardless of the user's home branch (which may be unset). Unassigned POs must be
      // assigned by an admin first. Admins/managers (with `requisitions`) can receive any PO.
      if (!can(me, "requisitions") && po.assigned_to !== me.id) {
        return { ok: false, error: "รับได้เฉพาะใบเบิกที่มอบหมายให้คุณ (ให้แอดมินมอบหมายก่อน)" };
      }
      for (const l of useLines || []) {
        // cap received at the ordered qty so a fat-finger can't inflate branch stock
        await run(`update po_items set received_qty = least($2, qty), line_remark=$3 where id=$1 and po_id=$4`,
          [l.id, Math.max(0, Math.round(Number(l.received_qty) || 0)), (l.remark || "").trim() || null, id]);
      }
      await run(`update purchase_orders set status='received', received_at=now(), received_by=$2,
               remark = coalesce(nullif($3,''), remark) where id=$1`, [id, me.id, (remark || "").trim()]);
      return { ok: true };
    });
    if (!res.ok) return res;

    // (C) close the requisition on the warehouse AFTER branch stock is committed — ONLY in the pull
    // flow. In the push flow the warehouse already closed its side when it sent, so skip the callback.
    let warn = ctwWarn;
    if (ctwEnabled() && poNumber && !fromPush) {
      const done = await ctwReceive(poNumber, me.full_name || "CTW");
      if (!done.ok) warn = [warn, `ปิดใบเบิกที่คลังกลางไม่สำเร็จ: ${done.error || `HTTP ${done.httpStatus}`}`].filter(Boolean).join(" · ");
    }
    await logAudit("update", "requisition", id, `รับของเข้าสาขา (${(useLines || []).length} รายการ)${warn ? ` · ${warn}` : ""}`);
    revalidatePath(`/requisitions/${id}`); revalidatePath("/requisitions"); revalidatePath("/my"); revalidatePath("/my/receive"); revalidatePath("/my/stock"); revalidatePath("/stock");
    return { ok: true, warn };
  } catch (e: any) { if (e?.code === "42703") return { ok: false, error: "ยังไม่ได้ติดตั้งคอลัมน์ (รัน SQL 0021)" }; console.error("[receiveRequisition]", e); return { ok: false, error: "รับของไม่สำเร็จ ลองใหม่" }; }
}

/** Active salespeople who can be assigned to receive a requisition (for the picker). */
export async function listReceivers(branch?: string): Promise<{ id: number; full_name: string; role: string; branch: string | null }[]> {
  await requirePermission("requisitions");
  const sel = (branchCol: string) => `select id, full_name, role, permissions, ${branchCol} as branch from users where is_active = true order by full_name`;
  let rows: { id: number; full_name: string; role: string; permissions: string[] | null; branch: string | null }[];
  try { rows = await q(sel("branch")); }
  catch (e: any) { if (e?.code !== "42703") throw e; rows = await q(sel("null::text")); }   // 0026 not run yet
  // Only salespeople can actually receive — they're the ones with a /my inbox. Assigning
  // to a manager/admin (no my_sales) would make the requisition invisible to everyone.
  let list = rows.filter((u) => can({ role: u.role, permissions: u.permissions }, "my_sales"));
  // Keep it to the requisition's own branch (+ staff with no home branch) so a cross-branch
  // assignment can't happen (which the receive branch-scope would then block anyway).
  if (branch) list = list.filter((u) => !u.branch || resolveBranch(u.branch) === resolveBranch(branch));
  return list.map(({ permissions, ...r }) => r);
}

/** Assign (or clear) which salesperson receives this requisition. Only that person
 *  then sees it in their /my receiving inbox. Admin/ops only. */
export async function assignRequisition(id: number, userId: number | null): Promise<{ ok: boolean; error?: string }> {
  await requirePermission("requisitions");
  try {
    if (userId != null) {   // only an active salesperson can be the receiver (they have the /my inbox)
      let u: { role: string; permissions: string[] | null; is_active: boolean; branch: string | null } | undefined;
      try {
        [u] = await q(`select role, permissions, is_active, branch from users where id = $1`, [userId]);
      } catch (e: any) {   // users.branch not migrated yet → validate without the branch check
        if (e?.code !== "42703") throw e;
        [u] = await q(`select role, permissions, is_active, null::text as branch from users where id = $1`, [userId]);
      }
      if (!u || !u.is_active) return { ok: false, error: "ไม่พบผู้ใช้ หรือถูกปิดใช้งาน" };
      if (!can({ role: u.role, permissions: u.permissions }, "my_sales")) return { ok: false, error: "มอบหมายได้เฉพาะพนักงานขาย" };
      if (u.branch) {   // receiver must belong to the same branch as the requisition
        const [po] = await q<{ branch_label: string | null }>(`select branch_label from purchase_orders where id = $1`, [id]);
        if (po?.branch_label && resolveBranch(po.branch_label) !== resolveBranch(u.branch)) {
          return { ok: false, error: "ผู้รับต้องเป็นพนักงานสาขาเดียวกับใบเบิก" };
        }
      }
    }
    await q(`update purchase_orders set assigned_to = $2 where id = $1`, [id, userId]);
    await logAudit("update", "requisition", id, userId ? `มอบหมายผู้รับ #${userId}` : "ยกเลิกมอบหมายผู้รับ");
    revalidatePath(`/requisitions/${id}`); revalidatePath("/requisitions"); revalidatePath("/my"); revalidatePath("/my/receive");
    return { ok: true };
  } catch (e: any) {
    if (e?.code === "42703") return { ok: false, error: "ยังไม่ได้ติดตั้งคอลัมน์ (รัน SQL 0029)" };
    console.error("[assignRequisition]", e);
    return { ok: false, error: "มอบหมายไม่สำเร็จ" };
  }
}

/** Soft delete → moves the requisition to ถังขยะ (restorable). */
export async function deleteRequisition(id: number) {
  await requirePermission("requisitions");
  const [po] = await q<{ po_number: string }>(`select po_number from purchase_orders where id=$1`, [id]);
  await q(`update purchase_orders set deleted_at = now() where id=$1`, [id]);
  await logAudit("delete", "requisition", id, po?.po_number);
  revalidatePath("/requisitions");
  revalidatePath("/trash");
  redirect("/requisitions");
}

export async function restoreRequisition(id: number) {
  await requirePermission("requisitions");
  const [po] = await q<{ po_number: string }>(`select po_number from purchase_orders where id=$1`, [id]);
  await q(`update purchase_orders set deleted_at = null where id=$1`, [id]);
  await logAudit("restore", "requisition", id, po?.po_number);
  revalidatePath("/requisitions");
  revalidatePath("/trash");
}

/** Permanent delete from ถังขยะ. */
export async function purgeRequisition(id: number) {
  await requirePermission("requisitions");
  const [po] = await q<{ po_number: string }>(`select po_number from purchase_orders where id=$1`, [id]);
  await q(`delete from purchase_orders where id=$1`, [id]);
  await logAudit("purge", "requisition", id, po?.po_number);
  revalidatePath("/trash");
}
