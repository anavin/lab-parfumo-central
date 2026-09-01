import "server-only";
import { branchStoreCode, resolveBranch } from "@/lib/branches";

// Client for the central warehouse (stockflow, labparfumo-stock.vercel.app). CTW is the
// caller; see docs CTW_API.md. Everything is gated on CTW_API_KEY — when it isn't set the
// integration is simply OFF (ctwEnabled() === false) and callers fall back to the local flow.
//
// Setup (owner, once) on the central Vercel project:
//   CTW_API_KEY         — the SAME random key set on stockflow (openssl rand -hex 24)
//   STOCKFLOW_BASE_URL  — optional; defaults to https://labparfumo-stock.vercel.app

const BASE = (process.env.STOCKFLOW_BASE_URL || "https://labparfumo-stock.vercel.app").replace(/\/$/, "");

export const ctwEnabled = () => !!process.env.CTW_API_KEY?.trim();

// `httpStatus` (not `status`) so it never clashes with a payload's own `status` field.
type CtwResult<T> = { ok: boolean; httpStatus: number; error?: string } & Partial<T>;

async function call<T = any>(path: string, init?: RequestInit): Promise<CtwResult<T>> {
  const key = process.env.CTW_API_KEY?.trim();
  if (!key) return { ok: false, httpStatus: 0, error: "ยังไม่ได้ตั้ง CTW_API_KEY" } as CtwResult<T>;
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "content-type": "application/json", authorization: `Bearer ${key}`, ...(init?.headers || {}) },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as any;
    return { ...data, ok: res.ok && data?.ok !== false, httpStatus: res.status, error: data?.error };
  } catch (e: any) {
    console.error("[ctw-client]", path, e);
    return { ok: false, httpStatus: 0, error: "เชื่อมต่อคลังกลางไม่สำเร็จ" } as CtwResult<T>;
  }
}

/** Map a central branch code/label to the warehouse's branch token ("01_CTW"). */
const toStoreCode = (branch: string | null | undefined) => branchStoreCode(resolveBranch(branch));

// (A) send a requisition into the central warehouse. Idempotent on po_no upstream.
export async function ctwSendRequisition(
  poNo: string, branch: string | null, items: { barcode: string; qty: number }[],
): Promise<CtwResult<{ order_no: string; saved: number; unmatched: string[] }>> {
  const clean = items.filter((i) => i.barcode?.trim() && (Number(i.qty) || 0) > 0)
    .map((i) => ({ barcode: i.barcode.trim(), qty: Math.round(Number(i.qty) || 0) }));
  if (!clean.length) return { ok: false, httpStatus: 0, error: "ไม่มีรายการที่มีบาร์โค้ด" } as CtwResult<{ order_no: string; saved: number; unmatched: string[] }>;
  return call("/api/ctw/requisition", {
    method: "POST",
    body: JSON.stringify({ po_no: poNo, branch: toStoreCode(branch), items: clean }),
  });
}

export type CtwStatus = "created" | "issued" | "dispatched" | "received";
// (B) fetch warehouse status + the real per-piece SKUs it shipped.
export async function ctwGetRequisition(
  poNo: string,
): Promise<CtwResult<{ order_no: string; branch: string; status: CtwStatus; issued_at: string | null; dispatched_at: string | null; received_at: string | null; items: { product: string; size: string; qty: number }[]; skus: { sku: string; product: string; size: string }[] }>> {
  return call(`/api/ctw/requisition/${encodeURIComponent(poNo)}`, { method: "GET" });
}

// (C) close the requisition on the warehouse side (call AFTER adding skus to branch stock).
export async function ctwReceive(
  poNo: string, receivedBy: string,
): Promise<CtwResult<{ received_at: string; already?: boolean }>> {
  return call(`/api/ctw/requisition/${encodeURIComponent(poNo)}/receive`, {
    method: "POST",
    body: JSON.stringify({ received_by: receivedBy }),
  });
}
