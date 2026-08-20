"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ClipboardList, Truck, Receipt, Package, FlaskConical, Wallet, Users, LogOut,
  ScrollText, Trash2, Menu, X, ClipboardCheck, Store, Barcode, Boxes, ListChecks, FileUp, PackageCheck,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { User } from "@/lib/auth/constants";
import { effectivePermissions, ROLE_LABEL, type PermKey } from "@/lib/auth/permissions";

type Item = { href: string; label: string; icon: any; badge?: number };
type Group = { title: string; items: Item[] };

// One icon per permission key; groups mirror PERMISSIONS[].group.
const ICON: Record<PermKey, any> = {
  dashboard: LayoutDashboard, requisitions: ClipboardList, shipments: Truck, sales: Receipt,
  stock: Package, products: FlaskConical, cash: Wallet, review: ClipboardCheck,
  users: Users, audit: ScrollText, trash: Trash2, my_sales: Store,
};
const MENU: { title: string; items: { key: PermKey; href: string; label: string; icon?: any }[] }[] = [
  { title: "ภาพรวม", items: [
    { key: "dashboard", href: "/", label: "แดชบอร์ด" },
    { key: "review", href: "/review", label: "ตรวจสอบยอดขาย" },
  ]},
  { title: "ปฏิบัติการ", items: [
    { key: "requisitions", href: "/requisitions", label: "ใบเบิกสินค้า" },
    { key: "shipments", href: "/shipments", label: "ส่ง / คืนสินค้า" },
    { key: "sales", href: "/sales", label: "การขาย" },
  ]},
  { title: "คลัง & การเงิน", items: [
    { key: "stock", href: "/stock", label: "สต๊อกคงเหลือ" },
    { key: "requisitions", href: "/stock/import", label: "นำเข้าสต๊อก CTW", icon: FileUp },
    { key: "requisitions", href: "/stock/counts", label: "ตรวจนับสต๊อก", icon: ListChecks },
    { key: "products", href: "/products", label: "สินค้า" },
    { key: "products", href: "/products/barcodes", label: "พิมพ์บาร์โค้ด", icon: Barcode },
    { key: "cash", href: "/cash", label: "เงินสด" },
  ]},
  { title: "ผู้ดูแล", items: [
    { key: "users", href: "/users", label: "จัดการผู้ใช้" },
    { key: "audit", href: "/audit", label: "บันทึกกิจกรรม" },
    { key: "trash", href: "/trash", label: "ถังขยะ" },
  ]},
  { title: "พนักงานขาย", items: [
    { key: "my_sales", href: "/my", label: "ยอดขายของฉัน" },
    { key: "my_sales", href: "/my/stock", label: "สต๊อกสาขา", icon: Boxes },
    { key: "my_sales", href: "/my/receive", label: "รับสินค้า", icon: PackageCheck },
    { key: "my_sales", href: "/my/count", label: "นับสต๊อก", icon: ClipboardCheck },
  ]},
];

function groupsFor(user: User, pending: number): Group[] {
  const allowed = new Set(effectivePermissions(user));
  return MENU.map((g) => ({
    title: g.title,
    items: g.items.filter((it) => allowed.has(it.key)).map((it) => ({
      href: it.href, label: it.label, icon: it.icon ?? ICON[it.key],
      badge: it.key === "review" ? pending : undefined,
    })),
  })).filter((g) => g.items.length > 0);
}

export function Sidebar({ user, pending = 0 }: { user: User; pending?: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const groups = groupsFor(user, pending);
  // A route can match several menu hrefs (e.g. /products/barcodes matches both /products and
  // /products/barcodes). Only the MOST SPECIFIC (longest) match should light up, so a child
  // page doesn't also highlight its parent menu item.
  const matches = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  const bestMatch = groups.flatMap((g) => g.items.map((i) => i.href)).filter(matches).sort((a, b) => b.length - a.length)[0];
  const active = (href: string) => href === bestMatch;

  // close the mobile drawer whenever the route changes
  useEffect(() => { setOpen(false); }, [path]);
  // lock body scroll while the drawer is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const Panel = (
    <>
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/[0.07]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white font-bold shadow-sm">LP</div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-white leading-tight">Lab Parfumo</div>
          <div className="text-[11px] text-brand">centralwOrld</div>
        </div>
        <button onClick={() => setOpen(false)}
          className="lg:hidden ml-auto -mr-1 p-1.5 rounded-lg text-white/60 hover:bg-white/[0.06] hover:text-white" aria-label="ปิดเมนู">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">{g.title}</div>
            <div className="space-y-0.5">
              {g.items.map((n) => {
                const on = active(n.href);
                const Icon = n.icon;
                return (
                  <Link key={n.href} href={n.href} prefetch={false}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] transition-colors ${
                      on ? "bg-white/[0.09] text-white font-medium" : "text-white/70 hover:bg-white/[0.05] hover:text-white"}`}>
                    <Icon className={`w-[18px] h-[18px] ${on ? "text-brand" : "text-white/45 group-hover:text-white/70"}`} strokeWidth={2} />
                    <span>{n.label}</span>
                    {n.badge ? (
                      <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[11px] font-bold flex items-center justify-center">{n.badge}</span>
                    ) : on ? <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.07] p-3">
        <div className="flex items-center gap-2.5 px-2 pb-2">
          <div className="w-8 h-8 rounded-full bg-brand/25 text-brand flex items-center justify-center text-[13px] font-bold uppercase">
            {user.full_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] text-white font-medium truncate">{user.full_name}</div>
            <div className="text-[10.5px] text-white/40 truncate">{ROLE_LABEL[user.role] ?? user.role} · @{user.username}</div>
          </div>
        </div>
        <ThemeToggle className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/55 hover:bg-white/[0.05] hover:text-white/80 transition-colors" />
        <form action={signOut}>
          <button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/55 hover:bg-white/[0.05] hover:text-white/80 transition-colors">
            <LogOut className="w-[18px] h-[18px]" strokeWidth={2} /> ออกจากระบบ
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="no-print lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-nav text-white flex items-center gap-3 px-4 shadow-sm">
        <button onClick={() => setOpen(true)} className="-ml-1 p-1.5 rounded-lg text-white/80 hover:bg-white/[0.08]" aria-label="เปิดเมนู">
          <Menu className="w-6 h-6" />
        </button>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white text-[12px] font-bold">LP</div>
        <span className="text-[15px] font-semibold">Lab Parfumo</span>
      </header>

      {/* Mobile drawer + backdrop */}
      <div className={`no-print lg:hidden fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
        <div onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute left-0 top-0 h-full w-64 max-w-[82%] bg-nav text-white/85 flex flex-col shadow-xl transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          {Panel}
        </aside>
      </div>

      {/* Desktop static sidebar */}
      <aside className="no-print hidden lg:flex w-60 shrink-0 bg-nav text-white/85 flex-col sticky top-0 h-screen">
        {Panel}
      </aside>
    </>
  );
}
