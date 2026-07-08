"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CustomerBottomNav,
  CustomerMobileHeader,
  CustomerMobileLayout,
} from "@/components/layout/CustomerMobileLayout";
import type { CustomerMenuItem } from "./page";

const cartStorageKey = "bistro-demo-cart";

function getInitialCart() {
  if (typeof window !== "undefined") {
    const savedCart = window.localStorage.getItem(cartStorageKey);
    if (savedCart) {
      return JSON.parse(savedCart) as Record<string, number>;
    }
  }

  return {};
}

export default function CustomerTableMenu({
  menuItems,
  restaurantName,
  tableNumber,
}: {
  menuItems: CustomerMenuItem[];
  restaurantName: string;
  tableNumber: string;
}) {
  const params = useParams<{ qrToken: string }>();
  const basePath = `/table/${params.qrToken}`;
  const [selectedCategory, setSelectedCategory] = useState(
    menuItems[0]?.category ?? "Other",
  );
  const [cart, setCart] = useState<Record<string, number>>(getInitialCart);

  useEffect(() => {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }, [cart]);

  const categories = useMemo(
    () => Array.from(new Set(menuItems.map((item) => item.category))),
    [menuItems],
  );
  const filteredItems = menuItems.filter(
    (item) => item.category === selectedCategory
  );
  const cartCount = Object.values(cart).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  const addToCart = (itemId: string) => {
    setCart((current) => ({
      ...current,
      [itemId]: (current[itemId] ?? 0) + 1,
    }));
  };

  return (
    <CustomerMobileLayout>
      <CustomerMobileHeader
        title={`${restaurantName} - Table ${tableNumber}`}
        subtitle="Tap dishes to build your order."
        rightElement={
          <select
            aria-label="Select menu category"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="rounded-full border border-[#d5e1ec] bg-[#f5f9fc] px-4 py-2 text-sm font-medium text-[#142653] outline-none"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-4">
        <div className="w-full space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                  selectedCategory === category
                    ? "border-[#142653] bg-[#142653] text-white"
                    : "border-[#d5e1ec] bg-white text-[#142653]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="flex gap-4 rounded-[20px] border border-[#d5e1ec] bg-white p-4"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#f5f9fc]">
                  <svg
                    className="h-8 w-8 text-[#438ed8]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                    <path d="M7 2v20" />
                    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-[#142653]">
                      {item.name}
                    </h3>
                    <span className="shrink-0 text-sm font-medium text-[#142653]">
                      EUR {item.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-gray-500">
                    {item.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      // ...item.tags.map((tag) => ({ kind: 'tag', label: tag })),
                      ...(item.dietary
                        ? item.dietary.map((tag: string) => ({
                            kind: "tag",
                            label: tag,
                          }))
                        : []),
                      ...item.allergens.map((allergen: string) => ({
                        kind: "allergen",
                        label: allergen,
                      })),
                    ].map((chip) => (
                      <span
                        key={`${chip.kind}-${chip.label}`}
                        className="rounded-full bg-[#f5f9fc] px-2 py-0.5 text-[10px] font-medium text-[#438ed8]"
                      >
                        {chip.label}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => addToCart(item.id)}
                    className="mt-4 rounded-full bg-[#142653] px-4 py-2 text-sm font-medium text-white"
                  >
                    + Add{cart[item.id] ? ` (${cart[item.id]})` : ""}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#d5e1ec] bg-white px-4 py-3 text-center">
        <Link
          href={`${basePath}/chat`}
          className="inline-flex rounded-full bg-[#438ed8] px-5 py-2.5 text-sm font-medium text-white shadow-sm"
        >
          Ask AI
        </Link>
      </div>

      <CustomerBottomNav
        activeTab="menu"
        basePath={basePath}
        cartCount={cartCount > 0 ? cartCount : undefined}
        orderCount={1}
      />
    </CustomerMobileLayout>
  );
}
