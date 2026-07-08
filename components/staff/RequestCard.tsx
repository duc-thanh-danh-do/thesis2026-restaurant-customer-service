"use client";

import { useState, useTransition } from "react";
import { updateRequestStatus } from "@/actions/customer-request.action";
import { cn } from "@/lib/utils";
import { badgeVariants } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

interface RequestCardProps {
  id: string | number;
  text: string;
  time: string | Date;
  initialStatus: string;
  onRefresh?: () => void;
}

const STATUSES = ["Waiting", "In progress", "Resolved"];

export default function RequestCard({
  id,
  text,
  time,
  initialStatus,
  onRefresh,
}: RequestCardProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState(initialStatus);

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === optimisticStatus) return;
    const safeId = typeof id === "number" ? id : Number(id);
    if (!Number.isInteger(safeId) || safeId <= 0) return;

    setOptimisticStatus(newStatus);
    startTransition(async () => {
      const result = await updateRequestStatus(safeId, newStatus);
      if (!result.success) {
        setOptimisticStatus(initialStatus);
      } else {
        if (onRefresh) {
          onRefresh();
        }
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-slate-700">{text}</span>
        <span className="text-xs text-slate-400">
          {formatRelativeTime(time)}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {STATUSES.map((status) => {
          const isActive = status === optimisticStatus;
          const isWaiting = status === "Waiting";

          return (
            <button
              key={status}
              disabled={isPending}
              onClick={() => handleStatusChange(status)}
              className={cn(
                badgeVariants({ variant: isActive ? "default" : "secondary" }),
                "cursor-pointer transition-colors duration-200",
                !isActive && "text-slate-500 hover:bg-slate-200",

                isWaiting &&
                  isActive &&
                  "bg-red-500 hover:bg-red-600 text-white",

                isPending && "opacity-50 cursor-not-allowed"
              )}
            >
              {status}
            </button>
          );
        })}
      </div>
    </div>
  );
}
