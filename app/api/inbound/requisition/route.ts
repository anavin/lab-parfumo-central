import { q, tx } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

// Inbound webhook FROM the central warehouse (stockflow). See docs CTW_API.md. When the
// warehouse dispatches a requisition it POSTs the shipped pieces here and we auto-receive
// them into branch stock — no one has to press "รับของ". Works whether the requisition was
// created in CTW first (found → update) or originated on stockflow (not found → created).
//
//   POST /api/inbound/requisition        Authorization: Bearer <CTW_API_KEY>
//   body: { po_no, branch?, doc_date?, items?: [{product,size,qty,sku}], skus?: [{sku,product,size,barcode}] }
//   → { ok, order_no, received, shipped, unmatched, created? }   (idempotent: after received → { already:true })
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const norm = (s: any) => String(s || "").toLowerCase().replace(/[^a-z0-9ก-๙]/g, "");
const bad = (error: string, status: number) => Response.json({ ok: false, error }, { status });

type Sku = { sku?: string; product?: string; size?: string; barcode?: string | null };
type Item = { product?: string; size?: string; qty?: number; sku?: string; barcode?: string | null };

/** Desired per-product quantities from the payload: prefer serialized SKUs (per-piece, carry
 *  barcode), else fall back to the aggregate items[] (qty, usually no barcode). */
function desiredQty(skus: Sku[], items: Item[]) {
  const byBarcode = new Map<string, number>();
  const byName = new Map<string, number>();
  let total = 0;
  if (skus.length) {
    for (const s of skus) {
      const bc = String(s?.barcode || "").trim();
      total += 1;
      if (bc) byBarcode.set(bc, (byBarcode.get(bc) || 0) + 1);
      else byName.set(`${norm(s?.product)}|${norm(s?.size)}`, (byName.get(`${norm(s?.product)}|${norm(s?.size)}`) || 0) + 1);
    }
  } else {
    for (const it of items) {
      const n = Math.max(0, Math.round(Number(it?.qty) || 0));
      if (!n) continue;
      total += n;
      const bc = String(it?.barcode || "").trim();
      if (bc) byBarcode.set(bc, (byBarcode.get(bc) || 0) + n);
      else byName.set(`${norm(it?.product)}|${norm(it?.size)}`, (byName.get(`${norm(it?.product)}|${norm(it?.size)}`) || 0) + n);
    }
  }
  return { byBarcode, byName, total };
}

export async function POST(req: Request) {
  const secret = process.env.CTW_API_KEY?.trim();
  if (!secret) return bad("ยังไม่ได้ตั้ง CTW_API_KEY", 503);
  const h = req.headers.get("authorization") || "";
  const key = h.replace(/^Bearer\s+/i, "") || req.headers.get("x-api-key") || "";
  if (!key || key !== secret) return bad("unauthorized", 401);

  let body: any;
  try { body = await req.json(); } catch { return bad("body ต้องเป็น JSON", 400); }
  const poNo = String(body?.po_no || "").trim();
  const skus: Sku[] = Array.isArray(body?.skus) ? body.skus : [];
  const items: Item[] = Array.isArray(body?.items) ? body.items : [];
  const branch = String(body?.branch || "").trim() || null;
  const docDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body?.doc_date || "")) ? body.doc_date : null;
  if (!poNo) return bad("ต้องมี po_no", 400);
  if (!skus.length && !items.length) return bad("ต้องมี skus หรือ items", 400);

  const { byBarcode, byName, total: shipped } = desiredQty(skus, items);
  const qtyFor = (barcode: string | null, product: string | null, size: string | null) => {
    const bc = String(barcode || "").trim();
    if (bc && byBarcode.has(bc)) return byBarcode.get(bc)!;
    return byName.get(`${norm(product)}|${norm(size)}`) ?? 0;
  };

  try {
    const [po] = await q<{ id: number; status: string }>(
      `select id, status from purchase_orders where po_number = $1 and deleted_at is null order by id desc limit 1`, [poNo]);
    if (po?.status === "received") return Response.json({ ok: true, already: true, order_no: poNo });

    let created = false;
    let matched = 0;

    await tx(async (run) => {
      await run(`select pg_advisory_xact_lock(hashtext($1))`, [`inbound-${poNo}`]);   // serialize concurrent webhooks
      let poId = po?.id;

      if (poId) {
        const [cur] = await run<{ status: string }>(`select status from purchase_orders where id=$1 for update`, [poId]);
        if (cur?.status === "received") { matched = -1; return; }   // another webhook won
        const its = await run<{ id: number; barcode: string | null; scent: string | null; size: string | null }>(
          `select id, barcode, scent, size from po_items where po_id=$1`, [poId]);
        for (const it of its) {
          const qty = qtyFor(it.barcode, it.scent, it.size);
          matched += qty;
          await run(`update po_items set received_qty = least($2, qty) where id=$1`, [it.id, qty]);
        }
      } else {
        // stockflow-originated requisition CTW hasn't seen → create it, lines from the payload
        created = true;
        const lines = buildLinesFromPayload(skus, items);
        const [ins] = await run<{ id: number }>(
          `insert into purchase_orders (po_number, version, order_date, branch_label, status, received_at)
           values ($1,$2,$3,$4,'received', now()) returning id`,
          [poNo, `${poNo}-ctw`, docDate, branch]);
        poId = ins.id;
        let line = 0;
        for (const l of lines) {
          line += 1;
          matched += l.qty;
          await run(
            `insert into po_items (po_id, line_no, barcode, product_id, scent, size, qty, received_qty)
             select $1,$2,$3,(select id from products where barcode=$3 limit 1),$4,$5,$6,$6`,
            [poId, line, l.barcode, l.product, l.size, l.qty]);
        }
      }
      if (poId && !created) await run(`update purchase_orders set status='received', received_at=now() where id=$1`, [poId]);
    });

    if (matched === -1) return Response.json({ ok: true, already: true, order_no: poNo });
    await logAudit("update", "requisition", null, `${created ? "สร้าง+รับ" : "รับ"}อัตโนมัติจากคลังกลาง ${poNo} · เข้าสต๊อก ${matched}/${shipped} ชิ้น`);
    revalidatePath("/my"); revalidatePath("/my/receive"); revalidatePath("/stock"); revalidatePath("/requisitions");
    return Response.json({ ok: true, order_no: poNo, received: matched, shipped, unmatched: Math.max(0, shipped - matched), created });
  } catch (e: any) {
    if (e?.code === "42703") return bad("ยังไม่ได้ติดตั้งคอลัมน์ (รัน SQL 0021)", 500);
    console.error("[inbound/requisition]", e);
    return bad("รับเข้าไม่สำเร็จ", 500);
  }
}

/** Collapse the payload into central po_item lines (one per barcode / product+size). */
function buildLinesFromPayload(skus: Sku[], items: Item[]) {
  const m = new Map<string, { barcode: string | null; product: string; size: string; qty: number }>();
  const add = (barcode: string | null, product: string, size: string, qty: number) => {
    const key = (barcode || "").trim() || `${norm(product)}|${norm(size)}`;
    const cur = m.get(key);
    if (cur) cur.qty += qty; else m.set(key, { barcode: (barcode || "").trim() || null, product, size, qty });
  };
  if (skus.length) for (const s of skus) add(s.barcode ?? null, String(s.product || ""), String(s.size || ""), 1);
  else for (const it of items) add(it.barcode ?? null, String(it.product || ""), String(it.size || ""), Math.max(0, Math.round(Number(it.qty) || 0)));
  return [...m.values()].filter((l) => l.qty > 0);
}
