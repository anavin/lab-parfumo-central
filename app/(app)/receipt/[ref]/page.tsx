import { requireUser } from "@/lib/auth/require-user";
import { billByReceipt } from "@/lib/queries";
import { Receipt, type ReceiptItem } from "@/components/Receipt";
import { ReceiptPrintBar } from "@/components/ReceiptPrintBar";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ ref: string }> }) {
  await requireUser();
  const { ref } = await params;
  const decoded = decodeURIComponent(ref);
  const rows = await billByReceipt(decoded);

  if (!rows.length) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <ReceiptPrintBar filename={decoded} />
        <div className="card p-8 text-center text-muted text-sm">ไม่พบใบเสร็จเลขที่ {decoded}</div>
      </div>
    );
  }

  const first = rows[0];
  const items: ReceiptItem[] = rows.map((r) => ({
    name: r.item || "-", size: r.size || "", qty: r.qty || 0, unitPrice: r.unit_price || 0, discount: r.discount || 0, total: r.total || 0,
  }));

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto">
      <ReceiptPrintBar filename={`Receipt-${decoded}`} />
      <div className="print-area rounded-xl border border-line shadow-sm overflow-hidden">
        <Receipt receiptNo={decoded} date={first.entry_date} time={(first.sale_time || "").slice(0, 5)} salesperson={first.author} items={items} />
      </div>
    </div>
  );
}
