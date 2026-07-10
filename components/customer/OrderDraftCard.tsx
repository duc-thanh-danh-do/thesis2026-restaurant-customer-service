"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus, Pencil, Plus, Trash2, Utensils } from "lucide-react";

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
  onUpdateItemQuantity,
  className = "",
}: {
  draft: CustomerOrderDraft;
  editHref: string;
  onConfirm: (orderId: number) => void | Promise<void>;
  onUpdateItemQuantity?: (
    orderId: number,
    itemId: number,
    quantity: number,
  ) => void | Promise<void>;
  className?: string;
}) {
  const isUnconfirmed = draft.status === "unconfirmed";
  const [isEditing, setIsEditing] = useState(false);
  const canEdit = isUnconfirmed && Boolean(onUpdateItemQuantity);

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

      <div className="space-y-3 px-4 py-3">
        {draft.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="text-[#142653]">
                {item.quantity}x {item.name}
              </p>
              <p className="text-xs text-gray-500">EUR {item.price.toFixed(2)} each</p>
            </div>
            {isEditing && canEdit ? (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label={`Decrease ${item.name}`}
                  onClick={() => onUpdateItemQuantity?.(draft.id, item.id, item.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d5e1ec] bg-white text-[#142653] hover:bg-[#f5f9fc]"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-7 text-center font-semibold text-[#142653]">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  aria-label={`Increase ${item.name}`}
                  onClick={() => onUpdateItemQuantity?.(draft.id, item.id, item.quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d5e1ec] bg-white text-[#142653] hover:bg-[#f5f9fc]"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => onUpdateItemQuantity?.(draft.id, item.id, 0)}
                  className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <span className="shrink-0 font-medium text-[#142653]">
                EUR {(item.price * item.quantity).toFixed(2)}
              </span>
            )}
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t border-[#d5e1ec] pt-3 text-sm">
          <span className="font-semibold text-[#142653]">Total</span>
          <span className="font-bold text-[#142653]">EUR {draft.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-2 border-t border-[#d5e1ec] bg-white p-3">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={editHref}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d5e1ec] px-3 py-2 text-sm font-medium text-[#142653] hover:bg-[#f5f9fc]"
          >
            <Utensils className="h-4 w-4" />
            Browse menu
          </Link>
          <button
            type="button"
            onClick={() => setIsEditing((current) => !current)}
            disabled={!canEdit}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d5e1ec] px-3 py-2 text-sm font-medium text-[#142653] hover:bg-[#f5f9fc] disabled:opacity-50"
          >
            <Pencil className="h-4 w-4" />
            {isEditing ? "Done" : "Edit items"}
          </button>
        </div>
        {isEditing && canEdit && draft.items.length === 0 ? (
          <p className="rounded-xl bg-[#f5f9fc] px-3 py-2 text-center text-xs text-gray-500">
            Your draft is empty. Browse the menu to add dishes.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => onConfirm(draft.id)}
          disabled={!isUnconfirmed || draft.items.length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#438ed8] px-3 py-2.5 text-sm font-medium text-white disabled:bg-green-100 disabled:text-green-700"
        >
          <Check className="h-4 w-4" />
          {isUnconfirmed ? "Confirm order" : "Confirmed"}
        </button>
      </div>
    </div>
  );
}
