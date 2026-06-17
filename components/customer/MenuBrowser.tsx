"use client";

import { useEffect, useMemo, useState } from "react";
import MenuItemCard from "@/components/customer/MenuItemCard";
import type { MenuItemDto } from "@/types/menu-item";

export default function MenuBrowser({ restaurantId }: { restaurantId: number }) {
  const [items, setItems] = useState<MenuItemDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMenu() {
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}/menu-items`);
        if (!response.ok) throw new Error("Failed to load menu");
        const payload = (await response.json()) as { menuItems: MenuItemDto[] };
        setItems(payload.menuItems);
      } catch (menuError) {
        setError(menuError instanceof Error ? menuError.message : "Failed to load menu");
      }
    }

    loadMenu();
  }, [restaurantId]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category ?? "Other"))),
    [items],
  );

  if (error) return <div className="text-sm text-red-700">{error}</div>;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-neutral-500">Welcome to</p>
        <h1 className="mt-1 text-3xl font-bold">TestPizza</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Browse the menu and check ingredients before asking the assistant for help.
        </p>
      </header>

      {categories.map((category) => (
        <section key={category}>
          <h2 className="mb-3 text-lg font-semibold">{category}</h2>
          <div className="grid gap-3">
            {items
              .filter((item) => (item.category ?? "Other") === category)
              .map((item) => (
                <MenuItemCard item={item} key={item.id} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
