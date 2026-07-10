"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, BookOpenText, Bot, ChartNoAxesCombined, ChevronDown, LayoutDashboard, Menu, Salad, Sparkles, X } from "lucide-react";

const mobileLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/instructions", label: "AI instructions", icon: Bot },
  { href: "/admin/knowledge", label: "Knowledge", icon: BookOpenText },
  { href: "/admin/menu", label: "Menu manager", icon: Salad },
  { href: "/admin/monitoring", label: "Monitoring", icon: ChartNoAxesCombined },
];

export function AdminHeader({ restaurantName, userName }: { restaurantName: string; userName: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button onClick={() => setMenuOpen(true)} className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:hidden" aria-label="Open navigation">
          <Menu className="size-5" />
        </button>
        <Link href="/admin" className="flex items-center gap-2 font-semibold text-[#142653] lg:hidden">
          <Sparkles className="size-5 text-[#438ed8]" /> Green Table
        </Link>
        <div className="hidden lg:block">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-slate-400">Restaurant workspace</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-800">{restaurantName}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button className="relative grid size-9 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Notifications">
          <Bell className="size-[18px]" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-white bg-amber-500" />
        </button>
        <button className="flex items-center gap-2 rounded-full border border-slate-200 py-1.5 pl-1.5 pr-2.5 hover:bg-slate-50" aria-label="Open profile menu">
          <span className="grid size-7 place-items-center rounded-full bg-[#142653] text-xs font-semibold text-white">{userName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-semibold text-slate-800">{userName}</span>
            <span className="block text-[0.65rem] text-slate-500">Administrator</span>
          </span>
          <ChevronDown className="hidden size-3.5 text-slate-400 sm:block" />
        </button>
      </div>
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/40" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />
          <div className="relative flex h-full w-72 flex-col bg-[#0f2147] p-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 font-semibold"><Sparkles className="size-5 text-blue-300" /> Green Table</Link>
              <button onClick={() => setMenuOpen(false)} className="grid size-9 place-items-center rounded-lg bg-white/10" aria-label="Close navigation"><X className="size-5" /></button>
            </div>
            <nav className="mt-5 space-y-1" aria-label="Mobile admin navigation">
              {mobileLinks.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white"><Icon className="size-[18px] text-slate-400" />{item.label}</Link>; })}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
