"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { toggleMenuItemAvailabilityAction } from "@/actions/menu-item.action";

export function AvailabilityToggle({ itemId, initial, label }: { itemId: number; initial: boolean; label: string }) {
  const [available, setAvailable] = useState(initial);
  const [isPending, setIsPending] = useState(false);

  const toggle = async () => {
    const previous = available;
    setIsPending(true);
    try {
      const result = await toggleMenuItemAvailabilityAction(itemId, previous);
      if (result.success) setAvailable(!previous);
    } finally {
      setIsPending(false);
    }
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={available}
      aria-label={`Set ${label} ${available ? "unavailable" : "available"}`}
      onClick={toggle}
      disabled={isPending}
      className="inline-flex min-w-28 items-center gap-2 rounded-lg py-1 text-sm font-medium text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-[#438ed8]/40 disabled:opacity-60"
    >
      <span className={cn("relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors", available ? "bg-emerald-500" : "bg-slate-300")}>
        <span className={cn("absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform", available ? "translate-x-4" : "translate-x-0")} />
      </span>
      <span className={available ? "text-emerald-700" : "text-slate-500"}>{available ? "Available" : "Unavailable"}</span>
    </button>
  );
}
