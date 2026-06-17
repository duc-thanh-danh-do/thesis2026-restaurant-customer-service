import Link from "next/link";
import { Bot, ClipboardList, LayoutDashboard, Menu, QrCode, Settings, Users } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sessions", label: "Sessions", icon: Users },
  { href: "/requests", label: "Requests", icon: ClipboardList },
  { href: "/tables", label: "Tables", icon: QrCode },
  { href: "/menu", label: "Menu", icon: Menu },
  { href: "/ai-logs", label: "AI logs", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function StaffSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-[#0f2147] p-5 text-white lg:block">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase text-slate-300">Staff Dashboard</p>
        <h1 className="mt-1 text-xl font-bold">TestPizza</h1>
      </div>
      <nav className="grid gap-1">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
              href={item.href}
              key={item.href}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
