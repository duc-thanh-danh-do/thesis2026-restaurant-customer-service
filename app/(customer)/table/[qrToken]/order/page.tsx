"use client";

import { useEffect, useMemo, useState } from "react";
import { useCallback } from "react";
import { useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check } from "lucide-react";
import {
  CustomerBottomNav,
  CustomerMobileHeader,
  CustomerMobileLayout,
} from "@/components/layout/CustomerMobileLayout";

const cartStorageKey = "bistro-demo-cart";
const orderSteps = ["Placed", "Preparing", "Ready", "Served"];

type CustomerOrder = {
  id: number;
  status: string;
  total: number;
  createdAt: string | null;
  tableNumber: string;
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
};

function getInitialCartCount() {
  if (typeof window === "undefined") return 0;

  const savedCart = window.localStorage.getItem(cartStorageKey);
  if (!savedCart) return 0;

  const cart = JSON.parse(savedCart) as Record<string, number>;
  return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
}

function getSavedSessionToken() {
  if (typeof window === "undefined") return null;

  return window.localStorage.getItem("dining-session-token");
}

function formatOrderStatus(status: string) {
  const formattedStatus = status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const normalized = formattedStatus.toLowerCase();

  if (normalized === "placed") return "Placed";
  if (normalized === "preparing") return "Preparing";
  if (normalized === "ready") return "Ready";
  if (normalized === "served") return "Served";

  return formattedStatus;
}

function orderStepIndex(status: string) {
  return Math.max(0, orderSteps.indexOf(formatOrderStatus(status)));
}

export default function OrderPage() {
  const params = useParams<{ qrToken: string }>();
  const router = useRouter();
  const basePath = `/table/${params.qrToken}`;
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [tableNumber, setTableNumber] = useState("");
  const [cartCount] = useState(getInitialCartCount);
  const loadOrdersInFlightRef = useRef(false);
  const loadOrdersAbortRef = useRef<AbortController | null>(null);

  const loadOrders = useCallback(async () => {
    if (loadOrdersInFlightRef.current) return;

    const abortController = new AbortController();
    loadOrdersInFlightRef.current = true;
    loadOrdersAbortRef.current?.abort();
    loadOrdersAbortRef.current = abortController;

    const sessionToken = getSavedSessionToken();
    const searchParams = new URLSearchParams({
      qrToken: params.qrToken,
    });

    if (sessionToken) {
      searchParams.set("sessionToken", sessionToken);
    }

    try {
      const response = await fetch(
        `/api/customer-orders?${searchParams.toString()}`,
        {
          cache: "no-store",
          signal: abortController.signal,
        },
      );

      if (!response.ok) return;

      const payload = (await response.json()) as {
        tableNumber: string;
        orders: CustomerOrder[];
      };

      setTableNumber(payload.tableNumber);
      setOrders(payload.orders);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        throw error;
      }
    } finally {
      if (loadOrdersAbortRef.current === abortController) {
        loadOrdersAbortRef.current = null;
      }
      loadOrdersInFlightRef.current = false;
    }
  }, [params.qrToken]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOrders();
    }, 0);
    const intervalId = window.setInterval(() => {
      void loadOrders();
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      loadOrdersAbortRef.current?.abort();
    };
  }, [loadOrders]);

  const tableTotal = useMemo(
    () => orders.reduce((sum, order) => sum + order.total, 0),
    [orders],
  );

  return (
    <CustomerMobileLayout>
      <CustomerMobileHeader
        title={`Your order - Table ${tableNumber}`.trim()}
        subtitle="Status updates automatically - no refresh needed."
        rightElement={
          <button
            onClick={() => router.push(`${basePath}/menu`)}
            className="shrink-0 rounded-full bg-[#142653] px-3 py-1.5 text-xs font-medium text-white"
          >
            Add more
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 pb-28">
        <div className="w-full">
          {orders.map((order) => (
            <div
              key={order.id}
              className="mb-4 rounded-[20px] border border-[#d5e1ec] bg-white p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#142653]">
                    ORDER #{order.id}
                  </span>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Placed{" "}
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "just now"}
                  </p>
                </div>
                <span className="shrink-0 text-lg font-bold text-[#142653]">
                  EUR {order.total.toFixed(2)}
                </span>
              </div>

              <div className="mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  PROGRESS
                </span>
                <p className="mt-1 text-sm font-medium text-[#438ed8]">
                  {formatOrderStatus(order.status)}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  {orderSteps.map((step, index) => {
                    const activeIndex = orderStepIndex(order.status);
                    const isComplete = index < activeIndex;
                    const isActive = index === activeIndex;

                    return (
                      <div className="contents" key={step}>
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            index <= activeIndex
                              ? "bg-[#438ed8] text-white"
                              : "border-2 border-[#d5e1ec] bg-white text-[#8aa0b6]"
                          }`}
                        >
                          {isComplete ? (
                            <Check className="h-4 w-4" />
                          ) : isActive ? (
                            <span className="h-3 w-3 rounded-full bg-current"></span>
                          ) : null}
                        </div>
                        {index < orderSteps.length - 1 ? (
                          <div
                            className={`h-1 flex-1 ${index < activeIndex ? "bg-[#438ed8]" : "bg-[#d5e1ec]"}`}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 text-[#142653]">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="shrink-0 text-[#142653]">
                      EUR {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-[20px] bg-white p-4">
            <span className="font-medium text-[#142653]">Table total</span>
            <span className="font-bold text-[#142653]">
              EUR {tableTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <Link
        href={`${basePath}/chat`}
        className="fixed bottom-22 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#438ed8] px-5 py-2.5 text-sm font-medium text-white shadow-lg"
      >
        Ask AI
      </Link>

      <CustomerBottomNav
        activeTab="order"
        basePath={basePath}
        cartCount={cartCount > 0 ? cartCount : undefined}
        orderCount={1}
      />
    </CustomerMobileLayout>
  );
}
