'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { CustomerBottomNav, CustomerMobileHeader, CustomerMobileLayout } from '@/components/layout/CustomerMobileLayout';

const cartStorageKey = 'bistro-demo-cart';

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
  if (typeof window === 'undefined') return 0;

  const savedCart = window.localStorage.getItem(cartStorageKey);
  if (!savedCart) return 0;

  const cart = JSON.parse(savedCart) as Record<string, number>;
  return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
}

function getSavedSessionToken() {
  if (typeof window === 'undefined') return null;

  return window.localStorage.getItem('dining-session-token');
}

function formatOrderStatus(status: string) {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function OrderPage() {
  const params = useParams<{ qrToken: string }>();
  const router = useRouter();
  const basePath = `/table/${params.qrToken}`;
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [cartCount] = useState(getInitialCartCount);

  useEffect(() => {
    const sessionToken = getSavedSessionToken();

    async function loadOrders() {
      const searchParams = new URLSearchParams({
        qrToken: params.qrToken,
      });

      if (sessionToken) {
        searchParams.set('sessionToken', sessionToken);
      }

      const response = await fetch(`/api/customer-orders?${searchParams.toString()}`);
      if (!response.ok) return;

      const payload = (await response.json()) as {
        tableNumber: string;
        orders: CustomerOrder[];
      };

      setTableNumber(payload.tableNumber);
      setOrders(payload.orders);
    }

    loadOrders();
  }, [params.qrToken]);

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

      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-4">
        <div className="w-full">
          {orders.map((order) => (
            <div key={order.id} className="mb-4 rounded-[20px] border border-[#d5e1ec] bg-white p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#142653]">ORDER #{order.id}</span>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Placed {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}
                  </p>
                </div>
                <span className="shrink-0 text-lg font-bold text-[#142653]">EUR {order.total.toFixed(2)}</span>
              </div>

              <div className="mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">PROGRESS</span>
                <p className="mt-1 text-sm font-medium text-[#438ed8]">{formatOrderStatus(order.status)}</p>

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#438ed8]">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div className="h-1 flex-1 bg-[#438ed8]" />
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#438ed8]">
                    <span className="h-3 w-3 rounded-full bg-white"></span>
                  </div>
                  <div className="h-1 flex-1 bg-[#d5e1ec]" />
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#d5e1ec] bg-white"></div>
                  <div className="h-1 flex-1 bg-[#d5e1ec]" />
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#d5e1ec] bg-white"></div>
                </div>
              </div>

              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <span className="min-w-0 text-[#142653]">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="shrink-0 text-[#142653]">EUR {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-[20px] bg-white p-4">
            <span className="font-medium text-[#142653]">Table total</span>
            <span className="font-bold text-[#142653]">EUR {tableTotal.toFixed(2)}</span>
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

      <CustomerBottomNav activeTab="order" basePath={basePath} cartCount={cartCount > 0 ? cartCount : undefined} orderCount={1} />
    </CustomerMobileLayout>
  );
}
