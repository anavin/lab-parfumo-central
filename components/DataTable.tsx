"use client";
import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

// Generic, client-side sortable table. Server pages pass serializable `rows`
// and define columns (with render fns) inside a small client wrapper — render
// functions can't cross the server→client boundary, so column configs live client-side.
export type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;                       // default true
  sortValue?: (row: T) => string | number | null | undefined;  // defaults to nothing → not sortable
  render: (row: T, index: number) => React.ReactNode;
  thClass?: string;
  tdClass?: string;
};

type Dir = "asc" | "desc";

export function DataTable<T>({
  columns, rows, rowKey, initialSort, maxHeight = "600px", empty = "ไม่มีข้อมูล",
  cellPad = "py-1.5", headPad = "pb-2",
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, i: number) => string | number;
  initialSort?: { key: string; dir: Dir };
  maxHeight?: string;
  empty?: string;
  cellPad?: string;   // td padding (e.g. "px-4 py-3" for roomier list tables)
  headPad?: string;   // th padding
}) {
  const [sort, setSort] = useState<{ key: string; dir: Dir } | null>(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const val = col.sortValue;
    const dir = sort.dir === "asc" ? 1 : -1;
    // stable sort with null/undefined pushed to the bottom regardless of dir
    return [...rows]
      .map((r, i) => [r, i] as const)
      .sort(([a, ai], [b, bi]) => {
        const av = val(a), bv = val(b);
        const an = av == null || av === "", bn = bv == null || bv === "";
        if (an && bn) return ai - bi;
        if (an) return 1;
        if (bn) return -1;
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir || ai - bi;
        return String(av).localeCompare(String(bv), "th") * dir || ai - bi;
      })
      .map(([r]) => r);
  }, [rows, sort, columns]);

  const onSort = (c: Column<T>) => {
    if (c.sortable === false || !c.sortValue) return;
    setSort((s) =>
      s?.key === c.key ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: "asc" });
  };
  const alignCls = (a?: string) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

  return (
    <div className="overflow-auto" style={{ maxHeight }}>
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface z-10">
          <tr className="border-b border-line-soft">
            {columns.map((c) => {
              const canSort = c.sortable !== false && !!c.sortValue;
              const active = sort?.key === c.key;
              return (
                <th key={c.key}
                  onClick={() => onSort(c)}
                  className={`${headPad} text-xs font-semibold text-muted ${alignCls(c.align)} ${canSort ? "cursor-pointer select-none hover:text-ink" : ""} ${c.thClass ?? ""}`}>
                  <span className={`inline-flex items-center gap-1 ${c.align === "right" ? "flex-row-reverse" : ""}`}>
                    {c.header}
                    {canSort && (active
                      ? (sort!.dir === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-brand-dark" /> : <ChevronDown className="w-3.5 h-3.5 text-brand-dark" />)
                      : <ChevronsUpDown className="w-3.5 h-3.5 text-muted/40" />)}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr><td colSpan={columns.length} className="py-8 text-center text-muted">{empty}</td></tr>
          ) : sorted.map((r, i) => (
            <tr key={rowKey(r, i)} className="border-b border-line-soft last:border-0 hover:bg-canvas transition-colors">
              {columns.map((c) => (
                <td key={c.key} className={`${cellPad} ${alignCls(c.align)} ${c.tdClass ?? ""}`}>{c.render(r, i)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
