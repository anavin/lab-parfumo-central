"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ClipboardList, Truck, Receipt, Package, FlaskConical, Wallet, Users, LogOut,
  ScrollText, Trash2, Menu, X,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import type { User } from "@/lib/auth/constants";

type Item = { href: string; label: string; icon: any };
const GROUPS: { title: string; items: Item[]; adminOnly?: boolean }[] = [
  { title: "ภาพรวม", items: [{ href: "/", label: "แดชบอร์ด", icon: LayoutDashboard }] },
  { title: "ปฏิบัติการ", items: [
    { href: "/requisitions", label: "ใบเบิกสินค้า", icon: ClipboardList },
    { href: "/shipments", label: "ส่ง / คืนสินค้า", icon: Truck },
    { href: "/sales", label: "การขาย", icon: Receipt },
  ]},
  { title: "คลัง & การเงิน", items: [
    { href: "/stock", label: "สต๊อกคงเหลือ", icon: Package },
    { href: "/products", label: "สินค้า", icon: FlaskConical },
    { href: "/cash", label: "เงินสด", icon: Wallet },
  ]},
  { title: "ผู้ดูแล", adminOnly: true, items: [
    { href: "/users", label: "จัดการผู้ใช้", icon: Users },
    { href: "/audit", label: "บันทึกกิจกรรม", icon: ScrollText },
    { href: "/trash", label: "ถังขยะ", icon: Trash2 },
  ]},
];

export function Sidebar({ user }: { user: User }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

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
        {GROUPS.filter((g) => !g.adminOnly || user.role === "admin").map((g) => (
          <div key={g.title}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">{g.title}</div>
            <div className="space-y-0.5">
              {g.items.map((n) => {
                const on = active(n.href);
                const Icon = n.icon;
                return (
                  <Link key={n.href} href={n.href}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] transition-colors ${
                      on ? "bg-white/[0.09] text-white font-medium" : "text-white/70 hover:bg-white/[0.05] hover:text-white"}`}>
                    <Icon className={`w-[18px] h-[18px] ${on ? "text-brand" : "text-white/45 group-hover:text-white/70"}`} strokeWidth={2} />
                    <span>{n.label}</span>
                    {on && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" />}
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
            <div className="text-[10.5px] text-white/40 truncate">{user.role === "admin" ? "ผู้ดูแลระบบ" : "พนักงาน"} · @{user.username}</div>
          </div>
        </div>
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
