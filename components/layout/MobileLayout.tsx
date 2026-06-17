'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
}

export function MobileLayout({ children, className }: MobileLayoutProps) {
  return (
    <div className="min-h-dvh bg-[#f5f9fc]">
      <div className={cn(
        "relative flex min-h-dvh w-full flex-col overflow-hidden bg-white",
        className
      )}>
        {children}
      </div>
    </div>
  );
}

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: ReactNode;
}

export function MobileHeader({ title, subtitle, rightElement }: MobileHeaderProps) {
  return (
    <div className="bg-white border-b border-[#d5e1ec] px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#142653]">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {rightElement}
      </div>
    </div>
  );
}

interface MobileBottomNavProps {
  activeTab: 'menu' | 'cart' | 'order';
  cartCount?: number;
  orderCount?: number;
  onTabChange: (tab: 'menu' | 'cart' | 'order') => void;
}

export function MobileBottomNav({ activeTab, cartCount, orderCount, onTabChange }: MobileBottomNavProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#d5e1ec] px-6 py-3">
      <div className="flex justify-around items-center">
        <NavItem
          icon="utensils"
          label="Menu"
          active={activeTab === 'menu'}
          onClick={() => onTabChange('menu')}
        />
        <NavItem
          icon="shopping-bag"
          label="Cart"
          active={activeTab === 'cart'}
          count={cartCount}
          onClick={() => onTabChange('cart')}
        />
        <NavItem
          icon="clipboard-list"
          label="Order"
          active={activeTab === 'order'}
          count={orderCount}
          onClick={() => onTabChange('order')}
        />
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: string;
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}

function NavItem({ label, active, count, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-2 relative",
        active ? "text-[#438ed8]" : "text-gray-500"
      )}
    >
      <div className="relative">
        {/* Icon placeholder - will be replaced with lucide icons */}
        <div className="w-6 h-6 bg-current rounded opacity-20"></div>
        {count && count > 0 && (
          <div className="absolute -top-2 -right-2 bg-[#438ed8] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {count}
          </div>
        )}
      </div>
      <span className="text-xs">{label}</span>
    </button>
  );
}
