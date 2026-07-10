'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Minus, Plus } from 'lucide-react';
import { CustomerBottomNav, CustomerMobileHeader, CustomerMobileLayout } from '@/components/layout/CustomerMobileLayout';
import type { CustomerCartMenuItem } from './page';
import {
  getCartStorageKey,
  getSessionStorageKey,
  parseStoredCart,
} from '@/lib/customer-storage';

function getInitialCart(qrToken: string) {
  if (typeof window !== 'undefined') {
    return parseStoredCart(window.localStorage.getItem(getCartStorageKey(qrToken)));
  }

  return {};
}

export default function CustomerTableCart({
  menuItems,
  tableNumber,
}: {
  menuItems: CustomerCartMenuItem[];
  tableNumber: string;
}) {
  const params = useParams<{ qrToken: string }>();
  const router = useRouter();
  const basePath = `/table/${params.qrToken}`;
  const cartStorageKey = getCartStorageKey(params.qrToken);
  const sessionStorageKey = getSessionStorageKey(params.qrToken);
  const [cart, setCart] = useState<Record<string, number>>(() =>
    getInitialCart(params.qrToken),
  );

  useEffect(() => {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }, [cart, cartStorageKey]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([itemId, quantity]) => ({
          item: menuItems.find((menuItem) => menuItem.id === itemId),
          quantity,
        }))
        .filter((entry): entry is { item: CustomerCartMenuItem; quantity: number } => Boolean(entry.item) && entry.quantity > 0),
    [cart, menuItems],
  );

  const subtotal = cartItems.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);
  const cartCount = cartItems.reduce((sum, entry) => sum + entry.quantity, 0);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    setCart((current) => {
      const next = { ...current };
      if (newQuantity <= 0) {
        delete next[itemId];
      } else {
        next[itemId] = newQuantity;
      }
      return next;
    });
  };

  const clearCart = () => setCart({});

  const addToOrder = async () => {
    if (cartCount === 0) return;

    const response = await fetch('/api/customer-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrToken: params.qrToken,
        sessionToken: window.localStorage.getItem(sessionStorageKey),
        items: cart,
      }),
    });

    if (!response.ok) return;

    const payload = (await response.json()) as {
      order: { id: number };
      sessionToken: string;
    };

    window.localStorage.setItem(sessionStorageKey, payload.sessionToken);
    setCart({});
    router.push(`${basePath}/order`);
  };

  return (
    <CustomerMobileLayout>
      <CustomerMobileHeader title="Your table cart" subtitle={`Table ${tableNumber} - shared with everyone seated here.`} />

      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-4">
        <div className="w-full">
          {cartItems.length === 0 ? (
            <div className="rounded-[20px] border border-[#d5e1ec] bg-white p-8 text-center">
              <h2 className="text-lg font-semibold text-[#142653]">Your cart is empty</h2>
              <p className="mt-2 text-sm text-gray-500">Add dishes from the menu when you are ready.</p>
              <button
                onClick={() => router.push(`${basePath}/menu`)}
                className="mt-5 rounded-full bg-[#142653] px-5 py-2.5 text-sm font-medium text-white"
              >
                Browse menu
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 space-y-3">
                {cartItems.map(({ item, quantity }) => (
                  <div key={item.id} className="flex flex-col gap-3 rounded-[20px] border border-[#d5e1ec] bg-white p-4 sm:flex-row sm:items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#438ed8]">
                      <span className="text-sm font-bold text-white">{item.name.slice(0, 2).toUpperCase()}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="mb-0.5 font-semibold text-[#142653]">{item.name}</h3>
                      <p className="text-sm text-gray-500">EUR {item.price.toFixed(2)} each</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d5e1ec] hover:bg-[#f5f9fc]"
                      >
                        <Minus className="h-4 w-4 text-gray-600" />
                      </button>
                      <span className="w-8 text-center font-medium text-[#142653]">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d5e1ec] hover:bg-[#f5f9fc]"
                      >
                        <Plus className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-6 flex items-center justify-between rounded-[20px] border border-[#d5e1ec] bg-white p-4">
                <span className="font-medium text-[#142653]">Subtotal</span>
                <span className="font-semibold text-[#142653]">EUR {subtotal.toFixed(2)}</span>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={clearCart}
                  className="w-full rounded-full border border-[#d5e1ec] px-4 py-3 text-sm font-medium text-[#142653] hover:bg-[#f5f9fc]"
                >
                  Clear
                </button>
                <button
                  onClick={addToOrder}
                  className="w-full rounded-full bg-[#438ed8] px-4 py-3 text-sm font-medium text-white hover:bg-[#3a7bc8]"
                >
                  Add to active order
                </button>
              </div>
            </>
          )}
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

      <CustomerBottomNav activeTab="cart" basePath={basePath} cartCount={cartCount > 0 ? cartCount : undefined} />
    </CustomerMobileLayout>
  );
}
