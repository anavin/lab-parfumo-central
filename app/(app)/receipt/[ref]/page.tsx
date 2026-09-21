import { requireUser } from "@/lib/auth/require-user";
import { billByReceipt, paymentsForRefs, promoLineInfo } from "@/lib/queries";
import { type ReceiptItem } from "@/components/Receipt";
import { ReceiptView } from "@/components/ReceiptView";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ ref: string }> }) {
  await requireUser();
  const { ref } = await params;
  const decoded = decodeURIComponent(ref);
  const rows = await billByReceipt(decoded);

  if (!rows.length) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="card p-8 text-center text-muted text-sm">ไม่พบใบเสร็จเลขที่ {decoded}</div>
      </div>
    );
  }

  const first = rows[0];
  // lines sold at a promo price → show normal price + the saving as a promotion discount
  const promoInfo = await promoLineInfo(first.entry_date, rows.map((r) => r.barcode));
  const items: ReceiptItem[] = rows.map((r) => {
    const pi = r.barcode ? promoInfo[r.barcode] : undefined;
    const isPromo = !!pi && Math.round(r.unit_price || 0) === Math.round(pi.special);
    if (isPromo) {
      const saving = (pi!.normal - (r.unit_price || 0)) * (r.qty || 0);   // fold into the receipt discount so gross = normal price
      return { name: r.item || "-", size: r.size || "", qty: r.qty || 0, unitPrice: pi!.normal, discount: (r.discount || 0) + saving, total: r.total || 0, promo: true };
    }
    return { name: r.item || "-", size: r.size || "", qty: r.qty || 0, unitPrice: r.unit_price || 0, discount: r.discount || 0, total: r.total || 0 };
  });
  const tenders = (await paymentsForRefs([decoded]))[decoded] || [];   // per-channel split amounts (if any)

  return (
    <div className="receipt-page p-4 sm:p-6 max-w-md mx-auto">
      <a href="/my" className="no-print mb-3 inline-flex items-center gap-1.5 btn btn-brand w-full">
        ← ขายบิลใหม่
      </a>
      <ReceiptView filename={`Receipt-${decoded}`} receiptNo={decoded} date={first.entry_date}
        time={(first.sale_time || "").slice(0, 5)} salesperson={first.author}
        items={items} paymentChannel={first.payment_channel} tenders={tenders} />
    </div>
  );
}
