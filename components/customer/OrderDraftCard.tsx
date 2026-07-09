"use client";

import Link from "next/link";
import { Check, Pencil } from "lucide-react";

export type CustomerOrderDraft = {
  id: number;
  status: string;
  total: number;
  createdAt: string | null;
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
};

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function OrderDraftCard({
  draft,
  editHref,
  onConfirm,
  className = "",
}: {
  draft: CustomerOrderDraft;
  editHref: string;
  onConfirm: (orderId: number) => void | Promise<void>;
  className?: string;
}) {
  const isUnconfirmed = draft.status === "unconfirmed";

  return (
    <div className={`overflow-hidden rounded-2xl border border-[#d5e1ec] bg-[#f5f9fc] ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-[#d5e1ec] bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[#142653]">Order draft</p>
          <p className="text-xs font-medium text-[#438ed8]">
            {formatStatus(draft.status)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
          Review
        </span>
      </div>

      <div className="space-y-2 px-4 py-3">
        {draft.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-3 text-sm">
            <span className="min-w-0 text-[#142653]">
              {item.quantity}x {item.name}
            </span>
            <span className="shrink-0 font-medium text-[#142653]">
              EUR {(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t border-[#d5e1ec] pt-3 text-sm">
          <span className="font-semibold text-[#142653]">Total</span>
          <span className="font-bold text-[#142653]">EUR {draft.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-[#d5e1ec] bg-white p-3">
        <button
          type="button"
          onClick={() => onConfirm(draft.id)}
          disabled={!isUnconfirmed}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#438ed8] px-3 py-2 text-sm font-medium text-white disabled:bg-green-100 disabled:text-green-700"
        >
          <Check className="h-4 w-4" />
          {isUnconfirmed ? "Confirm order" : "Confirmed"}
        </button>
        <Link
          href={editHref}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d5e1ec] px-3 py-2 text-sm font-medium text-[#142653] hover:bg-[#f5f9fc]"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
      </div>
    </div>
  );
}
