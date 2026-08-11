"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { branchOptions } from "@/lib/branches";

/**
 * Branch (สาขา) switcher driven by a URL search param (default `?branch=`).
 * `withAll` prepends a "ทุกสาขา" tab (value "all") for combined views.
 * Renders nothing when there is only one branch. Reused on /cash, /stock, /review.
 */
export function BranchTabs({ param = "branch", withAll = false }: { param?: string; withAll?: boolean }) {
  const base = branchOptions();
  const opts = withAll ? [{ value: "all", label: "ทุกสาขา" }, ...base] : base;
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  if (base.length < 2) return null;
  const cur = sp.get(param) ?? opts[0].value;
  const go = (v: string) => {
    const p = new URLSearchParams(sp.toString());
    p.set(param, v);
    router.push(`${pathname}?${p.toString()}`);
  };
  return (
    <div className="inline-flex rounded-lg bg-canvas p-0.5 border border-line" role="group" aria-label="สาขา">
      {opts.map((o) => (
        <button key={o.value} onClick={() => go(o.value)}
          className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${cur === o.value ? "bg-ink text-surface shadow-sm" : "text-muted hover:text-ink"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
