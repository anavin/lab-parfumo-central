import { renderToBuffer } from "@react-pdf/renderer";
import { q } from "@/lib/db";
import { RequisitionDocument, type PdfPO, type PdfItem } from "@/lib/pdf/requisition-document";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [po] = await q<PdfPO>(`select * from purchase_orders where id=$1`, [Number(id)]);
  if (!po) return new Response("Not found", { status: 404 });
  const items = await q<PdfItem>(`
    select i.barcode, i.scent, i.size, i.qty, p.grade, p.sku
    from po_items i left join products p on p.id = i.product_id
    where i.po_id=$1 order by i.line_no nulls last, i.id`, [Number(id)]);

  const buffer = await renderToBuffer(<RequisitionDocument po={po} items={items} />);
  const uint8 = new Uint8Array(buffer);
  return new Response(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="requisition-${po.po_number}.pdf"`,
    },
  });
}
