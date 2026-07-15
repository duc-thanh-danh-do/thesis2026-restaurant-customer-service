"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MenuAdminHeader() {
  const pathname = usePathname();
  const isIngredientsTab = pathname.includes("/ingredients");
  const isDietaryTab = pathname.includes("/dietary")
  const isDishesTab = !isIngredientsTab && !isDietaryTab;

  return (
    <div className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white shrink-0">
      <div className="flex items-start gap-3 w-full">
        {/* Tabs */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Menu management
          </h2>

          <div className="flex items-center gap-2 mt-4">
            {/* Dishes Tab */}
            {isDishesTab ? ( 
              <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-sm font-semibold cursor-default shadow-sm">
                Dishes
              </span>
            ) : (
              <Link
                href="/menu/admin"
                className="text-slate-500 hover:text-slate-800 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                Dishes
              </Link>
            )}

            {/* Ingredients Tab */}
            {isIngredientsTab ? (
              <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-sm font-semibold cursor-default shadow-sm">
                Ingredients
              </span>
            ) : (
              <Link
                href="/menu/ingredients"
                className="text-slate-500 hover:text-slate-800 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                Ingredients
              </Link>
            )}

            {/* Dietary Tab */}
            {isDietaryTab ? (
              <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-sm font-semibold cursor-default shadow-sm">
                Dietary
              </span>
            ) : (
              <Link
                href="/menu/dietary"
                className="text-slate-500 hover:text-slate-800 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                Dietary
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
