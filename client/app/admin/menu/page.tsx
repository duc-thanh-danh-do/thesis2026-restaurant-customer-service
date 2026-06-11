"use client";

import React, { useState } from "react";
import Link from "next/link";
import AddDishDrawer from "@/components/staff/AddDishDrawer";

export default function MenuAdminPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-screen w-full bg-slate-50 overflow-hidden relative">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-start gap-3 w-full">
          <Link
            href="/admin/dashboard"
            className="mt-0.5 text-slate-400 hover:text-slate-800 transition-colors shrink-0"
            aria-label="Back to dashboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </Link>

          <div className="flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Manager
            </p>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Menu admin
            </h2>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-sm font-semibold cursor-default shadow-sm">
                  Dishes
                </span>
                <Link
                  href="/admin/ingredients"
                  className="text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                >
                  Ingredients
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 text-sm shadow-sm"
              >
                <span className="text-lg leading-none">+</span>
                Add dish
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        <p className="text-slate-400 text-sm mt-10 text-center">
          Menu list will be rendered here...
        </p>
      </div>

      <AddDishDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
