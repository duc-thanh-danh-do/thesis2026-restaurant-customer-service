"use client";

import { useState, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import {
  updateOrderStatus,
  updateItemQuantityAction,
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
  total: number;
  initialStatus: string;
  items: OrderItem[];
}

export default function OrderCard({
  id,
  time,
  total,
  initialStatus,
  items,
}: OrderCardProps) {
  const [optimisticStatus, setOptimisticStatus] = useState(initialStatus);
  const [optimisticItems, setOptimisticItems] = useState(items);
  const initialCalculatedTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const [optimisticTotal, setOptimisticTotal] = useState(
    initialCalculatedTotal
  );

  const [isPending, startTransition] = useTransition();

  const activeStep =
    stepStatuses.indexOf(optimisticStatus) >= 0
      ? stepStatuses.indexOf(optimisticStatus)
      : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-700">
            {id} · {time}
          </span>
          <span className="font-semibold text-slate-800">
            €{optimisticTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400 uppercase">
            Progress
          </span>
          <span className="text-sm font-medium text-slate-700">
            {optimisticStatus}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-1 w-full">
          {stepStatuses.map((step, i) => (
            <button
              key={step}
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  setOptimisticStatus(step);
                  const numericId = parseInt(id.replace(/[^0-9]/g, "")) || 1;
                  await updateOrderStatus(numericId, step);
                });
              }}
              className="flex-1 flex items-center group cursor-pointer border-none bg-transparent p-0 text-left"
            >
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors flex-shrink-0
                  ${
                    i <= activeStep
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                  }
                `}
              >
                {i < activeStep ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              {i < stepStatuses.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 ${
                    i < activeStep ? "bg-blue-500" : "bg-slate-100"
                  }`}
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-1">
          {stepStatuses.map((step) => (
            <span key={step} className="text-[10px] text-slate-400 uppercase">
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Items Section */}
      <div className="p-4">
        <div className="space-y-3">
          {optimisticItems.map((item, i) => (
            <div
              key={item.id || i}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {/* Minus*/}
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={isPending}
                    onClick={() => {
                      const newQuantity = item.quantity - 1;

                      if (newQuantity <= 0) {
                        setOptimisticItems((prev) =>
                          prev.filter((x) => x.id !== item.id)
                        );
                      } else {
                        setOptimisticItems((prev) =>
                          prev.map((x) =>
                            x.id === item.id
                              ? { ...x, quantity: newQuantity }
                              : x
                          )
                        );
                      }
                      setOptimisticTotal((prev) => prev - item.price);

                      startTransition(async () => {
                        const numericOrderId =
                          parseInt(id.replace(/[^0-9]/g, "")) || 1;
                        await updateItemQuantityAction(
                          numericOrderId,
                          item.id,
                          newQuantity
                        );
                      });
                    }}
                    className="h-6 w-6 rounded-full border-slate-300"
                  >
                    <span className="text-xs">-</span>
                  </Button>

                  <span className="w-6 text-center text-sm">
                    {item.quantity}
                  </span>

                  {/* plus */}
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={isPending}
                    onClick={() => {
                      const newQuantity = item.quantity + 1;

                      setOptimisticItems((prev) =>
                        prev.map((x) =>
                          x.id === item.id ? { ...x, quantity: newQuantity } : x
                        )
                      );
                      setOptimisticTotal((prev) => prev + item.price);

                      startTransition(async () => {
                        const numericOrderId =
                          parseInt(id.replace(/[^0-9]/g, "")) || 1;
                        await updateItemQuantityAction(
                          numericOrderId,
                          item.id,
                          newQuantity
                        );
                      });
                    }}
                    className="h-6 w-6 rounded-full border-slate-300"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-sm text-slate-700">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-slate-700">
                €{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
