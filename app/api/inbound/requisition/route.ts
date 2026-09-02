import { q, tx } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

// Inbound webhook FROM the central warehouse (stockflow). When the warehouse dispatches a
// requisition it POSTs the actual per-piece SKUs here, and we auto-receive them into branch
// stock — a push replacement for the poll(B)+receive(C) flow, so no one has to press "รับของ".
//
//   POST /api/inbound/requisition
//   Authorization: Bearer <CTW_API_KEY>        (same key as the outbound CTW client)
//   body: { po_no: "WPO...", skus: [{ barcode, product?, size? }] }
//   → { ok, order_no, received, shipped, unmatched }   (idempotent: re-send after received = { already:true })
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const norm = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9ก-๙]/g, "");
const bad = (error: string, status: number) => Response.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  const secret = process.env.CTW_API_KEY?.trim();
  if (!secret) return bad("ยังไม่ได้ตั้ง CTW_API_KEY", 503);
  const h = req.headers.get("authorization") || "";
  const key = h.replace(/^Bearer\s+/i, "") || req.headers.get("x-api-key") || "";
  if (!key || key !== secret) return bad("unauthorized", 401);

  let body: any;
  try { body = await req.json(); } catch { return bad("body ต้องเป็น JSON", 400); }
  const poNo = String(body?.po_no || "").trim();
  const skus = Array.isArray(body?.skus) ? body.skus : [];
  if (!poNo) return bad("ต้องมี po_no", 400);
  if (!skus.length) return bad("ต้องมี skus อย่างน้อย 1 ชิ้น", 400);

  try {
    const [po] = await q<{ id: number; status: string }>(
      `select id, status from purchase_orders where po_number = $1 and deleted_at is null order by id desc limit 1`, [poNo]);
    if (!po) return bad(`ไม่พบใบเบิก ${poNo}`, 404);
    if (po.status === "received") return Response.json({ ok: true, already: true, order_no: poNo });

    // count shipped pieces by barcode (authoritative); name+size only for SKUs without a barcode
    const byBarcode = new Map<string, number>();
    const byName = new Map<string, number>();
    for (const s of skus) {
      const bc = String(s?.barcode || "").trim();
      if (bc) byBarcode.set(bc, (byBarcode.get(bc) || 0) + 1);
      else { const k = `${norm(s?.product)}|${norm(s?.size)}`; byName.set(k, (byName.get(k) || 0) + 1); }
    }
    const items = await q<{ id: number; barcode: string | null; scent: string | null; size: string | null }>(
      `select id, barcode, scent, size from po_items where po_id = $1`, [po.id]);
    const lines = items.map((it) => {
      const bc = String(it.barcode || "").trim();
      const qty = bc && byBarcode.has(bc) ? byBarcode.get(bc)! : (byName.get(`${norm(it.scent || "")}|${norm(it.size || "")}`) ?? 0);
      return { id: it.id, received_qty: qty };
    });
    const matched = lines.reduce((s, l) => s + l.received_qty, 0);
    const shipped = skus.length;

    await tx(async (run) => {
      // serialize concurrent webhooks for the same PO, then re-check it's still un-received
      await run(`select pg_advisory_xact_lock(hashtext($1))`, [`inbound-${poNo}`]);
      const [cur] = await run<{ status: string }>(`select status from purchase_orders where id=$1 for update`, [po.id]);
      if (cur?.status === "received") return;   // another webhook won — leave it
      for (const l of lines) {
        await run(`update po_items set received_qty = least($2, qty) where id = $1 and po_id = $3`,
          [l.id, Math.max(0, Math.round(l.received_qty)), po.id]);
      }
      await run(`update purchase_orders set status = 'received', received_at = now() where id = $1`, [po.id]);
    });

    await logAudit("update", "requisition", po.id, `รับอัตโนมัติจากคลังกลาง ${poNo} · เข้าสต๊อก ${matched}/${shipped} ชิ้น`);
    revalidatePath("/my"); revalidatePath("/my/receive"); revalidatePath("/stock"); revalidatePath("/requisitions"); revalidatePath(`/requisitions/${po.id}`);
    return Response.json({ ok: true, order_no: poNo, received: matched, shipped, unmatched: shipped - matched });
  } catch (e: any) {
    if (e?.code === "42703") return bad("ยังไม่ได้ติดตั้งคอลัมน์ (รัน SQL 0021)", 500);
    console.error("[inbound/requisition]", e);
    return bad("รับเข้าไม่สำเร็จ", 500);
  }
}
