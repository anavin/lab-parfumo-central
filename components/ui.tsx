import Link from "next/link";
import { Info, type LucideIcon } from "lucide-react";
import { Sparkline } from "@/components/Sparkline";

/** CSS-only info tooltip (no JS state) — hover the ⓘ icon to reveal an explanation. */
export function Hint({ text }: { text: string }) {
  return (
    <span className="group/hint relative inline-flex items-center align-middle">
      <Info className="w-3.5 h-3.5 text-muted-soft" strokeWidth={2} />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-30 w-max max-w-[220px] rounded-lg bg-ink text-surface text-[11px] font-normal leading-snug px-2.5 py-1.5 opacity-0 group-hover/hint:opacity-100 transition-opacity shadow-pop">
        {text}
      </span>
    </span>
  );
}

export function PageHeader({
  title, subtitle, action, icon: Icon,
}: { title: string; subtitle?: string; action?: React.ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-6 sm:mb-7">
      <div className="flex items-start gap-3.5 min-w-0">
        {Icon && (
          <div className="mt-0.5 w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-brand-dark" strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-[20px] sm:text-[22px] font-bold text-ink leading-tight">{title}</h1>
          {subtitle && <p className="text-[13px] text-muted mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2 flex-wrap sm:shrink-0">{action}</div>}
    </div>
  );
}

const TONES: Record<string, { text: string; chip: string; icon: string }> = {
  default: { text: "text-ink", chip: "bg-line-soft", icon: "text-muted" },
  brand: { text: "text-ink", chip: "bg-brand-soft", icon: "text-brand-dark" },
  info: { text: "text-ink", chip: "bg-info-soft", icon: "text-info" },
  success: { text: "text-ink", chip: "bg-success-soft", icon: "text-success" },
  warn: { text: "text-ink", chip: "bg-warn-soft", icon: "text-warn" },
  danger: { text: "text-ink", chip: "bg-danger-soft", icon: "text-danger" },
};

const SPARK_COLOR: Record<string, string> = {
  default: "#98a1b0", brand: "#a17c48", info: "#2a78d6",
  success: "#1baf7a", warn: "#b45309", danger: "#dc2626",
};

export function Stat({
  label, value, sub, tone = "default", icon: Icon, spark, hint,
}: { label: string; value: string; sub?: string; tone?: keyof typeof TONES; icon?: LucideIcon; spark?: number[]; hint?: string }) {
  const t = TONES[tone];
  return (
    <div className="card p-4 flex flex-col min-h-[124px]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1 text-[12px] text-muted font-medium">
          {label}{hint && <Hint text={hint} />}
        </div>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg ${t.chip} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${t.icon}`} strokeWidth={2} />
          </div>
        )}
      </div>
      <div className={`flex-1 flex flex-col ${spark ? "justify-start mt-1.5" : "justify-center"}`}>
        <div className={`text-[26px] font-bold tabular-nums leading-none ${t.text}`}>{value}</div>
        {sub && <div className="text-[11.5px] text-muted-soft whitespace-nowrap mt-1">{sub}</div>}
      </div>
      {spark && <div className="mt-1.5"><Sparkline data={spark} color={SPARK_COLOR[tone]} width={124} height={26} /></div>}
    </div>
  );
}

export function Card({
  title, subtitle, children, className = "", action, bodyClass = "", fill = false,
}: { title?: string; subtitle?: string; children: React.ReactNode; className?: string; action?: React.ReactNode; bodyClass?: string; fill?: boolean }) {
  return (
    <div className={`card ${fill ? "flex flex-col" : ""} ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-line-soft">
          <div>
            {title && <h3 className="text-[14px] font-semibold text-ink">{title}</h3>}
            {subtitle && <p className="text-[12px] text-muted mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={`p-5 ${fill ? "flex-1" : ""} ${bodyClass}`}>{children}</div>
    </div>
  );
}

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "brand" | "success" | "danger" | "info" | "warn" }) {
  const map: Record<string, string> = {
    gray: "bg-line text-muted",
    brand: "bg-brand-soft text-brand-dark",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    info: "bg-info-soft text-info",
    warn: "bg-warn-soft text-warn",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${map[tone]}`}>{children}</span>;
}

export function LinkBtn({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "ghost" | "brand" }) {
  const cls = variant === "brand" ? "btn-brand" : variant === "ghost" ? "btn-ghost" : "btn-primary";
  return <Link href={href} className={`btn ${cls}`}>{children}</Link>;
}
