"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  Bot,
  ChartNoAxesCombined,
  ChevronRight,
  LayoutDashboard,
  Salad,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Workspace",
    links: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/instructions", label: "AI instructions", icon: Bot },
      { href: "/admin/knowledge", label: "Knowledge", icon: BookOpenText },
      { href: "/admin/menu", label: "Menu manager", icon: Salad },
    ],
  },
  {
    label: "Insights",
    links: [
      { href: "/admin/monitoring", label: "Monitoring", icon: ChartNoAxesCombined },
    ],
  },
];

export function AdminNav({ publishedVersion }: { publishedVersion: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-64 overflow-y-auto border-r border-white/10 bg-[#0f2147] text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-6 py-6">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#438ed8] shadow-lg shadow-blue-950/25">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-semibold tracking-tight">Green Table</span>
            <span className="block text-xs text-slate-300">Restaurant admin</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-7 px-4 py-6" aria-label="Admin navigation">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.links.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href.split("#")[0]);
                const Icon = item.icon;
                return (
                  <Link
                    href={item.href}
                    key={item.label}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-white text-[#142653] shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <Icon className={cn("size-[18px]", active ? "text-[#438ed8]" : "text-slate-400 group-hover:text-white")} />
                    <span className="flex-1">{item.label}</span>
                    {active ? <ChevronRight className="size-4 text-slate-400" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold">Production healthy</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
          <span className="size-2 rounded-full bg-emerald-400" />
          AI version {publishedVersion} is live
        </div>
      </div>
    </aside>
  );
}
