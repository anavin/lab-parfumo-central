import { requireUser } from "@/lib/auth/require-user";
import { billByReceipt, paymentsForRefs } from "@/lib/queries";
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
  const items: ReceiptItem[] = rows.map((r) => ({
    name: r.item || "-", size: r.size || "", qty: r.qty || 0, unitPrice: r.unit_price || 0, discount: r.discount || 0, total: r.total || 0,
  }));
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
