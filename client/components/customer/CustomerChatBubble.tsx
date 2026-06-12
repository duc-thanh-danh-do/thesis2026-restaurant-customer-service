"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CustomerChatButton() {
  const pathname = usePathname();

  if (pathname === "/customer/chat") {
    return null;
  }

  return (
    <Link
      href="/customer/chat"
      className="fixed bottom-24 right-4 z-40 rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white shadow-xl"
    >
      AI Chat
    </Link>
  );
}
