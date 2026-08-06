import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { can, type PermKey } from "@/lib/auth/permissions";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

type Col = { k: string; h: string };

// UTF-8 BOM so Thai renders correctly when opened in Excel.
function toCsv(rows: any[], cols: Col[]): string {
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = cols.map((c) => esc(c.h)).join(",");
  const body = rows.map((r) => cols.map((c) => esc(r[c.k])).join(",")).join("\n");
  return "﻿" + head + "\n" + body + "\n";   // BOM so Excel reads Thai as UTF-8
}

const CONFIG: Record<string, { perm: PermKey; file: string; run: () => Promise<{ cols: Col[]; rows: any[] }> }> = {
  sales: {
    perm: "sales", file: "sales",
    run: async () => {
      const rows = await q(`select sale_date, sale_time::text sale_time, ba, item, size,
        qty::float qty, unit_price::float unit_price, discount::float discount, total::float total,
        payment_channel, nation, receipt_no, source
        from sales order by sale_date desc nulls last, id desc`);
      return { rows, cols: [
        { k: "sale_date", h: "วันที่" }, { k: "sale_time", h: "เวลา" }, { k: "ba", h: "พนักงาน" },
        { k: "item", h: "สินค้า" }, { k: "size", h: "ขนาด" }, { k: "qty", h: "จำนวน" },
        { k: "unit_price", h: "ราคา/หน่วย" }, { k: "discount", h: "ส่วนลด" }, { k: "total", h: "รวม" },
        { k: "payment_channel", h: "ช่องทางชำระ" }, { k: "nation", h: "สัญชาติ" },
        { k: "receipt_no", h: "เลขใบเสร็จ" }, { k: "source", h: "ช่องทางขาย" },
      ] };
    },
  },
  stock: {
    perm: "stock", file: "stock",
    run: async () => {
      const { stockLive } = await import("@/lib/queries");
      const rows = await stockLive();
      return { rows, cols: [
        { k: "barcode", h: "บาร์โค้ด" }, { k: "scent", h: "กลิ่น" }, { k: "size", h: "ขนาด" },
        { k: "shipped", h: "ส่งไป" }, { k: "sold", h: "ขาย" }, { k: "returned", h: "คืน" }, { k: "remaining", h: "คงเหลือ" },
      ] };
    },
  },
  cash: {
    perm: "cash", file: "cash",
    run: async () => {
      const rows = await q(`select cash_date, description, amount::float amount, type
        from cash_entries order by cash_date desc nulls last, id desc`);
      return { rows, cols: [
        { k: "cash_date", h: "วันที่" }, { k: "description", h: "รายละเอียด" }, { k: "amount", h: "จำนวนเงิน" }, { k: "type", h: "ประเภท" },
      ] };
    },
  },
};

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const cfg = CONFIG[kind];
  if (!cfg) return new NextResponse("not found", { status: 404 });
  const user = await getCurrentUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });
  if (!can(user, cfg.perm)) return new NextResponse("forbidden", { status: 403 });

  const { cols, rows } = await cfg.run();
  const fname = `${cfg.file}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(toCsv(rows, cols), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fname}"`,
      "Cache-Control": "no-store",
    },
  });
}
