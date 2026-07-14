"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import {
  updateItemQuantityAction,
  updateOrderStatus,
} from "@/actions/customer-order.action";
import { Button } from "@/components/ui/button";

const stepStatuses = ["Placed", "Preparing", "Ready", "Served"];

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface OrderCardProps {
  id: string;
  time: string;
  initialStatus: string;
  items: OrderItem[];
  onRefresh?: () => void;
}

function normalizeOrderStatus(status: string) {
  const normalized = status.trim().toLowerCase();

  if (normalized === "placed") return "Placed";
  if (normalized === "preparing") return "Preparing";
  if (normalized === "ready") return "Ready";
  if (normalized === "served") return "Served";

  return status.trim();
}

function getOrderId(value: string) {
  return Number.parseInt(value.replace(/[^0-9]/g, ""), 10);
}

export default function OrderCard({
  id,
  time,
  initialStatus,
  items,
  onRefresh,
}: OrderCardProps) {
  const [optimisticStatus, setOptimisticStatus] = useState(normalizeOrderStatus(initialStatus));
  const [optimisticItems, setOptimisticItems] = useState(items);
  const [optimisticTotal, setOptimisticTotal] = useState(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingQuantity, setUpdatingQuantity] = useState(false);

  const activeStep = Math.max(0, stepStatuses.indexOf(optimisticStatus));
  const numericOrderId = getOrderId(id);
  const isBusy = updatingStatus || updatingQuantity;

  const handleStatusChange = async (nextStatus: string) => {
    if (!Number.isInteger(numericOrderId)) {
      setError("Invalid order.");
      return;
    }

    const previousStatus = optimisticStatus;
    setError(null);
    setOptimisticStatus(nextStatus);
    setUpdatingStatus(true);

    try {
      const result = await updateOrderStatus(numericOrderId, nextStatus);

      if (!result.success || !("status" in result)) {
        setOptimisticStatus(previousStatus);
        setError(result.error ?? "Unable to update order status.");
        return;
      }

      setOptimisticStatus(result.status ?? nextStatus);
      onRefresh?.();
    } catch {
      setOptimisticStatus(previousStatus);
      setError("Unable to update order status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleQuantityChange = async (item: OrderItem, nextQuantity: number) => {
    if (!Number.isInteger(numericOrderId)) {
      setError("Invalid order.");
      return;
    }

    setError(null);

    if (nextQuantity <= 0) {
      setOptimisticItems((previousItems) => previousItems.filter((currentItem) => currentItem.id !== item.id));
    } else {
      setOptimisticItems((previousItems) =>
        previousItems.map((currentItem) =>
          currentItem.id === item.id ? { ...currentItem, quantity: nextQuantity } : currentItem,
        ),
      );
    }

    setOptimisticTotal((previousTotal) => previousTotal + item.price * (nextQuantity - item.quantity));
    setUpdatingQuantity(true);

    try {
      const result = await updateItemQuantityAction(numericOrderId, item.id, nextQuantity);

      if (!result.success) {
        setError(result.error ?? "Unable to update item quantity.");
      }

      onRefresh?.();
    } catch {
      setError("Unable to update item quantity.");
    } finally {
      setUpdatingQuantity(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-slate-700">{time}</span>
          <span className="font-semibold text-slate-800">EUR {optimisticTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-b border-slate-100 px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase text-slate-400">Progress</span>
          <span className="text-sm font-semibold text-slate-700">
            {updatingStatus ? "Updating..." : optimisticStatus}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {stepStatuses.map((step, index) => (
            <button
              aria-pressed={step === optimisticStatus}
              className="group flex min-w-0 flex-col items-center gap-1 border-none bg-transparent p-0 text-center disabled:cursor-not-allowed"
              disabled={updatingStatus}
              key={step}
              onClick={() => handleStatusChange(step)}
              type="button"
            >
              <div className="flex w-full items-center">
                <div
                  className={`h-0.5 flex-1 ${
                    index === 0 ? "bg-transparent" : index <= activeStep ? "bg-blue-500" : "bg-slate-100"
                  }`}
                />
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    index <= activeStep
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                  }`}
                >
                  {index < activeStep ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
                </div>
                <div
                  className={`h-0.5 flex-1 ${
                    index === stepStatuses.length - 1
                      ? "bg-transparent"
                      : index < activeStep
                        ? "bg-blue-500"
                        : "bg-slate-100"
                  }`}
                />
              </div>
              <span className="w-full truncate text-[10px] font-medium uppercase text-slate-400">
                {step}
              </span>
            </button>
          ))}
        </div>

        {error ? <p className="mt-3 text-xs font-medium text-red-600">{error}</p> : null}
      </div>

      <div className="p-4">
        <div className="space-y-3">
          {optimisticItems.map((item) => (
            <div
              className="rounded-lg bg-slate-50 p-3"
              key={item.id}
            >
              <p className="break-words text-sm font-medium leading-5 text-slate-700">{item.name}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  <Button
                    className="h-7 w-7 rounded-full border-slate-300 bg-white"
                    disabled={isBusy}
                    onClick={() => handleQuantityChange(item, item.quantity - 1)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <span className="text-xs">-</span>
                  </Button>
                  <span className="w-7 text-center text-sm font-semibold text-slate-800">{item.quantity}</span>
                  <Button
                    className="h-7 w-7 rounded-full border-slate-300 bg-white"
                    disabled={isBusy}
                    onClick={() => handleQuantityChange(item, item.quantity + 1)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </div>
                <span className="whitespace-nowrap text-right text-sm font-semibold text-slate-700">
                  EUR {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
