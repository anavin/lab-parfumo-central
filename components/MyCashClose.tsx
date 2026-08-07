"use client";
import { useState } from "react";
import { Wallet } from "lucide-react";
import { baht } from "@/lib/format";

/** End-of-day cash close for the salesperson: change kept = cash received − bank deposit. */
export function MyCashClose({ cash }: { cash: number }) {
  const [deposit, setDeposit] = useState("");
  const depositN = Number(deposit) || 0;
  const change = Math.max(0, cash - depositN);
  return (
    <div className="card p-4 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="w-4 h-4 text-brand-dark" />
        <h3 className="text-sm font-semibold text-ink">ปิดเงินสดวันนี้</h3>
      </div>
      <div className="grid grid-cols-3 gap-2 items-end">
        <div>
          <div className="text-[11px] text-muted mb-1">เงินสดรับ</div>
          <div className="text-lg font-bold text-ink tabular-nums">{baht(cash)}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted mb-1">ฝากเข้าธนาคาร</div>
          <input inputMode="numeric" value={deposit} onFocus={(e) => e.target.select()}
            onChange={(e) => setDeposit(e.target.value.replace(/[^\d]/g, ""))} placeholder="0"
            className="w-full border border-line rounded-lg px-2.5 py-2 text-lg font-bold text-ink text-right tabular-nums bg-surface focus:outline-none focus:border-brand min-h-[44px]" />
        </div>
        <div>
          <div className="text-[11px] text-muted mb-1">เงินทอนเก็บหน้าร้าน</div>
          <div className="text-lg font-bold text-brand-dark tabular-nums">{baht(change)}</div>
        </div>
      </div>
      <div className="text-[11px] text-muted mt-2">เงินทอน = เงินสดรับ − ฝากเข้าธนาคาร (ยอดเงินสดที่เก็บไว้ในลิ้นชักหน้าร้าน)</div>
    </div>
  );
}
