import Link from "next/link";
import { MessageCircle, Menu, ClipboardList } from "lucide-react";

export default function CustomerBottomBar({ sessionToken }: { sessionToken: string }) {
  const links = [
    { href: `/session/${sessionToken}`, label: "Chat", icon: MessageCircle },
    { href: `/session/${sessionToken}/menu`, label: "Menu", icon: Menu },
    { href: `/session/${sessionToken}/requests`, label: "Requests", icon: ClipboardList },
  ];

  return (
    <nav className="sticky bottom-0 grid grid-cols-3 border-t border-neutral-200 bg-white">
      {links.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-neutral-600"
            href={item.href}
            key={item.href}
          >
            <Icon aria-hidden="true" className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
