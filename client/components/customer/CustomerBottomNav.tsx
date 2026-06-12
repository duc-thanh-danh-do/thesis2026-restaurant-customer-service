"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Menu",
    href: "/customer",
  },
  {
    label: "Cart",
    href: "/customer/cart",
  },
  {
    label: "Orders",
    href: "/customer/orders",
  },
];

export default function CustomerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 px-4 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] backdrop-blur">
      <div className="mx-auto grid w-full max-w-md grid-cols-3 gap-2 sm:max-w-lg">
        {navItems.map((item) => {
          const isActive =
            item.href === "/customer"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-3 py-2 text-center text-sm font-medium transition ${
                isActive
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
