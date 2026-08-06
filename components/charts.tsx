"use client";
import { useState, useEffect } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList,
} from "recharts";

// Validated colorblind-safe categorical palette (dataviz skill)
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const BRAND = "#a17c48";     // gold — primary (revenue / sales magnitude)
const CUST = "#2a78d6";      // blue — customers dimension (secondary accent)
const GRID = "#eef0f3";
const axis = { fontSize: 11, fill: "#98a1b0" };

const baht = (v: number) =>
  Math.abs(v) >= 1e6 ? "฿" + (v / 1e6).toFixed(1) + "M" : Math.abs(v) >= 1e3 ? "฿" + (v / 1e3).toFixed(0) + "K" : "฿" + Math.round(v);
const numAbbr = (v: number) => (Math.abs(v) >= 1e3 ? (v / 1e3).toFixed(1) + "K" : String(v));

function TT({ active, payload, label, fmt }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface shadow-pop px-3 py-2 text-xs">
      {label != null && <div className="font-semibold text-ink mb-1">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color || p.payload?.fill }} />
          <span className="text-muted">{p.name}</span>
          <span className="ml-auto font-semibold text-ink tabular-nums">{fmt ? fmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

const box = (c: React.ReactNode) => <ResponsiveContainer width="100%" height="100%">{c as any}</ResponsiveContainer>;

// Resolve a CSS custom property (RGB channels, e.g. "26 29 35") to an rgb() string,
// re-reading whenever the theme flips so SVG fills stay in sync with light/dark.
function useThemeColor(varName: string, fallback: string) {
  const [color, setColor] = useState(fallback);
  useEffect(() => {
    const read = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      setColor(v ? `rgb(${v})` : fallback);
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", read);
    return () => { obs.disconnect(); mq.removeEventListener("change", read); };
  }, [varName, fallback]);
  return color;
}

export function RevenueTrend({ data, xKey = "month" }: { data: any[]; xKey?: string }) {
  return box(
    <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
      <defs>
        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND} stopOpacity={0.28} />
          <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
      <XAxis dataKey={xKey} tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={12} />
      <YAxis tickFormatter={baht} tick={axis} tickLine={false} axisLine={false} width={46} />
      <Tooltip content={<TT fmt={baht} />} />
      <Area type="monotone" dataKey="revenue" name="รายได้" stroke={BRAND} strokeWidth={2.5} fill="url(#rev)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
    </AreaChart>,
  );
}

/** Combo: revenue (area, left ฿ axis) + customers (line, right count axis). */
function ComboTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface shadow-pop px-3 py-2 text-xs">
      <div className="font-semibold text-ink mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
          <span className="text-muted">{p.name}</span>
          <span className="ml-auto font-semibold text-ink tabular-nums">
            {p.dataKey === "revenue" ? baht(p.value) : numAbbr(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueCustomersCombo({ data, xKey = "x" }: { data: any[]; xKey?: string }) {
  return box(
    <ComposedChart data={data} margin={{ top: 10, right: 8, left: 6, bottom: 0 }}>
      <defs>
        <linearGradient id="rc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND} stopOpacity={0.26} />
          <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
      <XAxis dataKey={xKey} tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={12} />
      <YAxis yAxisId="rev" tickFormatter={baht} tick={{ ...axis, fill: "#a17c48" }} tickLine={false} axisLine={false} width={48} />
      <YAxis yAxisId="cust" orientation="right" tickFormatter={numAbbr} tick={{ ...axis, fill: CUST }} tickLine={false} axisLine={false} width={38}
        domain={[0, (max: number) => Math.ceil((max * 2) / 10) * 10]} />
      <Tooltip content={<ComboTip />} />
      <Legend verticalAlign="top" height={26} iconType="plainline" iconSize={14} wrapperStyle={{ fontSize: 12, color: "#3d434e" }} />
      <Area yAxisId="rev" type="monotone" dataKey="revenue" name="รายได้ (฿)" stroke={BRAND} strokeWidth={2.5} fill="url(#rc)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      <Line yAxisId="cust" type="monotone" dataKey="customers" name="ลูกค้า (ราย)" stroke={CUST} strokeWidth={2.5} dot={{ r: 2.5, fill: CUST, strokeWidth: 0 }} activeDot={{ r: 4, strokeWidth: 0 }} />
    </ComposedChart>,
  );
}

export function CustomersTrend({ data, xKey = "month" }: { data: any[]; xKey?: string }) {
  return box(
    <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
      <XAxis dataKey={xKey} tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={12} />
      <YAxis tick={axis} tickLine={false} axisLine={false} width={32} />
      <Tooltip content={<TT />} />
      <Line type="monotone" dataKey="customers" name="ลูกค้า" stroke={CUST} strokeWidth={2.5} dot={{ r: 2.5, fill: CUST, strokeWidth: 0 }} activeDot={{ r: 4, strokeWidth: 0 }} />
    </LineChart>,
  );
}

/** Horizontal bar — magnitude ranking (scents, payment channels). */
export function HBar({ data, valueKey = "revenue", labelKey = "scent", money = true, color = BRAND }: {
  data: any[]; valueKey?: string; labelKey?: string; money?: boolean; color?: string;
}) {
  const fmt = money ? baht : numAbbr;
  return box(
    <BarChart data={data} layout="vertical" margin={{ top: 2, right: 44, left: 8, bottom: 2 }} barCategoryGap={6}>
      <XAxis type="number" tickFormatter={fmt} tick={axis} axisLine={false} tickLine={false} />
      <YAxis type="category" dataKey={labelKey} tick={{ fontSize: 12, fill: "#3d434e" }} width={128} axisLine={false} tickLine={false} />
      <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} content={<TT fmt={fmt} />} />
      <Bar dataKey={valueKey} name={money ? "รายได้" : "จำนวน"} fill={color} radius={[0, 5, 5, 0]} maxBarSize={22}>
        <LabelList dataKey={valueKey} position="right" formatter={fmt} style={{ fontSize: 11, fill: "#697586", fontWeight: 600 }} />
      </Bar>
    </BarChart>,
  );
}

/** Vertical column chart — for day-of-week / hour-of-day. */
export function Columns({ data, color = BRAND, money = true, highlight }: {
  data: { label: string; value: number }[]; color?: string; money?: boolean; highlight?: string;
}) {
  const fmt = money ? baht : numAbbr;
  return box(
    <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
      <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval={0} />
      <YAxis tickFormatter={fmt} tick={axis} tickLine={false} axisLine={false} width={44} />
      <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} content={<TT fmt={fmt} />} />
      <Bar dataKey="value" name={money ? "รายได้" : "จำนวน"} radius={[4, 4, 0, 0]} maxBarSize={44}>
        {data.map((d, i) => <Cell key={i} fill={highlight && d.label === highlight ? "#836234" : color} />)}
      </Bar>
    </BarChart>,
  );
}

/** Grouped columns — two normalized-% bars per category (e.g. revenue% vs qty%). */
const GOLD_DARK = "#7a5c30";
const GOLD_LIGHT = "#cba05a";
function GradeTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-surface shadow-pop px-3 py-2 text-xs">
      <div className="font-semibold text-ink mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: GOLD_DARK }} />
        <span className="text-muted">รายได้</span>
        <span className="ml-auto font-semibold text-ink tabular-nums">{baht(d.revenue)} · {d.revenuePct.toFixed(0)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: GOLD_LIGHT }} />
        <span className="text-muted">จำนวน</span>
        <span className="ml-auto font-semibold text-ink tabular-nums">{d.qty.toLocaleString()} ชิ้น · {d.qtyPct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export function GradeColumns({ data }: { data: { label: string; revenue: number; qty: number; revenuePct: number; qtyPct: number }[] }) {
  return box(
    <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={3} barCategoryGap="28%">
      <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
      <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#3d434e" }} tickLine={false} axisLine={false} interval={0} />
      <YAxis tickFormatter={(v: number) => v + "%"} tick={axis} tickLine={false} axisLine={false} width={38} />
      <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} content={<GradeTip />} />
      <Legend verticalAlign="top" height={26} iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, color: "#3d434e" }} />
      <Bar dataKey="revenuePct" name="รายได้" fill={GOLD_DARK} radius={[4, 4, 0, 0]} maxBarSize={40} />
      <Bar dataKey="qtyPct" name="จำนวน" fill={GOLD_LIGHT} radius={[4, 4, 0, 0]} maxBarSize={40} />
    </BarChart>,
  );
}

// Warm brand-tonal ramp (dark→light gold) — coordinates with the app's gold theme.
const WARM = ["#7a5c30", "#a17c48", "#c6a370", "#e3d3b4"];

/** Donut with a center total + a value/percent legend list. Brand-tonal palette. */
export function Donut({
  data, money = true, centerLabel = "รวม", colors = WARM,
}: { data: { name: string; value: number }[]; money?: boolean; centerLabel?: string; colors?: string[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const fmt = money ? baht : numAbbr;
  const [hovering, setHovering] = useState(false);
  const divider = useThemeColor("--surface", "#fff");   // gap between slices = card background
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full" style={{ height: 176 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="90%"
              paddingAngle={2} stroke={divider} strokeWidth={2.5} startAngle={90} endAngle={-270}
              onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}
            >
              {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Pie>
            <Tooltip content={<TT fmt={(v: number) => `${fmt(v)} · ${Math.round((v / total) * 100)}%`} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-150 ${hovering ? "opacity-0" : "opacity-100"}`}>
          <span className="text-[11px] text-muted">{centerLabel}</span>
          <span className="text-[19px] font-bold text-ink tabular-nums leading-tight">{fmt(total)}</span>
        </div>
      </div>
      <div className="w-full max-w-[260px] mx-auto mt-5 space-y-2.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2.5 text-[13px]">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: colors[i % colors.length] }} />
            <span className="text-ink-soft w-16">{d.name}</span>
            <span className="ml-auto w-10 text-right text-muted tabular-nums">{Math.round((d.value / total) * 100)}%</span>
            <span className="w-16 text-right font-semibold text-ink tabular-nums">{fmt(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
